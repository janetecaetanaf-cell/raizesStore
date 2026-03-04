import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiEye } from 'react-icons/fi';
import api from '../services/api';
import { Produto, Categoria, TipoProduto } from '../types';
import { Icon } from '../components/Icon';

const Home = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('');
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoProduto | ''>('');
  const navigate = useNavigate();
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const produtosSectionRef = useRef<HTMLDivElement>(null);

  const scrollToProdutos = () => {
    produtosSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    carregarCategorias();
    carregarProdutos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    carregarProdutos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaSelecionada, tipoSelecionado]);

  // Efeito parallax
  useEffect(() => {
    const handleScroll = () => {
      if (!heroSectionRef.current || !heroVideoRef.current) return;

      const heroSection = heroSectionRef.current;
      const rect = heroSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calcula a posição do scroll em relação à seção hero
      // Quando a seção está totalmente visível, parallax = 0
      // Quando a seção sai da tela, parallax aumenta
      const scrollProgress = Math.max(0, Math.min(1, 
        (windowHeight - rect.top) / (windowHeight + rect.height)
      ));
      
      // Aplica o efeito parallax apenas quando a seção está visível ou saindo
      if (rect.bottom >= 0 && rect.top <= windowHeight * 2) {
        // Move o vídeo para baixo mais devagar que o scroll (efeito parallax)
        // Multiplicador cria um efeito suave
        const parallaxOffset = scrollProgress * 150;
        heroVideoRef.current.style.transform = `translate(-50%, calc(-50% + ${parallaxOffset}px))`;
        
        // Efeito parallax mais sutil no conteúdo (move para cima enquanto scrolla)
        if (heroContentRef.current) {
          const contentOffset = scrollProgress * -30;
          heroContentRef.current.style.transform = `translateY(${contentOffset}px)`;
          heroContentRef.current.style.opacity = `${1 - scrollProgress * 0.3}`;
        }
      }
    };

    // Usa requestAnimationFrame para performance
    let ticking = false;
    const optimizedScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', optimizedScroll, { passive: true });
    handleScroll(); // Chama uma vez para posicionar inicialmente

    return () => {
      window.removeEventListener('scroll', optimizedScroll);
    };
  }, []);

  const carregarCategorias = async () => {
    try {
      const response = await api.get('/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarProdutos = async () => {
    try {
      const params: any = {};
      if (categoriaSelecionada) params.categoriaId = categoriaSelecionada;
      if (tipoSelecionado) params.tipoProduto = tipoSelecionado;
      
      const response = await api.get('/produtos', { params });
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <div ref={heroSectionRef} className="hero-section">
        <video 
          ref={heroVideoRef}
          className="hero-video" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="/videos/por-do-sol-mata.mp4" type="video/mp4" />
          {/* Seu navegador não suporta o elemento de vídeo. */}
        </video>
        <div className="hero-overlay"></div>
        <Container ref={heroContentRef} className="hero-content">
          <Row>
            <Col lg={8} className="mx-auto text-center">
              <div className="hero-title-container">
                <video 
                  className="hero-title-video-bg" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                >
                  <source src="/videos/por-do-sol-mata.mp4" type="video/mp4" />
                </video>
                <h1 className="hero-title">
                  <span className="hero-title-text">Raizes Store</span>
                </h1>
              </div>
              <p className="hero-subtitle">Descubra nossa coleção exclusiva ou seja você o criador</p>
              <Button 
                variant="outline-light" 
                size="lg" 
                className="hero-scroll-button mt-4"
                onClick={scrollToProdutos}
              >
                <Icon icon={FiChevronDown} className="me-2" />
                Ver Produtos
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container ref={produtosSectionRef} className="mb-5">
        {/* Filtros */}
        <Row className="mb-4">
          <Col md={6} lg={4}>
            <Form.Select
              value={categoriaSelecionada}
              onChange={(e) => setCategoriaSelecionada(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={6} lg={4}>
            <Form.Select
              value={tipoSelecionado}
              onChange={(e) => setTipoSelecionado(e.target.value as TipoProduto | '')}
            >
              <option value="">Todos os tipos</option>
              <option value={TipoProduto.Camiseta}>Camisetas</option>
              <option value={TipoProduto.Caneca}>Canecas</option>
              <option value={TipoProduto.Outros}>Outros</option>
            </Form.Select>
          </Col>
        </Row>

        {/* Grid de Produtos */}
        {produtos.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted fs-5">Nenhum produto encontrado</p>
          </div>
        ) : (
          <Row className="g-4">
            {produtos.map((produto) => (
              <Col key={produto.id} xs={12} sm={6} md={4} lg={3}>
                <Card className="product-card h-100">
                  {produto.imagens && produto.imagens.length > 0 ? (
                    <Card.Img
                      variant="top"
                      src={produto.imagens[0]}
                      alt={produto.nome}
                      className="product-image"
                    />
                  ) : (
                    <div className="product-image bg-light d-flex align-items-center justify-content-center">
                      <span className="text-muted">Sem imagem</span>
                    </div>
                  )}
                  <Card.Body className="product-card-body">
                    <div>
                      <Badge bg="secondary" className="mb-2">
                        {produto.categoria?.nome}
                      </Badge>
                      <Card.Title className="h5 mb-2">{produto.nome}</Card.Title>
                      <Card.Text className="text-muted small mb-3">
                        {produto.descricao.length > 80 
                          ? `${produto.descricao.substring(0, 80)}...` 
                          : produto.descricao}
                      </Card.Text>
                    </div>
                    <div>
                      <div className="price mb-3">R$ {produto.preco.toFixed(2)}</div>
                      <Button
                        variant="primary"
                        className="w-100"
                        onClick={() => navigate(`/produto/${produto.id}`)}
                      >
                        <Icon icon={FiEye} className="me-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
};

export default Home;
