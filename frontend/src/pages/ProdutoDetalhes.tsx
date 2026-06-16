import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { FiShoppingCart, FiMinus, FiPlus } from 'react-icons/fi';
import api from '../services/api';
import { Produto, TamanhoProduto, CorProduto, TipoProduto } from '../types';
import { useCarrinho } from '../context/CarrinhoContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { irParaLogin } from '../utils/authRedirect';
import { Icon } from '../components/Icon';
import ProductImageCarousel from '../components/ProductImageCarousel';
import OptionSelector from '../components/OptionSelector';
import {
  getImagensExibidas,
  normalizarProduto,
  COR_PRODUTO_HEX,
  CORES_PADRAO_CAMISETA,
  CORES_PADRAO_CANECA,
  TAMANHOS_PADRAO_CAMISETA,
} from '../utils/produto';

const ProdutoDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<TamanhoProduto | ''>('');
  const [corSelecionada, setCorSelecionada] = useState<CorProduto | ''>('');
  const [quantidade, setQuantidade] = useState(1);
  const navigate = useNavigate();
  const { adicionarItem } = useCarrinho();
  const { estaAutenticado } = useAuth();

  useEffect(() => {
    if (id) {
      carregarProduto(id);
    }
  }, [id]);

  useEffect(() => {
    setTamanhoSelecionado('');
    setCorSelecionada('');
    setQuantidade(1);
  }, [produto?.id]);

  const carregarProduto = async (produtoId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/produtos/${produtoId}`);
      setProduto(normalizarProduto(response.data));
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      showToast('Não foi possível carregar o produto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tipo = produto ? Number(produto.tipoProduto) : null;

  const coresDisponiveis = useMemo(() => {
    if (!produto) return [];
    if (produto.coresDisponiveis.length > 0) return produto.coresDisponiveis;
    if (tipo === TipoProduto.Camiseta) return CORES_PADRAO_CAMISETA;
    if (tipo === TipoProduto.Caneca) return CORES_PADRAO_CANECA;
    return [];
  }, [produto, tipo]);

  const tamanhosDisponiveis = useMemo(() => {
    if (!produto) return [];
    if (produto.tamanhosDisponiveis.length > 0) return produto.tamanhosDisponiveis;
    if (tipo === TipoProduto.Camiseta) return TAMANHOS_PADRAO_CAMISETA;
    return [];
  }, [produto, tipo]);

  const opcoesTamanho = useMemo(
    () =>
      tamanhosDisponiveis.map((t) => ({
        value: t,
        label: TamanhoProduto[t],
      })),
    [tamanhosDisponiveis]
  );

  const opcoesCor = useMemo(
    () =>
      coresDisponiveis.map((c) => ({
        value: c,
        label: CorProduto[c],
        swatch: COR_PRODUTO_HEX[c],
      })),
    [coresDisponiveis]
  );

  const imagensExibidas = useMemo(
    () =>
      produto
        ? getImagensExibidas(produto, corSelecionada, coresDisponiveis)
        : [],
    [produto, corSelecionada, coresDisponiveis]
  );

  const carouselKey = `${produto?.id ?? 'prod'}-${corSelecionada || 'default'}-${imagensExibidas.length}`;

  const handleAdicionarAoCarrinho = () => {
    if (!estaAutenticado) {
      showToast('Crie sua conta ou faça login para adicionar produtos ao carrinho', 'info');
      irParaLogin(navigate, `/produto/${id}`);
      return;
    }

    if (!produto) return;

    if (tipo === TipoProduto.Camiseta) {
      if (!tamanhoSelecionado) {
        showToast('Selecione um tamanho', 'warning');
        return;
      }
      if (!corSelecionada) {
        showToast('Selecione uma cor', 'warning');
        return;
      }
    } else if (tipo === TipoProduto.Caneca) {
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
    <div className="product-detail-page">
      <Container className="my-4">
        <Row>
          <Col md={6}>
            <Card className="mb-4 product-detail-media-card">
              <ProductImageCarousel
                imagens={imagensExibidas}
                alt={produto.nome}
                carouselKey={carouselKey}
              />
            </Card>
          </Col>
          <Col md={6}>
            <Card className="product-detail-info-card">
              <Card.Body>
                <Badge bg="secondary" className="mb-3">
                  {produto.categoria?.nome}
                </Badge>
                <h1 className="mb-3">{produto.nome}</h1>
                <div className="product-detail-price mb-1">
                  R$ {produto.preco.toFixed(2).replace('.', ',')}
                </div>
                <p className="product-detail-pix mb-4">
                  R$ {(produto.preco * 0.95).toFixed(2).replace('.', ',')} com Pix (5% off)
                </p>

                <p className="text-muted mb-4">{produto.descricao}</p>

                {tipo === TipoProduto.Camiseta && (
                  <>
                    <OptionSelector
                      label="Tamanho"
                      opcoes={opcoesTamanho}
                      valorSelecionado={tamanhoSelecionado}
                      onChange={(v) => setTamanhoSelecionado(v)}
                      aviso="Cadastre os tamanhos deste produto no painel admin."
                    />
                    <OptionSelector
                      label="Cor"
                      opcoes={opcoesCor}
                      valorSelecionado={corSelecionada}
                      onChange={(v) => setCorSelecionada(v)}
                      aviso="Cadastre as cores deste produto no painel admin."
                    />
                  </>
                )}

                {tipo === TipoProduto.Caneca && (
                  <OptionSelector
                    label="Cor"
                    opcoes={opcoesCor}
                    valorSelecionado={corSelecionada}
                    onChange={(v) => setCorSelecionada(v)}
                    aviso="Cadastre as cores deste produto no painel admin."
                  />
                )}

                <div className="mb-3">
                  <p className="fw-bold mb-2">Quantidade</p>
                  <div className="d-flex align-items-center gap-3">
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    >
                      <Icon icon={FiMinus} />
                    </Button>
                    <span className="fw-bold fs-5">{quantidade}</span>
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={() => setQuantidade(quantidade + 1)}
                    >
                      <Icon icon={FiPlus} />
                    </Button>
                  </div>
                </div>

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
                    {produto.estoque === 0
                      ? 'Sem estoque'
                      : estaAutenticado
                        ? 'Adicionar ao Carrinho'
                        : 'Criar conta e Comprar'}
                  </Button>
                  <Button variant="outline-primary" onClick={() => navigate('/carrinho')}>
                    Ver Carrinho
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ProdutoDetalhes;
