import { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Produto, Categoria, TipoProduto } from "../types";
import { produtosDemo, categoriasDemo } from "../data/demoProdutos";
import { normalizarProduto } from "../utils/produto";
import {
  getCategoriasRaiz,
  getSubcategorias,
  normalizarCategorias,
} from "../utils/categorias";
import ProductCard from "../components/ProductCard";
import TrustSection from "../components/TrustSection";

const DESTAQUES_POR_TIPO = 4;
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

const amostrarDestaquesDoTipo = (lista: Produto[], limite: number): Produto[] => {
  const recentes = [...lista].sort((a, b) => obterDataCriacao(b) - obterDataCriacao(a));
  const pool = recentes.slice(0, Math.min(JANELA_DESTAQUES, recentes.length));
  return embaralhar(pool).slice(0, limite);
};

const selecionarDestaques = (lista: Produto[], comFiltroCategoria: boolean): Produto[] => {
  if (comFiltroCategoria) {
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
  const [categoriaPaiSelecionada, setCategoriaPaiSelecionada] = useState("");
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState("");
  const [usandoDemo, setUsandoDemo] = useState(false);
  const navigate = useNavigate();

  const categoriasRaiz = useMemo(() => getCategoriasRaiz(categorias), [categorias]);
  const subcategorias = useMemo(
    () => (categoriaPaiSelecionada ? getSubcategorias(categorias, categoriaPaiSelecionada) : []),
    [categorias, categoriaPaiSelecionada],
  );

  const comFiltroCategoria = Boolean(categoriaPaiSelecionada || subcategoriaSelecionada);

  useEffect(() => {
    carregarLoja();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (usandoDemo) {
      const filtrados = subcategoriaSelecionada
        ? produtosDemo.filter((p) => p.categoriaId === subcategoriaSelecionada)
        : produtosDemo;
      setProdutos(selecionarDestaques(filtrados, comFiltroCategoria));
      return;
    }

    carregarProdutosApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaPaiSelecionada, subcategoriaSelecionada, usandoDemo]);

  const aplicarDemo = () => {
    setCategorias(categoriasDemo);
    const filtrados = subcategoriaSelecionada
      ? produtosDemo.filter((p) => p.categoriaId === subcategoriaSelecionada)
      : produtosDemo;
    setProdutos(selecionarDestaques(filtrados, comFiltroCategoria));
    setUsandoDemo(true);
  };

  const carregarLoja = async () => {
    try {
      const [categoriasRes, produtosRes] = await Promise.all([
        api.get("/categorias"),
        api.get("/produtos"),
      ]);

      if (categoriasRes.data?.length > 0 && produtosRes.data?.length > 0) {
        setCategorias(normalizarCategorias(categoriasRes.data));
        const lista = produtosRes.data.map((p: Record<string, unknown>) =>
          normalizarProduto(p),
        );
        setProdutos(selecionarDestaques(lista, false));
        setUsandoDemo(false);
        return;
      }
    } catch {
      // cai no demo completo abaixo
    }

    setCategoriaPaiSelecionada("");
    setSubcategoriaSelecionada("");
    aplicarDemo();
  };

  const carregarProdutosApi = async () => {
    try {
      const params: Record<string, string> = {};
      if (subcategoriaSelecionada) {
        params.categoriaId = subcategoriaSelecionada;
      } else if (categoriaPaiSelecionada) {
        params.categoriaPaiId = categoriaPaiSelecionada;
      }

      const response = await api.get("/produtos", { params });
      const lista = (response.data ?? []).map((p: Record<string, unknown>) =>
        normalizarProduto(p),
      );
      setProdutos(selecionarDestaques(lista, comFiltroCategoria));
    } catch {
      aplicarDemo();
    }
  };

  const selecionarCategoriaRaiz = (id: string) => {
    setCategoriaPaiSelecionada(id);
    setSubcategoriaSelecionada("");
  };

  const limparFiltros = () => {
    setCategoriaPaiSelecionada("");
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
            <Nav.Link
              active={!categoriaPaiSelecionada}
              onClick={limparFiltros}
              className="category-pill"
            >
              Todos
            </Nav.Link>
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

          {subcategorias.length > 0 && (
            <Nav className="category-pills category-pills-sub justify-content-center flex-wrap">
              <Nav.Link
                active={!subcategoriaSelecionada}
                onClick={() => setSubcategoriaSelecionada("")}
                className="category-pill category-pill-sub"
              >
                Tudo em {categoriasRaiz.find((c) => c.id === categoriaPaiSelecionada)?.nome}
              </Nav.Link>
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
        </Container>
      </section>

      <section id="destaques" className="destaques-section">
        <Container>
          <h2 className="section-title text-center">Destaques</h2>
          {usandoDemo && (
            <p className="text-center demo-notice">
              Catálogo de demonstração — cadastre produtos no painel admin para
              substituir estes itens.
            </p>
          )}
          {produtos.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted fs-5">
                Nenhum produto encontrado nesta categoria
              </p>
            </div>
          ) : (
            <Row className="g-4">
              {produtos.map((produto) => (
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
