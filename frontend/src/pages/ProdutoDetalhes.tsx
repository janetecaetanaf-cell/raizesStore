import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge, Alert } from 'react-bootstrap';
import { FiShoppingCart, FiMinus, FiPlus } from 'react-icons/fi';
import api from '../services/api';
import { Produto, TamanhoProduto, CorProduto, TipoProduto } from '../types';
import { useCarrinho } from '../context/CarrinhoContext';
import { showToast } from '../utils/toast';
import { Icon } from '../components/Icon';

const ProdutoDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<TamanhoProduto | ''>('');
  const [corSelecionada, setCorSelecionada] = useState<CorProduto | ''>('');
  const [quantidade, setQuantidade] = useState(1);
  const navigate = useNavigate();
  const { adicionarItem } = useCarrinho();

  useEffect(() => {
    if (id) {
      carregarProduto(id);
    }
  }, [id]);

  const carregarProduto = async (produtoId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/produtos/${produtoId}`);
      setProduto(response.data);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      showToast('Não foi possível carregar o produto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarAoCarrinho = () => {
    if (!produto) return;

    // Validar seleções baseado no tipo de produto
    if (produto.tipoProduto === TipoProduto.Camiseta) {
      if (!tamanhoSelecionado) {
        showToast('Selecione um tamanho', 'warning');
        return;
      }
      if (!corSelecionada) {
        showToast('Selecione uma cor', 'warning');
        return;
      }
    } else if (produto.tipoProduto === TipoProduto.Caneca) {
      if (!corSelecionada) {
        showToast('Selecione uma cor', 'warning');
        return;
      }
    }

    adicionarItem({
      produto,
      quantidade,
      tamanho: tamanhoSelecionado ? (tamanhoSelecionado as TamanhoProduto) : undefined,
      cor: corSelecionada ? (corSelecionada as CorProduto) : undefined,
    });

    showToast('Produto adicionado ao carrinho!', 'success');
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

  if (!produto) {
    return (
      <Container className="my-5">
        <Alert variant="danger">Produto não encontrado</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            {produto.imagens && produto.imagens.length > 0 ? (
              <Card.Img
                variant="top"
                src={produto.imagens[0]}
                alt={produto.nome}
                style={{ height: '500px', objectFit: 'cover' }}
              />
            ) : (
              <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '500px' }}>
                <span className="text-muted">Sem imagem</span>
              </div>
            )}
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Badge bg="secondary" className="mb-3">
                {produto.categoria?.nome}
              </Badge>
              <h1 className="mb-3">{produto.nome}</h1>
              <h2 className="text-primary mb-4">R$ {produto.preco.toFixed(2)}</h2>
              
              <p className="text-muted mb-4">{produto.descricao}</p>

              {produto.tipoProduto === TipoProduto.Camiseta && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Tamanho:</Form.Label>
                    <Form.Select
                      value={tamanhoSelecionado}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTamanhoSelecionado(v ? (Number(v) as TamanhoProduto) : '');
                      }}
                    >
                      <option value="">Selecione o tamanho</option>
                      {produto.tamanhosDisponiveis.map((tamanho) => (
                        <option key={tamanho} value={tamanho}>
                          {TamanhoProduto[tamanho]}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Cor:</Form.Label>
                    <Form.Select
                      value={corSelecionada}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCorSelecionada(v ? (Number(v) as CorProduto) : '');
                      }}
                    >
                      <option value="">Selecione a cor</option>
                      {produto.coresDisponiveis.map((cor) => (
                        <option key={cor} value={cor}>
                          {CorProduto[cor]}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </>
              )}

              {produto.tipoProduto === TipoProduto.Caneca && (
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Cor:</Form.Label>
                  <Form.Select
                    value={corSelecionada}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCorSelecionada(v ? (Number(v) as CorProduto) : '');
                    }}
                  >
                    <option value="">Selecione a cor</option>
                    {produto.coresDisponiveis.map((cor) => (
                      <option key={cor} value={cor}>
                        {CorProduto[cor]}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Quantidade:</Form.Label>
                <div className="d-flex align-items-center gap-3">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                  >
                    <Icon icon={FiMinus} />
                  </Button>
                  <span className="fw-bold fs-5">{quantidade}</span>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setQuantidade(quantidade + 1)}
                  >
                    <Icon icon={FiPlus} />
                  </Button>
                </div>
              </Form.Group>

              <p className="text-muted mb-4">
                <small>Estoque: {produto.estoque} unidades</small>
              </p>

              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAdicionarAoCarrinho}
                  disabled={produto.estoque === 0}
                >
                  <Icon icon={FiShoppingCart} className="me-2" />
                  {produto.estoque === 0 ? 'Sem estoque' : 'Adicionar ao Carrinho'}
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={() => navigate('/carrinho')}
                >
                  Ver Carrinho
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProdutoDetalhes;
