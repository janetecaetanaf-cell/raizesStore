import { useState, useEffect } from 'react';
import { Container, Table } from 'react-bootstrap';
import api from '../../services/api';
import { showToast } from '../../utils/toast';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefoneCelular: string;
  dataNascimento: string;
  cpf?: string;
  totalPedidos: number;
}

const AdminClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/clientes');
      setClientes(response.data);
    } catch (error) {
      showToast('Não foi possível carregar os clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string | Date) => {
    if (!data) return '-';
    try {
      const dataObj = typeof data === 'string' ? new Date(data) : data;
      if (isNaN(dataObj.getTime())) return '-';
      return dataObj.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const formatarCPF = (cpf?: string | null) => {
    if (!cpf) return '-';
    // Remove caracteres não numéricos
    const cpfLimpo = cpf.replace(/\D/g, '');
    // Formata CPF: 000.000.000-00
    if (cpfLimpo.length === 11) {
      return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  return (
    <Container className="my-5">
      <h1 className="mb-4">Clientes</h1>

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
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Data de Nascimento</th>
              <th>CPF</th>
              <th>Total de Pedidos</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted">
                  Nenhum cliente encontrado
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nome}</td>
                  <td>{cliente.email}</td>
                  <td>{cliente.telefoneCelular}</td>
                  <td>{formatarData(cliente.dataNascimento)}</td>
                  <td>{formatarCPF(cliente.cpf)}</td>
                  <td>{cliente.totalPedidos}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default AdminClientes;
