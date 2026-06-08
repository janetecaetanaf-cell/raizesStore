import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useCarrinho } from '../context/CarrinhoContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { showToast } from '../utils/toast';
import { formatarCep, limparCep, buscarEnderecoPorCep } from '../utils/cep';
import { TamanhoProduto, CorProduto } from '../types';
import FormasPagamento, { MetodoPagamento, DadosCartao } from '../components/FormasPagamento';
import {
  criptografarCartao,
  inicializarPagBank,
} from '../utils/pagseguro';

const Checkout = () => {
  const { itens, total, limparCarrinho } = useCarrinho();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState({
    nome: '',
    email: '',
    telefoneCelular: '',
    dataNascimento: '',
    cpf: '',
  });

  const [endereco, setEndereco] = useState({
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: '',
  });

  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('pix');
  const [cartao, setCartao] = useState<DadosCartao>({
    numero: '',
    nome: '',
    cvv: '',
    mes: '',
    ano: '',
  });

  const [publicKeyPagBank, setPublicKeyPagBank] = useState('');
  const [preparandoPagamento, setPreparandoPagamento] = useState(true);
  const [pagSeguroPronto, setPagSeguroPronto] = useState(false);
  const [cartaoDisponivel, setCartaoDisponivel] = useState(false);
  const [pagSeguroSandbox, setPagSeguroSandbox] = useState(false);
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);

  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [qrCodeImagem, setQrCodeImagem] = useState<string | null>(null);
  const [codigoPix, setCodigoPix] = useState<string | null>(null);
  const [aguardandoPix, setAguardandoPix] = useState(false);

  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const ultimoCepBuscado = useRef('');
  const numeroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (usuario) {
      setCliente({
        nome: usuario.nome,
        email: usuario.email,
        telefoneCelular: usuario.telefoneCelular,
        dataNascimento: '',
        cpf: '',
      });
      setCartao((prev) => ({ ...prev, nome: usuario.nome }));
    }
  }, [usuario]);

  useEffect(() => {
    const prepararPagSeguro = async () => {
      try {
        const response = await api.get('/pagamentos/config');
        const configurado = response.data.configurado ?? response.data.Configurado;
        const chave = response.data.publicKey ?? response.data.PublicKey ?? '';
        const sdkUrl = response.data.checkoutSdkUrl ?? response.data.CheckoutSdkUrl;
        const cartaoOk = response.data.cartaoConfigurado ?? response.data.CartaoConfigurado;

        if (!configurado) {
          throw new Error('PagSeguro não configurado no servidor.');
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
        setErroPagamento(e.response?.data?.message || e.message || 'Pagamento online indisponível.');
      } finally {
        setPreparandoPagamento(false);
      }
    };

    prepararPagSeguro();
  }, []);

  useEffect(() => {
    if (!pedidoId || !aguardandoPix) return undefined;

    const intervalo = window.setInterval(async () => {
      try {
        const response = await api.post(`/pagamentos/sincronizar/${pedidoId}`);
        if (response.data.pago) {
          limparCarrinho();
          navigate(`/pagamento/sucesso?pedido=${pedidoId}`);
        }
      } catch {
        // ignora falhas temporárias
      }
    }, 5000);

    return () => window.clearInterval(intervalo);
  }, [pedidoId, aguardandoPix, navigate, limparCarrinho]);

  const preencherEnderecoPorCep = async (cepDigitos: string) => {
    if (cepDigitos.length !== 8 || cepDigitos === ultimoCepBuscado.current) return;

    setBuscandoCep(true);
    try {
      const dados = await buscarEnderecoPorCep(cepDigitos);
      if (!dados) {
        ultimoCepBuscado.current = '';
        showToast('CEP não encontrado. Verifique e tente novamente.', 'error');
        return;
      }

      ultimoCepBuscado.current = cepDigitos;
      setEndereco((prev) => ({
        ...prev,
        cep: formatarCep(cepDigitos),
        logradouro: dados.logradouro || prev.logradouro,
        bairro: dados.bairro || prev.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
        complemento: dados.complemento || prev.complemento,
      }));
      numeroInputRef.current?.focus();
    } catch {
      ultimoCepBuscado.current = '';
      showToast('Não foi possível buscar o CEP. Tente novamente.', 'error');
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (valor: string) => {
    const cepFormatado = formatarCep(valor);
    setEndereco((prev) => ({ ...prev, cep: cepFormatado }));

    const digitos = limparCep(cepFormatado);
    if (digitos.length < 8) {
      ultimoCepBuscado.current = '';
    } else if (digitos.length === 8) {
      preencherEnderecoPorCep(digitos);
    }
  };

  const processarPagamento = async (idPedido: string) => {
    if (metodoPagamento === 'pix') {
      const response = await api.post(`/pagamentos/pix/${idPedido}`, {});
      const qr = response.data.qrCodeImagem ?? response.data.QrCodeImagem;
      const copiaCola = response.data.codigoPixCopiaCola ?? response.data.CodigoPixCopiaCola;

      if (response.data.pago) {
        limparCarrinho();
        navigate(`/pagamento/sucesso?pedido=${idPedido}`);
        return;
      }

      if (qr) setQrCodeImagem(qr);
      if (copiaCola) setCodigoPix(copiaCola);
      if (!qr && !copiaCola) {
        throw new Error('PagSeguro não retornou QR Code Pix.');
      }

      setPedidoId(idPedido);
      setAguardandoPix(true);
      showToast('Pix gerado! Pague para concluir o pedido.', 'success');
      return;
    }

    if (!cartaoDisponivel || !publicKeyPagBank) {
      throw new Error('Pagamento com cartão indisponível. Configure a chave pública do PagBank.');
    }

    if (!cliente.cpf?.trim()) {
      throw new Error('Informe o CPF para pagamento com cartão.');
    }

    const encryptedCard = criptografarCartao(publicKeyPagBank, {
      holder: cartao.nome,
      number: cartao.numero,
      expMonth: cartao.mes,
      expYear: cartao.ano,
      securityCode: cartao.cvv,
    });

    const response = await api.post(`/pagamentos/cartao/${idPedido}`, {
      EncryptedCard: encryptedCard,
      HolderName: cartao.nome,
      HolderCpf: cliente.cpf,
      InstallmentQuantity: 1,
    });

    limparCarrinho();

    if (response.data.pago) {
      showToast('Pagamento aprovado!', 'success');
      navigate(`/pagamento/sucesso?pedido=${idPedido}`);
      return;
    }

    showToast('Pagamento em análise.', 'info');
    navigate(`/pagamento/pendente?pedido=${idPedido}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (aguardandoPix) return;

    setLoading(true);
    setErroPagamento(null);

    try {
      if (!usuario) return;

      if (!pagSeguroPronto) {
        showToast('Aguarde o carregamento das formas de pagamento.', 'warning');
        return;
      }

      if (!cliente.dataNascimento) {
        showToast('A data de nascimento é obrigatória', 'error');
        return;
      }

      if (!endereco.cep || !endereco.logradouro || !endereco.numero || !endereco.bairro || !endereco.cidade || !endereco.estado) {
        showToast('Preencha todos os campos do endereço', 'error');
        return;
      }

      if (!cliente.cpf?.trim()) {
        showToast('Informe o CPF para concluir o pagamento.', 'error');
        return;
      }

      const itensValidos = itens.filter((item) => !item.produto.id.startsWith('demo-'));
      if (itensValidos.length === 0) {
        showToast('Os produtos do carrinho não estão disponíveis. Adicione itens da loja novamente.', 'error');
        return;
      }

      const dataNascimentoFormatada = new Date(cliente.dataNascimento).toISOString();

      const response = await api.post('/checkout/finalizar', {
        Nome: cliente.nome || usuario.nome,
        Email: cliente.email || usuario.email,
        TelefoneCelular: cliente.telefoneCelular || usuario.telefoneCelular,
        DataNascimento: dataNascimentoFormatada,
        Cpf: cliente.cpf?.trim() || null,
        Cep: endereco.cep,
        Logradouro: endereco.logradouro,
        Numero: endereco.numero,
        Bairro: endereco.bairro,
        Cidade: endereco.cidade,
        Estado: endereco.estado,
        Complemento: endereco.complemento || null,
        Itens: itensValidos.map((item) => ({
          ProdutoId: item.produto.id,
          Quantidade: item.quantidade,
          Tamanho: item.tamanho ?? null,
          Cor: item.cor ?? null,
        })),
      });

      const idPedido = String(response.data.pedidoId ?? response.data.PedidoId);
      const numeroPedido = response.data.numeroPedido ?? response.data.NumeroPedido;

      await processarPagamento(idPedido);

      if (metodoPagamento === 'pix' && numeroPedido) {
        showToast(`Pedido ${numeroPedido} — pague o Pix abaixo para confirmar.`, 'info');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Erro ao finalizar compra. Tente novamente.';
      setErroPagamento(msg);
      showToast(typeof msg === 'string' ? msg : 'Erro ao finalizar compra.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copiarPix = async () => {
    if (!codigoPix) return;
    await navigator.clipboard.writeText(codigoPix);
    showToast('Código Pix copiado!', 'success');
  };

  if (itens.length === 0 && !aguardandoPix) {
    return (
      <Container className="my-5">
        <Card className="text-center py-5">
          <Card.Body>
            <Alert variant="info">Seu carrinho está vazio</Alert>
            <Button variant="primary" onClick={() => navigate('/')}>
              Continuar Comprando
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const textoBotao = aguardandoPix
    ? 'Aguardando pagamento Pix...'
    : loading
      ? 'Processando...'
      : metodoPagamento === 'pix'
        ? 'Finalizar compra e gerar Pix'
        : 'Finalizar compra e pagar';

  return (
    <Container className="my-5">
      <h1 className="mb-4">Finalizar Compra</h1>

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Dados do Cliente</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={12} className="mb-3">
                    <Form.Label>Nome Completo *</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      disabled={aguardandoPix}
                      value={cliente.nome}
                      onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                    />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control
                      type="email"
                      required
                      disabled={aguardandoPix}
                      value={cliente.email}
                      onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                    />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label>Telefone Celular *</Form.Label>
                    <Form.Control
                      type="tel"
                      required
                      disabled={aguardandoPix}
                      value={cliente.telefoneCelular}
                      onChange={(e) =>
                        setCliente({ ...cliente, telefoneCelular: e.target.value })
                      }
                    />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label>Data de Nascimento *</Form.Label>
                    <Form.Control
                      type="date"
                      required
                      disabled={aguardandoPix}
                      value={cliente.dataNascimento}
                      onChange={(e) =>
                        setCliente({ ...cliente, dataNascimento: e.target.value })
                      }
                    />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label>CPF *</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      disabled={aguardandoPix}
                      value={cliente.cpf}
                      onChange={(e) => setCliente({ ...cliente, cpf: e.target.value })}
                    />
                  </Col>

                  <Col md={12}>
                    <hr />
                    <h5 className="mb-3">Endereço de Entrega</h5>
                  </Col>

                  <Col md={4} className="mb-3">
                    <Form.Label>CEP *</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      inputMode="numeric"
                      placeholder="00000-000"
                      maxLength={9}
                      disabled={aguardandoPix || buscandoCep}
                      value={endereco.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      onBlur={() => preencherEnderecoPorCep(limparCep(endereco.cep))}
                    />
                    {buscandoCep && (
                      <Form.Text className="text-muted">Buscando endereço...</Form.Text>
                    )}
                  </Col>

                  <Col md={8} className="mb-3">
                    <Form.Label>Logradouro *</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      disabled={aguardandoPix}
                      value={endereco.logradouro}
                      onChange={(e) =>
                        setEndereco({ ...endereco, logradouro: e.target.value })
                      }
                    />
                  </Col>

                  <Col md={4} className="mb-3">
                    <Form.Label>Número *</Form.Label>
                    <Form.Control
                      ref={numeroInputRef}
                      type="text"
                      required
                      disabled={aguardandoPix}
                      value={endereco.numero}
                      onChange={(e) =>
                        setEndereco({ ...endereco, numero: e.target.value })
                      }
                    />
                  </Col>

                  <Col md={8} className="mb-3">
                    <Form.Label>Complemento</Form.Label>
                    <Form.Control
                      type="text"
                      disabled={aguardandoPix}
                      value={endereco.complemento}
                      onChange={(e) =>
                        setEndereco({ ...endereco, complemento: e.target.value })
                      }
                    />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label>Bairro *</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      disabled={aguardandoPix}
                      value={endereco.bairro}
                      onChange={(e) =>
                        setEndereco({ ...endereco, bairro: e.target.value })
                      }
                    />
                  </Col>

                  <Col md={4} className="mb-3">
                    <Form.Label>Cidade *</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      disabled={aguardandoPix}
                      value={endereco.cidade}
                      onChange={(e) =>
                        setEndereco({ ...endereco, cidade: e.target.value })
                      }
                    />
                  </Col>

                  <Col md={2} className="mb-3">
                    <Form.Label>Estado *</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      maxLength={2}
                      disabled={aguardandoPix}
                      value={endereco.estado}
                      onChange={(e) =>
                        setEndereco({ ...endereco, estado: e.target.value.toUpperCase() })
                      }
                    />
                  </Col>

                  <Col md={12}>
                    <hr />
                    <FormasPagamento
                      metodo={metodoPagamento}
                      onMetodoChange={setMetodoPagamento}
                      cartao={cartao}
                      onCartaoChange={setCartao}
                      total={total}
                      pagSeguroPronto={pagSeguroPronto}
                      preparandoPagamento={preparandoPagamento}
                      qrCodeImagem={qrCodeImagem}
                      codigoPix={codigoPix}
                      sandbox={pagSeguroSandbox}
                      onCopiarPix={copiarPix}
                      erroPagamento={erroPagamento}
                    />
                  </Col>

                  <Col md={12} className="mt-4">
                    <Button
                      type="submit"
                      variant="success"
                      size="lg"
                      className="w-100"
                      disabled={loading || aguardandoPix || !pagSeguroPronto}
                    >
                      {textoBotao}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <div className="sticky-top" style={{ top: '100px', zIndex: 10 }}>
            <Card>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Resumo do Pedido</h5>
              </Card.Header>
              <Card.Body>
                {itens.map((item, index) => (
                  <div key={index} className="d-flex justify-content-between mb-2">
                    <div>
                      <small className="fw-bold">{item.produto.nome}</small>
                      <br />
                      <small className="text-muted">
                        {item.tamanho && `Tamanho: ${TamanhoProduto[item.tamanho]} `}
                        {item.cor && `Cor: ${CorProduto[item.cor]}`}
                      </small>
                      <br />
                      <small className="text-muted">Qtd: {item.quantidade}</small>
                    </div>
                    <div className="text-end">
                      <small className="fw-bold">
                        R$ {(item.produto.preco * item.quantidade).toFixed(2)}
                      </small>
                    </div>
                  </div>
                ))}
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <h5 className="mb-0">Total:</h5>
                  <h5 className="mb-0 text-primary">R$ {total.toFixed(2)}</h5>
                </div>
              </Card.Body>
            </Card>

            <Alert variant="light" className="mt-3 small border">
              Escolha <strong>Pix</strong> ou <strong>Cartão</strong> abaixo dos seus dados e clique em finalizar.
              Tudo na mesma página, como nas lojas online.
            </Alert>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout;
