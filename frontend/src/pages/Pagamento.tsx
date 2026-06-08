import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Button, Spinner, Form, Row, Col } from 'react-bootstrap';
import api from '../services/api';
import { showToast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import FormasPagamento, { MetodoPagamento, DadosCartao } from '../components/FormasPagamento';
import {
  criptografarCartao,
  formatarMoeda,
  inicializarPagBank,
} from '../utils/pagseguro';

const Pagamento = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const pedidoId = searchParams.get('pedido') ?? '';

  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);
  const [publicKeyPagBank, setPublicKeyPagBank] = useState('');
  const [pagSeguroPronto, setPagSeguroPronto] = useState(false);
  const [cartaoDisponivel, setCartaoDisponivel] = useState(false);
  const [pagSeguroSandbox, setPagSeguroSandbox] = useState(false);
  const [numeroPedido, setNumeroPedido] = useState('');
  const [valorTotal, setValorTotal] = useState(0);
  const [metodo, setMetodo] = useState<MetodoPagamento>('pix');
  const [qrCodeImagem, setQrCodeImagem] = useState<string | null>(null);
  const [codigoPix, setCodigoPix] = useState<string | null>(null);
  const [cartao, setCartao] = useState<DadosCartao>({
    numero: '',
    nome: usuario?.nome ?? '',
    cvv: '',
    mes: '',
    ano: '',
  });
  const [cpfTitular, setCpfTitular] = useState('');

  useEffect(() => {
    if (!pedidoId) {
      setErroPagamento('Pedido não encontrado. Finalize uma compra primeiro.');
      setCarregando(false);
      return;
    }

    const preparar = async () => {
      try {
        const response = await api.get(`/pagamentos/sessao?pedidoId=${pedidoId}`);
        const chave = response.data.publicKey ?? response.data.PublicKey ?? '';
        const sdkUrl = response.data.checkoutSdkUrl ?? response.data.CheckoutSdkUrl;
        const cartaoOk = response.data.cartaoConfigurado ?? response.data.CartaoConfigurado;

        setValorTotal(Number(response.data.valorTotal ?? response.data.ValorTotal ?? 0));
        setNumeroPedido(response.data.numeroPedido ?? response.data.NumeroPedido ?? '');
        if (response.data.qrCodePix ?? response.data.QrCodePix) {
          setQrCodeImagem(response.data.qrCodePix ?? response.data.QrCodePix);
        }
        if (response.data.codigoPix ?? response.data.CodigoPix) {
          setCodigoPix(response.data.codigoPix ?? response.data.CodigoPix);
        }

        setCartaoDisponivel(Boolean(cartaoOk));
        setPagSeguroSandbox(Boolean(response.data.sandbox ?? response.data.Sandbox));
        setPublicKeyPagBank(chave);

        if (cartaoOk && chave && sdkUrl) {
          await inicializarPagBank(chave, sdkUrl);
        }

        setPagSeguroPronto(true);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        setErroPagamento(e.response?.data?.message || e.message || 'Não foi possível carregar o pagamento.');
      } finally {
        setCarregando(false);
      }
    };

    preparar();
  }, [pedidoId]);

  useEffect(() => {
    if (!pedidoId || !qrCodeImagem) return undefined;
    const intervalo = window.setInterval(async () => {
      try {
        const response = await api.post(`/pagamentos/sincronizar/${pedidoId}`);
        if (response.data.pago) navigate(`/pagamento/sucesso?pedido=${pedidoId}`);
      } catch {
        // ignora
      }
    }, 5000);
    return () => window.clearInterval(intervalo);
  }, [pedidoId, qrCodeImagem, navigate]);

  const pagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagSeguroPronto) return;

    setProcessando(true);
    setErroPagamento(null);
    try {
      if (metodo === 'pix') {
        const response = await api.post(`/pagamentos/pix/${pedidoId}`, {});
        if (response.data.pago) {
          navigate(`/pagamento/sucesso?pedido=${pedidoId}`);
          return;
        }
        setQrCodeImagem(response.data.qrCodeImagem ?? response.data.QrCodeImagem);
        setCodigoPix(response.data.codigoPixCopiaCola ?? response.data.CodigoPixCopiaCola);
        showToast('Pix gerado!', 'success');
        return;
      }

      if (!cartaoDisponivel || !publicKeyPagBank) {
        throw new Error('Pagamento com cartão indisponível. Configure a chave pública do PagBank.');
      }

      const encryptedCard = criptografarCartao(publicKeyPagBank, {
        holder: cartao.nome,
        number: cartao.numero,
        expMonth: cartao.mes,
        expYear: cartao.ano,
        securityCode: cartao.cvv,
      });

      const response = await api.post(`/pagamentos/cartao/${pedidoId}`, {
        EncryptedCard: encryptedCard,
        HolderName: cartao.nome,
        HolderCpf: cpfTitular,
        InstallmentQuantity: 1,
      });
      if (response.data.pago) {
        navigate(`/pagamento/sucesso?pedido=${pedidoId}`);
        return;
      }
      navigate(`/pagamento/pendente?pedido=${pedidoId}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = e.response?.data?.message || e.message || 'Erro ao pagar.';
      setErroPagamento(msg);
      showToast(msg, 'error');
    } finally {
      setProcessando(false);
    }
  };

  if (carregando) {
    return (
      <Container className="my-5 text-center" style={{ maxWidth: 720 }}>
        <Spinner animation="border" variant="primary" className="mb-3" />
        <p className="text-muted mb-0">Carregando pagamento...</p>
      </Container>
    );
  }

  return (
    <Container className="my-5" style={{ maxWidth: 720 }}>
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <h2 className="h4 mb-1">Pagamento</h2>
          {numeroPedido && <p className="text-muted mb-1">Pedido <strong>{numeroPedido}</strong></p>}
          <p className="fs-5 fw-semibold text-primary mb-4">{formatarMoeda(valorTotal)}</p>

          <Form onSubmit={pagar}>
            <FormasPagamento
              metodo={metodo}
              onMetodoChange={setMetodo}
              cartao={cartao}
              onCartaoChange={setCartao}
              total={valorTotal}
              pagSeguroPronto={pagSeguroPronto}
              preparandoPagamento={false}
              qrCodeImagem={qrCodeImagem}
              codigoPix={codigoPix}
              sandbox={pagSeguroSandbox}
              onCopiarPix={() => codigoPix && navigator.clipboard.writeText(codigoPix)}
              erroPagamento={erroPagamento}
            />

            {metodo === 'cartao' && !qrCodeImagem && (
              <Row className="g-3 mt-1">
                <Col md={6}>
                  <Form.Label>CPF do titular</Form.Label>
                  <Form.Control required value={cpfTitular} onChange={(e) => setCpfTitular(e.target.value)} />
                </Col>
              </Row>
            )}

            {!qrCodeImagem && !codigoPix && (
              <Button type="submit" variant="primary" className="mt-4" disabled={processando || !pagSeguroPronto}>
                {processando ? 'Processando...' : metodo === 'pix' ? 'Gerar Pix' : 'Pagar com cartão'}
              </Button>
            )}
          </Form>

          <Button variant="link" className="mt-3 p-0" onClick={() => navigate('/')}>
            ← Voltar à loja
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Pagamento;
