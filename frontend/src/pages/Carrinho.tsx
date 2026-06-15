import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi';
import { useCarrinho } from '../context/CarrinhoContext';
import { useAuth } from '../context/AuthContext';
import { TamanhoProduto, CorProduto } from '../types';
import { Icon } from '../components/Icon';
import { PAGAMENTO } from '../config/loja';
import { irParaLogin } from '../utils/authRedirect';
import { showToast } from '../utils/toast';

const Carrinho = () => {
  const { itens, removerItem, atualizarQuantidade, total } = useCarrinho();
  const { estaAutenticado } = useAuth();
  const navigate = useNavigate();

  const finalizarCompra = () => {
    if (PAGAMENTO.modo !== 'pix-manual' && !estaAutenticado) {
      showToast('Faça login para continuar a compra', 'info');
      irParaLogin(navigate, '/checkout');
      return;
    }
    navigate('/checkout');
  };

  return (
    <Container className="my-5">
      <h1 className="mb-4">Carrinho de Compras</h1>

      {itens.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <Icon icon={FiShoppingBag} size={64} className="text-muted mb-3" />
            <h4 className="text-muted mb-4">Seu carrinho está vazio</h4>
            <Button variant="primary" onClick={() => navigate('/')}>
              Continuar Comprando
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          <Col lg={8}>
            {itens.map((item, index) => (
              <Card key={`${item.produto.id}-${item.tamanho}-${item.cor}-${index}`} className="mb-3">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col xs={12} sm={3} md={2}>
                      {item.produto.imagens && item.produto.imagens.length > 0 ? (
                        <img
                          src={item.produto.imagens[0]}
                          alt={item.produto.nome}
                          className="img-fluid rounded"
                          style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: '120px' }}>
                          <span className="text-muted small">Sem imagem</span>
                        </div>
                      )}
                    </Col>
                    <Col xs={12} sm={9} md={10}>
                      <Row className="align-items-center">
                        <Col md={5}>
                          <h5 className="mb-2">{item.produto.nome}</h5>
                          {item.tamanho && (
                            <Badge bg="secondary" className="me-2">
                              Tamanho: {TamanhoProduto[item.tamanho]}
                            </Badge>
                          )}
                          {item.cor && (
                            <Badge bg="info">
                              Cor: {CorProduto[item.cor]}
                            </Badge>
                          )}
                          <p className="text-muted mb-0 mt-2">
                            R$ {item.produto.preco.toFixed(2)} cada
                          </p>
                        </Col>
                        <Col md={3}>
                          <div className="d-flex align-items-center gap-2">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() =>
                                atualizarQuantidade(
                                  item.produto.id,
                                  item.quantidade - 1,
                                  item.tamanho,
                                  item.cor
                                )
                              }
                            >
                              <Icon icon={FiMinus} />
                            </Button>
                            <span className="fw-bold">{item.quantidade}</span>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() =>
                                atualizarQuantidade(
                                  item.produto.id,
                                  item.quantidade + 1,
                                  item.tamanho,
                                  item.cor
                                )
                              }
                            >
                              <Icon icon={FiPlus} />
                            </Button>
                          </div>
                        </Col>
                        <Col md={2} className="text-end">
                          <h5 className="mb-0 text-primary">
                            R$ {(item.produto.preco * item.quantidade).toFixed(2)}
                          </h5>
                        </Col>
                        <Col md={2} className="text-end">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() =>
                              removerItem(item.produto.id, item.tamanho, item.cor)
                            }
                          >
                            <Icon icon={FiTrash2} />
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </Col>
          <Col lg={4}>
            <Card className="sticky-top" style={{ top: '100px' }}>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Resumo do Pedido</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-3">
                  <span className="fw-bold">Subtotal:</span>
                  <span className="fw-bold">R$ {total.toFixed(2)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <h4 className="mb-0">Total:</h4>
                  <h4 className="mb-0 text-primary">R$ {total.toFixed(2)}</h4>
                </div>
                <Button
                  variant="success"
                  size="lg"
                  className="w-100"
                  onClick={finalizarCompra}
                >
                  {estaAutenticado || PAGAMENTO.modo === 'pix-manual'
                    ? 'Finalizar Compra'
                    : 'Entrar e Finalizar Compra'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Carrinho;
