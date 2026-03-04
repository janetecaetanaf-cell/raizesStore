import { useState, useEffect } from 'react';
import { Container, Table, Form, Badge } from 'react-bootstrap';
import api from '../../services/api';
import { StatusPedido } from '../../types';
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

const AdminPedidos = () => {
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<StatusPedido | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFiltro]);

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFiltro) params.status = statusFiltro;

      const response = await api.get('/admin/pedidos', { params });
      setPedidos(response.data);
    } catch (error) {
      showToast('Não foi possível carregar os pedidos', 'error');
    } finally {
      setLoading(false);
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

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Pedidos</h1>
        <Form.Select
          style={{ width: 'auto' }}
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
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted">
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
                      {StatusPedido[pedido.status]}
                    </Badge>
                  </td>
                  <td>{pedido.totalItens}</td>
                  <td>R$ {pedido.valorTotal.toFixed(2)}</td>
                  <td>{formatarData(pedido.dataCriacao)}</td>
                  <td>{pedido.dataPagamento ? formatarData(pedido.dataPagamento) : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default AdminPedidos;
