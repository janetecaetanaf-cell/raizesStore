import { useState, useEffect } from 'react';
import { Container, Table, Form, Badge, Button, Modal, ButtonGroup } from 'react-bootstrap';
import { FiCheck, FiTruck, FiPackage } from 'react-icons/fi';
import api from '../../services/api';
import { StatusPedido } from '../../types';
import { Icon } from '../../components/Icon';
import { showToast } from '../../utils/toast';

interface PedidoResumo {
  id: string;
  numeroPedido: string;
  clienteNome: string;
  clienteEmail: string;
  status: StatusPedido;
  valorTotal: number;
  dataCriacao: string;
  dataPagamento?: string;
  totalItens: number;
}

const STATUS_LABELS: Record<StatusPedido, string> = {
  [StatusPedido.AguardandoPagamento]: 'Aguardando Pagamento',
  [StatusPedido.Pago]: 'Pago',
  [StatusPedido.Enviado]: 'Enviado',
  [StatusPedido.Entregue]: 'Entregue',
  [StatusPedido.Cancelado]: 'Cancelado',
};

const AdminPedidos = () => {
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<StatusPedido | ''>('');
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const [pedidoEnvio, setPedidoEnvio] = useState<PedidoResumo | null>(null);
  const [codigoRastreamento, setCodigoRastreamento] = useState('');

  useEffect(() => {
    carregarPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFiltro]);

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const params: Record<string, StatusPedido> = {};
      if (statusFiltro) params.status = statusFiltro;

      const response = await api.get('/admin/pedidos', { params });
      setPedidos(response.data);
    } catch {
      showToast('Não foi possível carregar os pedidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmarPagamento = async (pedido: PedidoResumo) => {
    const ok = window.confirm(
      `Confirmar pagamento do pedido ${pedido.numeroPedido}?\n\nCliente: ${pedido.clienteNome}\nValor: R$ ${pedido.valorTotal.toFixed(2).replace('.', ',')}`
    );
    if (!ok) return;

    try {
      setProcessandoId(pedido.id);
      await api.post(`/pedidos/${pedido.id}/confirmar-pagamento`);
      showToast('Pagamento confirmado!', 'success');
      await carregarPedidos();
    } catch (error: unknown) {
      const err = error as { response?: { data?: string | { message?: string } } };
      const msg =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message ?? 'Não foi possível confirmar o pagamento';
      showToast(msg, 'error');
    } finally {
      setProcessandoId(null);
    }
  };

  const abrirModalEnvio = (pedido: PedidoResumo) => {
    setPedidoEnvio(pedido);
    setCodigoRastreamento('');
  };

  const confirmarEnvio = async () => {
    if (!pedidoEnvio) return;
    if (!codigoRastreamento.trim()) {
      showToast('Informe o código de rastreamento', 'warning');
      return;
    }

    try {
      setProcessandoId(pedidoEnvio.id);
      await api.post(`/pedidos/${pedidoEnvio.id}/enviar`, {
        CodigoRastreamento: codigoRastreamento.trim(),
      });
      showToast('Pedido marcado como enviado!', 'success');
      setPedidoEnvio(null);
      await carregarPedidos();
    } catch (error: unknown) {
      const err = error as { response?: { data?: string | { message?: string } } };
      const msg =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message ?? 'Não foi possível marcar como enviado';
      showToast(msg, 'error');
    } finally {
      setProcessandoId(null);
    }
  };

  const marcarEntregue = async (pedido: PedidoResumo) => {
    const ok = window.confirm(`Marcar o pedido ${pedido.numeroPedido} como entregue?`);
    if (!ok) return;

    try {
      setProcessandoId(pedido.id);
      await api.post(`/pedidos/${pedido.id}/entregue`);
      showToast('Pedido marcado como entregue!', 'success');
      await carregarPedidos();
    } catch (error: unknown) {
      const err = error as { response?: { data?: string | { message?: string } } };
      const msg =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message ?? 'Não foi possível marcar como entregue';
      showToast(msg, 'error');
    } finally {
      setProcessandoId(null);
    }
  };

  const getStatusBadge = (status: StatusPedido) => {
    const variants: Record<StatusPedido, string> = {
      [StatusPedido.AguardandoPagamento]: 'warning',
      [StatusPedido.Pago]: 'success',
      [StatusPedido.Enviado]: 'info',
      [StatusPedido.Entregue]: 'success',
      [StatusPedido.Cancelado]: 'danger',
    };
    return variants[status] || 'secondary';
  };

  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR');

  return (
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="mb-1">Pedidos</h1>
          <p className="text-muted mb-0 small">
            Recebeu o comprovante Pix? Clique em <strong>Confirmar pagamento</strong> no pedido.
          </p>
        </div>
        <Form.Select
          style={{ width: 'auto', minWidth: 220 }}
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as StatusPedido | '')}
        >
          <option value="">Todos os status</option>
          <option value={StatusPedido.AguardandoPagamento}>Aguardando Pagamento</option>
          <option value={StatusPedido.Pago}>Pago</option>
          <option value={StatusPedido.Enviado}>Enviado</option>
          <option value={StatusPedido.Entregue}>Entregue</option>
          <option value={StatusPedido.Cancelado}>Cancelado</option>
        </Form.Select>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nº Pedido</th>
              <th>Cliente</th>
              <th>Email</th>
              <th>Status</th>
              <th>Itens</th>
              <th>Valor Total</th>
              <th>Data Criação</th>
              <th>Data Pagamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-muted">
                  Nenhum pedido encontrado
                </td>
              </tr>
            ) : (
              pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td>{pedido.numeroPedido}</td>
                  <td>{pedido.clienteNome}</td>
                  <td>{pedido.clienteEmail}</td>
                  <td>
                    <Badge bg={getStatusBadge(pedido.status)}>
                      {STATUS_LABELS[pedido.status] ?? pedido.status}
                    </Badge>
                  </td>
                  <td>{pedido.totalItens}</td>
                  <td>R$ {pedido.valorTotal.toFixed(2).replace('.', ',')}</td>
                  <td>{formatarData(pedido.dataCriacao)}</td>
                  <td>{pedido.dataPagamento ? formatarData(pedido.dataPagamento) : '-'}</td>
                  <td>
                    <ButtonGroup size="sm" className="flex-wrap">
                      {pedido.status === StatusPedido.AguardandoPagamento && (
                        <Button
                          variant="success"
                          disabled={processandoId === pedido.id}
                          onClick={() => confirmarPagamento(pedido)}
                          title="Confirmar pagamento Pix"
                        >
                          <Icon icon={FiCheck} className="me-1" />
                          Confirmar pagamento
                        </Button>
                      )}
                      {pedido.status === StatusPedido.Pago && (
                        <Button
                          variant="primary"
                          disabled={processandoId === pedido.id}
                          onClick={() => abrirModalEnvio(pedido)}
                          title="Marcar como enviado"
                        >
                          <Icon icon={FiTruck} className="me-1" />
                          Enviar
                        </Button>
                      )}
                      {pedido.status === StatusPedido.Enviado && (
                        <Button
                          variant="info"
                          disabled={processandoId === pedido.id}
                          onClick={() => marcarEntregue(pedido)}
                          title="Marcar como entregue"
                        >
                          <Icon icon={FiPackage} className="me-1" />
                          Entregue
                        </Button>
                      )}
                    </ButtonGroup>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      <Modal show={!!pedidoEnvio} onHide={() => setPedidoEnvio(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Marcar pedido como enviado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pedidoEnvio && (
            <>
              <p className="mb-3">
                Pedido <strong>{pedidoEnvio.numeroPedido}</strong> — {pedidoEnvio.clienteNome}
              </p>
              <Form.Group>
                <Form.Label>Código de rastreamento *</Form.Label>
                <Form.Control
                  type="text"
                  value={codigoRastreamento}
                  onChange={(e) => setCodigoRastreamento(e.target.value)}
                  placeholder="Ex.: BR123456789BR"
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setPedidoEnvio(null)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={!pedidoEnvio || processandoId === pedidoEnvio?.id}
            onClick={confirmarEnvio}
          >
            Confirmar envio
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPedidos;
