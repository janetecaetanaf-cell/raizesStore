import { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FiUsers, FiShoppingCart, FiDollarSign, FiPackage, FiTruck } from 'react-icons/fi';
import { IconType } from 'react-icons';
import api from '../../services/api';
import { showToast } from '../../utils/toast';
import { Icon } from '../../components/Icon';

interface DashboardData {
  totalClientes: number;
  pedidosPagos: number;
  pedidosAguardandoPagamento: number;
  valorTotalVendas: number;
  pedidosEnviados: number;
  pedidosEntregues: number;
}

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setDashboard(response.data);
    } catch (error) {
      showToast('Não foi possível carregar o dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (!dashboard) {
    return null;
  }

  const stats: Array<{
    title: string;
    value: string | number;
    icon: IconType;
    color: string;
  }> = [
    {
      title: 'Total de Clientes',
      value: dashboard.totalClientes,
      icon: FiUsers,
      color: 'primary',
    },
    {
      title: 'Pedidos Pagos',
      value: dashboard.pedidosPagos,
      icon: FiShoppingCart,
      color: 'success',
    },
    {
      title: 'Aguardando Pagamento',
      value: dashboard.pedidosAguardandoPagamento,
      icon: FiPackage,
      color: 'warning',
    },
    {
      title: 'Valor Total Vendas',
      value: `R$ ${dashboard.valorTotalVendas.toFixed(2)}`,
      icon: FiDollarSign,
      color: 'info',
    },
    {
      title: 'Pedidos Enviados',
      value: dashboard.pedidosEnviados,
      icon: FiTruck,
      color: 'secondary',
    },
    {
      title: 'Pedidos Entregues',
      value: dashboard.pedidosEntregues,
      icon: FiTruck,
      color: 'success',
    },
  ];

  return (
    <Container className="my-5">
      <h1 className="mb-4">Dashboard Administrativo</h1>

      <Row className="g-4">
        {stats.map((stat, index) => (
          <Col key={index} xs={12} sm={6} md={4} lg={4}>
            <Card className="stats-card h-100">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-2 small">{stat.title}</p>
                    <h2 className={`stats-number text-${stat.color} mb-0`}>{stat.value}</h2>
                  </div>
                  <Icon icon={stat.icon} size={48} className={`text-${stat.color}`} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default AdminDashboard;
