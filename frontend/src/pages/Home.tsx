import { useState, useEffect } from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Produto, Categoria } from "../types";
import { produtosDemo, categoriasDemo } from "../data/demoProdutos";
import { normalizarProduto } from "../utils/produto";
import ProductCard from "../components/ProductCard";
import TrustSection from "../components/TrustSection";

const CATEGORIAS_OCULTAS = ["Camisetas Religiosas", "Kits Ritualísticos"];

const filtrarCategorias = (cats: Categoria[]) =>
  cats.filter((c) => !CATEGORIAS_OCULTAS.includes(c.nome));

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
      setProdutos(
        categoriaSelecionada
          ? produtosDemo.filter((p) => p.categoriaId === categoriaSelecionada)
          : produtosDemo,
      );
      return;
    }

    carregarProdutosApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaSelecionada, usandoDemo]);

  const aplicarDemo = () => {
    setCategorias(filtrarCategorias(categoriasDemo));
    setProdutos(
      categoriaSelecionada
        ? produtosDemo.filter((p) => p.categoriaId === categoriaSelecionada)
        : produtosDemo,
    );
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
        setProdutos(
          produtosRes.data.map((p: Record<string, unknown>) =>
            normalizarProduto(p),
          ),
        );
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
        setProdutos(
          response.data.map((p: Record<string, unknown>) =>
            normalizarProduto(p),
          ),
        );
        return;
      }
    } catch {
      aplicarDemo();
    }
  };

  const destaques = produtos.slice(0, 8);

  return (
    <>
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-banner-pattern" />
        <Container className="hero-banner-content">
          <Row className="align-items-center">
            <Col lg={7}>
              <p className="hero-eyebrow">Artigos religiosos</p>
              <h1 className="hero-headline">Presentes que fortalecem a fé</h1>
              <p className="hero-description">
                Velas, incensos, guias, imagens de orixás, camisetas e canecas —
                tudo feito com respeito à tradição da Umbanda.
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
              <div className="hero-symbol">☽ ✦ ☾</div>
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
                Canecas, camisetas, guias e imagens com nomes, orixás, frases
                sagradas e artes exclusivas. Ajuda na criação da arte sem custo
                adicional.
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
