import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useCarrinho } from '../context/CarrinhoContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { showToast } from '../utils/toast';
import { TamanhoProduto, CorProduto } from '../types';

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

  useEffect(() => {
    if (usuario) {
      setCliente({
        nome: usuario.nome,
        email: usuario.email,
        telefoneCelular: usuario.telefoneCelular,
        dataNascimento: '',
        cpf: '',
      });
    }
  }, [usuario]);

  const [endereco, setEndereco] = useState({
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!usuario) {
        showToast('Você precisa estar logado para finalizar a compra', 'error');
        navigate('/login');
        return;
      }

      // Validar campos obrigatórios
      if (!cliente.dataNascimento) {
        showToast('A data de nascimento é obrigatória', 'error');
        setLoading(false);
        return;
      }

      if (!endereco.cep || !endereco.logradouro || !endereco.numero || !endereco.bairro || !endereco.cidade || !endereco.estado) {
        showToast('Preencha todos os campos do endereço', 'error');
        setLoading(false);
        return;
      }

      console.log('Dados do cliente:', cliente);
      console.log('Dados do endereço:', endereco);

      // Buscar cliente completo com endereços
      let clienteCompleto;
      try {
        const clienteResponse = await api.get(`/clientes/${usuario.id}`);
        clienteCompleto = clienteResponse.data;
        console.log('Cliente encontrado:', clienteCompleto);
        
        // Atualizar dados do cliente (data de nascimento e CPF)
        const dataNascimentoFormatada = cliente.dataNascimento 
          ? new Date(cliente.dataNascimento).toISOString()
          : new Date().toISOString();
        
        console.log('Atualizando cliente com:', {
          Nome: cliente.nome || usuario.nome,
          Email: cliente.email || usuario.email,
          TelefoneCelular: cliente.telefoneCelular || usuario.telefoneCelular,
          DataNascimento: dataNascimentoFormatada,
          Cpf: cliente.cpf || null,
        });
        
        await api.put(`/clientes/${usuario.id}`, {
          Nome: cliente.nome || usuario.nome,
          Email: cliente.email || usuario.email,
          TelefoneCelular: cliente.telefoneCelular || usuario.telefoneCelular,
          DataNascimento: dataNascimentoFormatada,
          Cpf: cliente.cpf || null,
        });
        
        console.log('Cliente atualizado com sucesso');
        
        // Recarregar cliente atualizado
        const clienteAtualizadoResponse = await api.get(`/clientes/${usuario.id}`);
        clienteCompleto = clienteAtualizadoResponse.data;
        console.log('Cliente recarregado:', clienteCompleto);
      } catch (error: any) {
        console.error('Erro ao buscar/atualizar cliente:', error);
        if (error.response?.status === 404) {
          // Cliente não existe, criar novo
          const dataNascimentoFormatada = cliente.dataNascimento 
            ? new Date(cliente.dataNascimento).toISOString()
            : new Date().toISOString();
          
          console.log('Criando novo cliente com endereço');
          const novoCliente = await api.post('/clientes', {
            Nome: cliente.nome || usuario.nome,
            Email: cliente.email || usuario.email,
            TelefoneCelular: cliente.telefoneCelular || usuario.telefoneCelular,
            DataNascimento: dataNascimentoFormatada,
            Cpf: cliente.cpf || null,
            Endereco: {
              Cep: endereco.cep,
              Logradouro: endereco.logradouro,
              Numero: endereco.numero,
              Bairro: endereco.bairro,
              Cidade: endereco.cidade,
              Estado: endereco.estado,
              Complemento: endereco.complemento || null,
            },
          });
          clienteCompleto = novoCliente.data;
          console.log('Novo cliente criado:', clienteCompleto);
        } else {
          throw error;
        }
      }
      
      let enderecoId: string | undefined;

      // Verificar se já tem endereço cadastrado
      if (clienteCompleto.enderecos && clienteCompleto.enderecos.length > 0) {
        // Usar o primeiro endereço existente
        enderecoId = clienteCompleto.enderecos[0].id;
        console.log('Usando endereço existente:', enderecoId);
      } else {
        // Adicionar novo endereço ao cliente existente
        console.log('Adicionando novo endereço');
        const enderecoResponse = await api.post(`/clientes/${usuario.id}/enderecos`, {
          Cep: endereco.cep,
          Logradouro: endereco.logradouro,
          Numero: endereco.numero,
          Bairro: endereco.bairro,
          Cidade: endereco.cidade,
          Estado: endereco.estado,
          Complemento: endereco.complemento || null,
        });
        enderecoId = enderecoResponse.data.id;
        console.log('Endereço criado:', enderecoId);
      }

      if (!enderecoId) {
        throw new Error('Não foi possível obter o ID do endereço de entrega');
      }

      // Criar pedido usando o cliente logado
      console.log('Criando pedido com:', {
        clienteId: usuario.id,
        enderecoEntregaId: enderecoId,
        itens: itens.map((item) => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade,
          tamanho: item.tamanho,
          cor: item.cor,
        })),
      });

      const pedidoResponse = await api.post('/pedidos', {
        ClienteId: usuario.id,
        EnderecoEntregaId: enderecoId,
        Itens: itens.map((item) => ({
          ProdutoId: item.produto.id,
          Quantidade: item.quantidade,
          Tamanho: item.tamanho,
          Cor: item.cor,
        })),
      });

      console.log('Pedido criado com sucesso:', pedidoResponse.data);

      // Limpar carrinho apenas após sucesso
      limparCarrinho();
      showToast(`Pedido criado com sucesso! Número: ${pedidoResponse.data.numeroPedido}`, 'success');
      navigate('/');
    } catch (error: any) {
      showToast(
        error.response?.data?.message || 'Erro ao criar pedido. Tente novamente.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  if (itens.length === 0) {
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
                      value={cliente.nome}
                      onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                    />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control
                      type="email"
                      required
                      value={cliente.email}
                      onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                    />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label>Telefone Celular *</Form.Label>
                    <Form.Control
                      type="tel"
                      required
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
                      value={cliente.dataNascimento}
                      onChange={(e) =>
                        setCliente({ ...cliente, dataNascimento: e.target.value })
                      }
                    />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label>CPF</Form.Label>
                    <Form.Control
                      type="text"
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
                      value={endereco.cep}
                      onChange={(e) => setEndereco({ ...endereco, cep: e.target.value })}
                    />
                  </Col>

                  <Col md={8} className="mb-3">
                    <Form.Label>Logradouro *</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={endereco.logradouro}
                      onChange={(e) =>
                        setEndereco({ ...endereco, logradouro: e.target.value })
                      }
                    />
                  </Col>

                  <Col md={4} className="mb-3">
                    <Form.Label>Número *</Form.Label>
                    <Form.Control
                      type="text"
                      required
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
                      value={endereco.estado}
                      onChange={(e) =>
                        setEndereco({ ...endereco, estado: e.target.value.toUpperCase() })
                      }
                    />
                  </Col>

                  <Col md={12} className="mt-4">
                    <Button
                      type="submit"
                      variant="success"
                      size="lg"
                      className="w-100"
                      disabled={loading}
                    >
                      {loading ? 'Processando...' : 'Finalizar Pedido'}
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

            <Alert variant="warning" className="mt-3" style={{ position: 'relative', zIndex: 1 }}>
              <strong>Pagamento via PIX:</strong> Após finalizar o pedido, você receberá o código
              PIX e QR Code para pagamento.
            </Alert>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout;
