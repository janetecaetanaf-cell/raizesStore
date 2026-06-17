import { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Nav, Spinner } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { Produto, Categoria } from "../types";
import { produtosDemo, categoriasDemo } from "../data/demoProdutos";
import { normalizarProduto } from "../utils/produto";
import {
  getCategoriasRaiz,
  getSubcategorias,
  normalizarCategorias,
  selecionarDestaquesPorLinha,
} from "../utils/categorias";
import ProductCard from "../components/ProductCard";
import TrustSection from "../components/TrustSection";

const Home = () => {
  const [destaques, setDestaques] = useState<Produto[]>([]);
  const [produtosSubcategoria, setProdutosSubcategoria] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaPaiSelecionada, setCategoriaPaiSelecionada] = useState("");
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState("");
  const [usandoDemo, setUsandoDemo] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregandoCategoria, setCarregandoCategoria] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const categoriasRaiz = useMemo(() => getCategoriasRaiz(categorias), [categorias]);
  const subcategorias = useMemo(
    () => (categoriaPaiSelecionada ? getSubcategorias(categorias, categoriaPaiSelecionada) : []),
    [categorias, categoriaPaiSelecionada],
  );

  const emVariados = !categoriaPaiSelecionada && !subcategoriaSelecionada;

  const tituloCatalogo = useMemo(() => {
    const sub = categorias.find((c) => c.id === subcategoriaSelecionada);
    const pai = categorias.find((c) => c.id === categoriaPaiSelecionada);
    if (sub && pai) return `${pai.nome} › ${sub.nome}`;
    return sub?.nome ?? "";
  }, [categorias, subcategoriaSelecionada, categoriaPaiSelecionada]);

  useEffect(() => {
    let ativo = true;

    const carregarInicio = async () => {
      setCarregandoInicial(true);
      try {
        const [categoriasRes, produtosRes] = await Promise.all([
          api.get("/categorias"),
          api.get("/produtos"),
        ]);

        if (!ativo) return;

        const cats = normalizarCategorias(categoriasRes.data ?? []);
        const lista = (produtosRes.data ?? []).map((p: Record<string, unknown>) =>
          normalizarProduto(p),
        );

        if (cats.length > 0) {
          setCategorias(cats);
          setDestaques(selecionarDestaquesPorLinha(lista, cats));
          setUsandoDemo(false);
        } else {
          setCategorias(categoriasDemo);
          setDestaques(selecionarDestaquesPorLinha(produtosDemo, categoriasDemo));
          setUsandoDemo(true);
        }
        setCategoriaPaiSelecionada("");
        setSubcategoriaSelecionada("");
        setProdutosSubcategoria([]);
      } catch {
        if (!ativo) return;
        setCategorias(categoriasDemo);
        setDestaques(selecionarDestaquesPorLinha(produtosDemo, categoriasDemo));
        setUsandoDemo(true);
        setCategoriaPaiSelecionada("");
        setSubcategoriaSelecionada("");
        setProdutosSubcategoria([]);
      } finally {
        if (ativo) {
          setCarregandoInicial(false);
        }
      }
    };

    carregarInicio();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (location.pathname === "/" && (location.state as { reset?: boolean })?.reset) {
      setCategoriaPaiSelecionada("");
      setSubcategoriaSelecionada("");
      setProdutosSubcategoria([]);
      navigate(".", { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!subcategoriaSelecionada || usandoDemo) {
      if (!subcategoriaSelecionada) {
        setProdutosSubcategoria([]);
      } else if (usandoDemo) {
        setProdutosSubcategoria(
          produtosDemo.filter((p) => p.categoriaId === subcategoriaSelecionada),
        );
      }
      return;
    }

    let ativo = true;

    const carregarCategoria = async () => {
      setCarregandoCategoria(true);
      try {
        const response = await api.get("/produtos", {
          params: { categoriaId: subcategoriaSelecionada },
        });
        if (!ativo) return;
        const lista = (response.data ?? []).map((p: Record<string, unknown>) =>
          normalizarProduto(p),
        );
        setProdutosSubcategoria(lista);
      } catch {
        if (!ativo) return;
        setProdutosSubcategoria([]);
      } finally {
        if (ativo) {
          setCarregandoCategoria(false);
        }
      }
    };

    carregarCategoria();

    return () => {
      ativo = false;
    };
  }, [subcategoriaSelecionada, usandoDemo]);

  const selecionarCategoriaRaiz = (id: string) => {
    if (categoriaPaiSelecionada === id && !subcategoriaSelecionada) {
      setCategoriaPaiSelecionada("");
      setSubcategoriaSelecionada("");
      return;
    }
    setCategoriaPaiSelecionada(id);
    setSubcategoriaSelecionada("");
  };

  return (
    <>
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

      <section className="categories-nav">
        <Container>
          <Nav className="category-pills justify-content-center flex-wrap mb-2">
            {categoriasRaiz.map((cat) => (
              <Nav.Link
                key={cat.id}
                active={categoriaPaiSelecionada === cat.id && !subcategoriaSelecionada}
                onClick={() => selecionarCategoriaRaiz(cat.id)}
                className="category-pill"
              >
                {cat.nome}
              </Nav.Link>
            ))}
          </Nav>

          {categoriaPaiSelecionada && subcategorias.length > 0 && (
            <Nav className="category-pills category-pills-sub justify-content-center flex-wrap">
              {subcategorias.map((sub) => (
                <Nav.Link
                  key={sub.id}
                  active={subcategoriaSelecionada === sub.id}
                  onClick={() => setSubcategoriaSelecionada(sub.id)}
                  className="category-pill category-pill-sub"
                >
                  {sub.nome}
                </Nav.Link>
              ))}
            </Nav>
          )}
          {categoriaPaiSelecionada && !subcategoriaSelecionada && subcategorias.length > 0 && (
            <p className="text-center text-white-50 small mt-3 mb-0">
              Escolha Camisetas, Canecas ou outra opção para ver os produtos.
            </p>
          )}
        </Container>
      </section>

      {emVariados && (
        <section id="destaques" className="destaques-section">
          <Container>
            <h2 className="section-title text-center">Destaques</h2>
            {usandoDemo && (
              <p className="text-center demo-notice">
                Catálogo de demonstração — cadastre produtos no painel admin para
                substituir estes itens.
              </p>
            )}
            {carregandoInicial ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" role="status">
                  <span className="visually-hidden">Carregando produtos...</span>
                </Spinner>
              </div>
            ) : destaques.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted fs-5">Nenhum produto em destaque no momento</p>
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
      )}

      {subcategoriaSelecionada && (
        <section className="destaques-section">
          <Container>
            <h2 className="section-title text-center">{tituloCatalogo}</h2>
            {carregandoCategoria ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" role="status">
                  <span className="visually-hidden">Carregando produtos...</span>
                </Spinner>
              </div>
            ) : produtosSubcategoria.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted fs-5">Nenhum produto encontrado nesta categoria</p>
              </div>
            ) : (
              <Row className="g-4">
                {produtosSubcategoria.map((produto) => (
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
      )}

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
