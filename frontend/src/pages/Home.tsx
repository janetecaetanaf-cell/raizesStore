import { useState, useEffect } from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Produto, Categoria, TipoProduto } from "../types";
import { produtosDemo, categoriasDemo } from "../data/demoProdutos";
import { normalizarProduto } from "../utils/produto";
import ProductCard from "../components/ProductCard";
import TrustSection from "../components/TrustSection";

const CATEGORIAS_OCULTAS = [
  "Camisetas Religiosas",
  "Kits Ritualísticos",
  "Velas e Incensos",
  "Guias e Fios",
  "Imagens e Quadros",
];

const filtrarCategorias = (cats: Categoria[]) =>
  cats.filter((c) => !CATEGORIAS_OCULTAS.includes(c.nome));

const DESTAQUES_POR_TIPO = 4;
/** Quantos produtos recentes entram no sorteio por tipo (novidades sempre no pool). */
const JANELA_DESTAQUES = 12;

const obterDataCriacao = (produto: Produto) =>
  produto.createdAt ? new Date(produto.createdAt).getTime() : 0;

const embaralhar = <T,>(lista: T[]): T[] => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

/** Sorteia entre os produtos mais recentes de um tipo. */
const amostrarDestaquesDoTipo = (lista: Produto[], limite: number): Produto[] => {
  const recentes = [...lista].sort((a, b) => obterDataCriacao(b) - obterDataCriacao(a));
  const pool = recentes.slice(0, Math.min(JANELA_DESTAQUES, recentes.length));
  return embaralhar(pool).slice(0, limite);
};

/** Na aba Todos: equilibra camisetas e canecas com novidades; em categoria, os 8 mais recentes. */
const selecionarDestaques = (lista: Produto[], categoriaId: string): Produto[] => {
  if (categoriaId) {
    return [...lista]
      .sort((a, b) => obterDataCriacao(b) - obterDataCriacao(a))
      .slice(0, 8);
  }

  const camisetas = amostrarDestaquesDoTipo(
    lista.filter((p) => p.tipoProduto === TipoProduto.Camiseta),
    DESTAQUES_POR_TIPO,
  );
  const canecas = amostrarDestaquesDoTipo(
    lista.filter((p) => p.tipoProduto === TipoProduto.Caneca),
    DESTAQUES_POR_TIPO,
  );

  return embaralhar([...camisetas, ...canecas]);
};

const Home = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");
  const [usandoDemo, setUsandoDemo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    carregarLoja();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (usandoDemo) {
      const filtrados = categoriaSelecionada
        ? produtosDemo.filter((p) => p.categoriaId === categoriaSelecionada)
        : produtosDemo;
      setProdutos(selecionarDestaques(filtrados, categoriaSelecionada));
      return;
    }

    carregarProdutosApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaSelecionada, usandoDemo]);

  const aplicarDemo = () => {
    setCategorias(filtrarCategorias(categoriasDemo));
    const filtrados = categoriaSelecionada
      ? produtosDemo.filter((p) => p.categoriaId === categoriaSelecionada)
      : produtosDemo;
    setProdutos(selecionarDestaques(filtrados, categoriaSelecionada));
    setUsandoDemo(true);
  };

  const carregarLoja = async () => {
    try {
      const [categoriasRes, produtosRes] = await Promise.all([
        api.get("/categorias"),
        api.get("/produtos"),
      ]);

      if (categoriasRes.data?.length > 0 && produtosRes.data?.length > 0) {
        setCategorias(filtrarCategorias(categoriasRes.data));
        const lista = produtosRes.data.map((p: Record<string, unknown>) =>
          normalizarProduto(p),
        );
        setProdutos(selecionarDestaques(lista, ""));
        setUsandoDemo(false);
        return;
      }
    } catch {
      // cai no demo completo abaixo
    }

    setCategoriaSelecionada("");
    aplicarDemo();
  };

  const carregarProdutosApi = async () => {
    try {
      const params: Record<string, string> = {};
      if (categoriaSelecionada) params.categoriaId = categoriaSelecionada;

      const response = await api.get("/produtos", { params });
      if (response.data?.length > 0) {
        const lista = response.data.map((p: Record<string, unknown>) =>
          normalizarProduto(p),
        );
        setProdutos(selecionarDestaques(lista, categoriaSelecionada));
        return;
      }
    } catch {
      aplicarDemo();
    }
  };

  const destaques = produtos;

  return (
    <>
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-banner-pattern" />
        <Container className="hero-banner-content">
          <Row className="align-items-center">
            <Col lg={7}>
              <p className="hero-eyebrow">Estampas personalizadas</p>
              <h1 className="hero-headline">Sua ideia estampada do seu jeito</h1>
              <p className="hero-description">
                Criamos estampas exclusivas para camisetas e canecas — aniversários,
                empresas, times, pets, eventos e qualquer tema que você imaginar.
              </p>
              <button
                type="button"
                className="hero-cta"
                onClick={() =>
                  document
                    .getElementById("destaques")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Ver destaques
              </button>
            </Col>
            <Col lg={5} className="d-none d-lg-block">
              <div className="hero-symbol">
                <img src="/images/logo-raizes-circulo.png" alt="Raízes Estampas" className="hero-logo" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Categorias em pills */}
      <section className="categories-nav">
        <Container>
          <Nav className="category-pills justify-content-center flex-wrap">
            <Nav.Link
              active={!categoriaSelecionada}
              onClick={() => setCategoriaSelecionada("")}
              className="category-pill"
            >
              Todos
            </Nav.Link>
            {categorias.map((cat) => (
              <Nav.Link
                key={cat.id}
                active={categoriaSelecionada === cat.id}
                onClick={() => setCategoriaSelecionada(cat.id)}
                className="category-pill"
              >
                {cat.nome}
              </Nav.Link>
            ))}
          </Nav>
        </Container>
      </section>

      {/* Destaques */}
      <section id="destaques" className="destaques-section">
        <Container>
          <h2 className="section-title text-center">Destaques</h2>
          {usandoDemo && (
            <p className="text-center demo-notice">
              Catálogo de demonstração — cadastre produtos no painel admin para
              substituir estes itens.
            </p>
          )}
          {destaques.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted fs-5">
                Nenhum produto encontrado nesta categoria
              </p>
            </div>
          ) : (
            <Row className="g-4">
              {destaques.map((produto) => (
                <Col key={produto.id} xs={6} md={4} lg={3}>
                  <ProductCard
                    produto={produto}
                    onComprar={(p) =>
                      !p.id.startsWith("demo-") && navigate(`/produto/${p.id}`)
                    }
                  />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Banner informativo */}
      <section className="info-banner">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h3>Personalizamos do seu jeito</h3>
              <p>
                Camisetas e canecas com nomes, frases, logos, fotos e artes
                exclusivas. Ajuda na criação da estampa sem custo adicional.
              </p>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <a href="/atendimento" className="info-banner-link">
                Fale conosco →
              </a>
            </Col>
          </Row>
        </Container>
      </section>

      <TrustSection />
    </>
  );
};

export default Home;
