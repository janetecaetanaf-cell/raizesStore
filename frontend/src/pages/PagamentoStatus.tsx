import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { StatusPedido } from '../types';

type PagamentoVariant = 'sucesso' | 'pendente' | 'falha';

interface PagamentoStatusProps {
  variant: PagamentoVariant;
}

const VARIANT_CONFIG: Record<
  PagamentoVariant,
  { title: string; alert: 'success' | 'warning' | 'danger'; message: string }
> = {
  sucesso: {
    title: 'Pagamento confirmado',
    alert: 'success',
    message: 'Recebemos seu pagamento. Em breve você receberá novidades sobre o envio.',
  },
  pendente: {
    title: 'Pagamento pendente',
    alert: 'warning',
    message: 'Seu pedido foi criado, mas o pagamento ainda não foi confirmado.',
  },
  falha: {
    title: 'Pagamento não concluído',
    alert: 'danger',
    message: 'Não foi possível confirmar o pagamento. Você pode tentar novamente.',
  },
};

const PagamentoStatus = ({ variant }: PagamentoStatusProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pedidoId = searchParams.get('pedido') ?? '';

  const [numeroPedido, setNumeroPedido] = useState<string | null>(null);
  const [statusPedido, setStatusPedido] = useState<StatusPedido | null>(null);
  const [carregando, setCarregando] = useState(Boolean(pedidoId));

  const config = VARIANT_CONFIG[variant];

  useEffect(() => {
    if (!pedidoId) {
      setCarregando(false);
      return;
    }

    const sincronizar = async () => {
      try {
        const response = await api.post(`/pagamentos/sincronizar/${pedidoId}`);
        setNumeroPedido(response.data.numeroPedido ?? null);
        setStatusPedido(response.data.status ?? null);
      } catch {
        try {
          const pedidoResponse = await api.get(`/pedidos/${pedidoId}`);
          setNumeroPedido(pedidoResponse.data.numeroPedido ?? pedidoResponse.data.NumeroPedido);
          setStatusPedido(pedidoResponse.data.status ?? pedidoResponse.data.Status);
        } catch {
          // mantém mensagem padrão
        }
      } finally {
        setCarregando(false);
      }
    };

    sincronizar();
  }, [pedidoId]);

  const pago = statusPedido === StatusPedido.Pago;
  const titulo = pago ? VARIANT_CONFIG.sucesso.title : config.title;
  const alertVariant = pago ? 'success' : config.alert;
  const mensagem = pago ? VARIANT_CONFIG.sucesso.message : config.message;

  return (
    <Container className="my-5" style={{ maxWidth: 640 }}>
      <Card className="text-center py-4 px-3">
        <Card.Body>
          {carregando ? (
            <>
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p className="text-muted mb-0">Verificando pagamento...</p>
            </>
          ) : (
            <>
              <Alert variant={alertVariant}>{titulo}</Alert>
              <p className="text-muted">{mensagem}</p>
              {numeroPedido && (
                <p className="fw-semibold">
                  Pedido: <span className="text-primary">{numeroPedido}</span>
                </p>
              )}
              <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center mt-4">
                {(variant === 'falha' || variant === 'pendente') && pedidoId && !pago && (
                  <Button variant="primary" onClick={() => navigate(`/pagamento/pagar?pedido=${pedidoId}`)}>
                    Continuar pagamento
                  </Button>
                )}
                <Button variant="outline-primary" onClick={() => navigate('/')}>
                  Voltar à loja
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PagamentoStatus;
