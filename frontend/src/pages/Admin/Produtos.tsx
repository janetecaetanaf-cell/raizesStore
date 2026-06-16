import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Tab, Tabs, Table, Button, Form, Modal, Alert, Badge } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import api from '../../services/api';
import { Categoria, Produto, TipoProduto, TamanhoProduto, CorProduto, TIPO_PRODUTO_LABELS } from '../../types';
import { Icon } from '../../components/Icon';
import { normalizarProduto, COR_PRODUTO_HEX, valoresEnumNumericos } from '../../utils/produto';
import {
  getCategoriasRaiz,
  getCategoriasFolha,
  getNomeCategoriaCompleto,
  normalizarCategorias,
} from '../../utils/categorias';
import EnumMultiSelect from '../../components/EnumMultiSelect';

const AdminProdutos = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('produtos');
  
  // Estados para modal de categoria
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [categoriaForm, setCategoriaForm] = useState({
    nome: '',
    descricao: '',
    ativo: true,
    ordem: 0,
    categoriaPaiId: '',
  });
  
  // Estados para modal de produto
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [produtoForm, setProdutoForm] = useState({
    nome: '',
    descricao: '',
    preco: 0,
    categoriaId: '',
    tipoProduto: TipoProduto.Camiseta,
    ativo: true,
    estoque: 0,
    tamanhosDisponiveis: [] as TamanhoProduto[],
    coresDisponiveis: [] as CorProduto[],
    imagens: [] as string[],
    imagensPorCor: {} as Partial<Record<CorProduto, string>>,
  });
  const [novaImagem, setNovaImagem] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);
  const arquivosUploadRef = useRef<Map<string, File>>(new Map());

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [categoriasRes, produtosRes] = await Promise.all([
        api.get('/categorias'),
        api.get('/produtos', { params: { incluirInativos: true } }),
      ]);
      console.log('Categorias carregadas:', categoriasRes.data);
      console.log('Produtos carregados:', produtosRes.data);
      setCategorias(normalizarCategorias(categoriasRes.data || []));
      setProdutos((produtosRes.data || []).map((p: Record<string, unknown>) => normalizarProduto(p)));
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      mostrarAlert('danger', `Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const mostrarAlert = (type: 'success' | 'danger', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 8000);
  };

  const obterCategoriaPadraoProduto = () => {
    const subcategorias = getCategoriasFolha(categorias).filter((c) => c.ativo);
    if (subcategorias.length > 0) {
      return subcategorias[0].id;
    }
    return categorias.find((c) => c.ativo && !c.categoriaPaiId)?.id ?? '';
  };

  const liberarBlobUrls = (urls: string[]) => {
    urls.forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
        arquivosUploadRef.current.delete(url);
      }
    });
  };

  const rotuloImagemCadastro = (img: string, index?: number) => {
    if (img.startsWith('blob:')) {
      return index != null ? `Imagem ${index + 1} (arquivo local)` : 'Arquivo local';
    }
    if (img.startsWith('data:')) {
      return index != null ? `Imagem ${index + 1} (upload)` : 'Imagem enviada (upload)';
    }
    if (img.length > 48) return `${img.slice(0, 48)}…`;
    return img;
  };

  const converterImagemParaSalvar = (img: string): Promise<string> => {
    if (!img.startsWith('blob:')) {
      return Promise.resolve(img);
    }

    const file = arquivosUploadRef.current.get(img);
    if (!file) {
      return Promise.resolve(img);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Erro ao ler a imagem'));
      reader.readAsDataURL(file);
    });
  };

  // ========== CATEGORIAS ==========
  const abrirModalCategoria = (categoria?: Categoria) => {
    if (categoria) {
      setCategoriaEditando(categoria);
      setCategoriaForm({
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        ativo: categoria.ativo,
        ordem: categoria.ordem || 0,
        categoriaPaiId: categoria.categoriaPaiId || '',
      });
    } else {
      setCategoriaEditando(null);
      setCategoriaForm({ nome: '', descricao: '', ativo: true, ordem: 0, categoriaPaiId: '' });
    }
    setShowCategoriaModal(true);
  };

  const salvarCategoria = async () => {
    try {
      // Validar campos obrigatórios
      if (!categoriaForm.nome.trim()) {
        mostrarAlert('danger', 'O nome da categoria é obrigatório');
        return;
      }

      // Converter para o formato esperado pelo backend (PascalCase)
      const dados: Record<string, unknown> = {
        Nome: categoriaForm.nome.trim(),
        Descricao: categoriaForm.descricao.trim() || '',
        Ativo: categoriaForm.ativo,
        Ordem: categoriaForm.ordem || 0,
        CategoriaPaiId: categoriaForm.categoriaPaiId || null,
      };

      // Se estiver editando, incluir o Id
      if (categoriaEditando) {
        dados.Id = categoriaEditando.id;
      }

      console.log('Enviando categoria:', dados);

      if (categoriaEditando) {
        const response = await api.put(`/categorias/${categoriaEditando.id}`, dados);
        console.log('Categoria atualizada:', response.data);
        mostrarAlert('success', 'Categoria atualizada com sucesso!');
      } else {
        const response = await api.post('/categorias', dados);
        console.log('Categoria criada:', response.data);
        mostrarAlert('success', 'Categoria cadastrada com sucesso!');
      }
      setShowCategoriaModal(false);
      await carregarDados();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.title ||
                          error.response?.data ||
                          error.message || 
                          'Erro ao salvar categoria';
      mostrarAlert('danger', `Erro: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}`);
    }
  };

  const excluirCategoria = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      await api.delete(`/categorias/${id}`);
      mostrarAlert('success', 'Categoria excluída com sucesso!');
      carregarDados();
    } catch (error: any) {
      mostrarAlert('danger', error.response?.data?.message || 'Erro ao excluir categoria');
    }
  };

  // ========== PRODUTOS ==========
  const abrirModalProduto = (produto?: Produto) => {
    liberarBlobUrls(produtoForm.imagens);
    if (produto) {
      setProdutoEditando(produto);
      setProdutoForm({
        nome: produto.nome,
        descricao: produto.descricao || '',
        preco: produto.preco,
        categoriaId: produto.categoriaId,
        tipoProduto: produto.tipoProduto,
        ativo: produto.ativo,
        estoque: produto.estoque,
        tamanhosDisponiveis: [...produto.tamanhosDisponiveis],
        coresDisponiveis: [...produto.coresDisponiveis],
        imagens: [...produto.imagens],
        imagensPorCor: { ...(produto.imagensPorCor ?? {}) },
      });
    } else {
      setProdutoEditando(null);
      setProdutoForm({
        nome: '',
        descricao: '',
        preco: 0,
        categoriaId: obterCategoriaPadraoProduto(),
        tipoProduto: TipoProduto.Camiseta,
        ativo: true,
        estoque: 0,
        tamanhosDisponiveis: [],
        coresDisponiveis: [],
        imagens: [],
        imagensPorCor: {},
      });
    }
    setShowProdutoModal(true);
  };

  const salvarProduto = async () => {
    try {
      if (uploadingImage) {
        mostrarAlert('danger', 'Aguarde o upload da imagem terminar antes de salvar');
        return;
      }

      const imagensBase = novaImagem.trim()
        ? [...produtoForm.imagens, novaImagem.trim()]
        : [...produtoForm.imagens];

      if (novaImagem.trim()) {
        setNovaImagem('');
      }

      const imagensParaSalvar = await Promise.all(imagensBase.map(converterImagemParaSalvar));

      // Validar campos obrigatórios
      if (!produtoForm.nome.trim()) {
        mostrarAlert('danger', 'O nome do produto é obrigatório');
        return;
      }
      if (!produtoForm.categoriaId) {
        mostrarAlert('danger', 'Selecione uma subcategoria (ex.: Kardecismo › Camisetas)');
        return;
      }
      if (
        getCategoriasFolha(categorias).length > 0 &&
        !categoriaEhSubcategoria(produtoForm.categoriaId)
      ) {
        mostrarAlert(
          'danger',
          'Escolha uma subcategoria no menu (ex.: Kardecismo › Camisetas), não a categoria principal.',
        );
        return;
      }
      if (categorias.length === 0) {
        mostrarAlert('danger', 'É necessário cadastrar uma categoria primeiro');
        return;
      }
      if (!produtoForm.preco || produtoForm.preco <= 0) {
        mostrarAlert('danger', 'Informe um preço maior que zero');
        return;
      }
      if (Number(produtoForm.tipoProduto) === TipoProduto.Camiseta) {
        if (produtoForm.tamanhosDisponiveis.length === 0) {
          mostrarAlert('danger', 'Selecione pelo menos um tamanho para a camiseta');
          return;
        }
        if (produtoForm.coresDisponiveis.length === 0) {
          mostrarAlert('danger', 'Selecione pelo menos uma cor para a camiseta');
          return;
        }
      }
      if (Number(produtoForm.tipoProduto) === TipoProduto.Caneca && produtoForm.coresDisponiveis.length === 0) {
        mostrarAlert('danger', 'Selecione pelo menos uma cor para a caneca');
        return;
      }

      // Converter para o formato esperado pelo backend (PascalCase)
      const dados = {
        Nome: produtoForm.nome.trim(),
        Descricao: produtoForm.descricao.trim(),
        Preco: produtoForm.preco,
        CategoriaId: produtoForm.categoriaId,
        TipoProduto: produtoForm.tipoProduto,
        Ativo: produtoForm.ativo,
        Estoque: produtoForm.estoque,
        TamanhosDisponiveis: produtoForm.tamanhosDisponiveis,
        CoresDisponiveis: produtoForm.coresDisponiveis,
        Imagens: imagensParaSalvar,
        ImagensPorCor: Object.entries(produtoForm.imagensPorCor)
          .filter(([cor, url]) => produtoForm.coresDisponiveis.includes(Number(cor) as CorProduto) && url)
          .map(([cor, url]) => ({ Cor: Number(cor), Url: url })),
      };

      console.log('Enviando dados:', dados);

      if (produtoEditando) {
        await api.put(`/produtos/${produtoEditando.id}`, dados);
        mostrarAlert('success', 'Produto atualizado com sucesso!');
      } else {
        const response = await api.post('/produtos', dados);
        console.log('Produto criado:', response.data);
        mostrarAlert('success', 'Produto cadastrado com sucesso!');
      }
      liberarBlobUrls(produtoForm.imagens);
      setShowProdutoModal(false);
      await carregarDados();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      const data = error.response?.data;
      let errorMessage = 'Erro ao salvar produto';
      if (typeof data === 'string' && data.trim()) {
        errorMessage = data;
      } else if (data?.errors) {
        const detalhes = Object.entries(data.errors as Record<string, string[]>)
          .map(([campo, msgs]) => `${campo}: ${msgs.join(', ')}`)
          .join('; ');
        errorMessage = detalhes || errorMessage;
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.title) {
        errorMessage = data.title;
      } else if (error.message) {
        errorMessage = error.message;
      }
      mostrarAlert('danger', `Erro: ${errorMessage}`);
    }
  };

  const excluirProduto = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await api.delete(`/produtos/${id}`);
      mostrarAlert('success', 'Produto excluído com sucesso!');
      carregarDados();
    } catch (error: any) {
      mostrarAlert('danger', error.response?.data?.message || 'Erro ao excluir produto');
    }
  };

  const toggleTamanho = (tamanho: TamanhoProduto) => {
    setProdutoForm((prev) => {
      const index = prev.tamanhosDisponiveis.indexOf(tamanho);
      if (index > -1) {
        return {
          ...prev,
          tamanhosDisponiveis: prev.tamanhosDisponiveis.filter((t) => t !== tamanho),
        };
      }
      return {
        ...prev,
        tamanhosDisponiveis: [...prev.tamanhosDisponiveis, tamanho],
      };
    });
  };

  const toggleCor = (cor: CorProduto) => {
    setProdutoForm((prev) => {
      const index = prev.coresDisponiveis.indexOf(cor);
      if (index > -1) {
        const { [cor]: _, ...restoImagensPorCor } = prev.imagensPorCor;
        return {
          ...prev,
          coresDisponiveis: prev.coresDisponiveis.filter((c) => c !== cor),
          imagensPorCor: restoImagensPorCor,
        };
      }
      return {
        ...prev,
        coresDisponiveis: [...prev.coresDisponiveis, cor],
      };
    });
  };

  const definirImagemCor = (cor: CorProduto, url: string) => {
    setProdutoForm((prev) => ({
      ...prev,
      imagensPorCor: {
        ...prev.imagensPorCor,
        [cor]: url,
      },
    }));
  };

  const adicionarImagem = () => {
    if (novaImagem.trim()) {
      setProdutoForm((prev) => ({
        ...prev,
        imagens: [...prev.imagens, novaImagem.trim()],
      }));
      setNovaImagem('');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      mostrarAlert('danger', 'Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      mostrarAlert('danger', 'A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      arquivosUploadRef.current.set(objectUrl, file);
      setProdutoForm((prev) => ({
        ...prev,
        imagens: [...prev.imagens, objectUrl],
      }));
      setUploadingImage(false);
      mostrarAlert('success', 'Imagem adicionada com sucesso!');
    } catch (error: any) {
      mostrarAlert('danger', `Erro ao fazer upload: ${error.message}`);
      setUploadingImage(false);
    }
    
    // Limpar o input
    event.target.value = '';
  };

  const removerImagem = (index: number) => {
    setProdutoForm((prev) => {
      const removida = prev.imagens[index];
      if (removida) {
        liberarBlobUrls([removida]);
      }
      return {
        ...prev,
        imagens: prev.imagens.filter((_, i) => i !== index),
      };
    });
  };

  const atualizarProdutoForm = <K extends keyof typeof produtoForm>(
    campo: K,
    valor: (typeof produtoForm)[K]
  ) => {
    setProdutoForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const imagemPlaceholder =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect width="60" height="60" fill="%23eee"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3ESem foto%3C/text%3E%3C/svg%3E';

  const obterImagemProduto = (produto: Produto) => produto.imagens?.[0] ?? null;

  const categoriaAtualDoProduto = (categoriaId: string) =>
    categorias.find((c) => c.id === categoriaId);

  const categoriaEhSubcategoria = (categoriaId: string) =>
    Boolean(categoriaAtualDoProduto(categoriaId)?.categoriaPaiId);

  const rotuloImagemProduto = (produto: Produto) => {
    const img = obterImagemProduto(produto);
    if (!img) return 'Sem imagem';
    if (img.startsWith('data:')) return 'Imagem enviada (upload)';
    if (img.length > 48) return `${img.slice(0, 48)}…`;
    return img;
  };

  return (
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestão de Produtos e Categorias</h1>
        {alert && (
          <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'produtos')} className="mb-4">
        <Tab eventKey="produtos" title="Produtos">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Lista de Produtos</h5>
              <Button variant="primary" onClick={() => abrirModalProduto()}>
                <Icon icon={FiPlus} className="me-2" />
                Novo Produto
              </Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </div>
                </div>
              ) : (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th style={{ width: 72 }}>Imagem</th>
                      <th>Nome</th>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th>Preço</th>
                      <th>Estoque</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          Nenhum produto cadastrado
                        </td>
                      </tr>
                    ) : (
                      produtos.map((produto) => (
                        <tr key={produto.id}>
                          <td>
                            <img
                              src={obterImagemProduto(produto) ?? imagemPlaceholder}
                              alt={produto.nome}
                              title={rotuloImagemProduto(produto)}
                              style={{
                                width: 56,
                                height: 56,
                                objectFit: 'cover',
                                borderRadius: 6,
                                border: '1px solid #dee2e6',
                                backgroundColor: '#f8f9fa',
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = imagemPlaceholder;
                              }}
                            />
                          </td>
                          <td>{produto.nome}</td>
                          <td>{getNomeCategoriaCompleto(produto.categoria, categorias, produto.categoriaId)}</td>
                          <td>
                            <Badge bg="secondary">
                              {TIPO_PRODUTO_LABELS[produto.tipoProduto as TipoProduto] ?? produto.tipoProduto}
                            </Badge>
                          </td>
                          <td>R$ {produto.preco.toFixed(2)}</td>
                          <td>{produto.estoque}</td>
                          <td>
                            <Badge bg={produto.ativo ? 'success' : 'secondary'}>
                              {produto.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => abrirModalProduto(produto)}
                            >
                              <Icon icon={FiEdit} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => excluirProduto(produto.id)}
                            >
                              <Icon icon={FiTrash2} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="categorias" title="Categorias">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Lista de Categorias</h5>
              <Button variant="primary" onClick={() => abrirModalCategoria()}>
                <Icon icon={FiPlus} className="me-2" />
                Nova Categoria
              </Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </div>
                </div>
              ) : (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Categoria pai</th>
                      <th>Descrição</th>
                      <th>Ordem</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          Nenhuma categoria cadastrada
                        </td>
                      </tr>
                    ) : (
                      categorias
                        .slice()
                        .sort((a, b) => {
                          const paiA = a.categoriaPaiId ?? '';
                          const paiB = b.categoriaPaiId ?? '';
                          if (paiA !== paiB) return paiA.localeCompare(paiB);
                          return a.ordem - b.ordem || a.nome.localeCompare(b.nome);
                        })
                        .map((categoria) => (
                        <tr key={categoria.id}>
                          <td>
                            {categoria.categoriaPaiId ? `↳ ${categoria.nome}` : categoria.nome}
                          </td>
                          <td>
                            {categoria.categoriaPaiId
                              ? categorias.find((c) => c.id === categoria.categoriaPaiId)?.nome ?? '-'
                              : '—'}
                          </td>
                          <td>{categoria.descricao || '-'}</td>
                          <td>{categoria.ordem || 0}</td>
                          <td>
                            <Badge bg={categoria.ativo ? 'success' : 'secondary'}>
                              {categoria.ativo ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => abrirModalCategoria(categoria)}
                            >
                              <Icon icon={FiEdit} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => excluirCategoria(categoria.id)}
                            >
                              <Icon icon={FiTrash2} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal Categoria */}
      <Modal show={showCategoriaModal} onHide={() => setShowCategoriaModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Categoria pai</Form.Label>
              <Form.Select
                value={categoriaForm.categoriaPaiId}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, categoriaPaiId: e.target.value })}
              >
                <option value="">Nenhuma (categoria principal)</option>
                {getCategoriasRaiz(categorias)
                  .filter((c) => c.id !== categoriaEditando?.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Principal: Fé Católica, Kardecismo… Subcategoria: Camisetas, Canecas…
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nome *</Form.Label>
              <Form.Control
                type="text"
                value={categoriaForm.nome}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })}
                placeholder="Ex: Fé Católica ou Camisetas"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={categoriaForm.descricao}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, descricao: e.target.value })}
                placeholder="Descrição da categoria"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ordem</Form.Label>
              <Form.Control
                type="number"
                value={categoriaForm.ordem}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, ordem: Number(e.target.value) })}
                placeholder="0"
              />
            </Form.Group>
            <Form.Check
              type="switch"
              label="Categoria ativa"
              checked={categoriaForm.ativo}
              onChange={(e) => setCategoriaForm({ ...categoriaForm, ativo: e.target.checked })}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCategoriaModal(false)}>
            <Icon icon={FiX} className="me-2" />
            Cancelar
          </Button>
          <Button variant="primary" onClick={salvarCategoria}>
            <Icon icon={FiSave} className="me-2" />
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Produto */}
      <Modal show={showProdutoModal} onHide={() => {
        liberarBlobUrls(produtoForm.imagens);
        setShowProdutoModal(false);
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {alert && (
            <Alert variant={alert.type} dismissible onClose={() => setAlert(null)} className="mb-3">
              {alert.message}
            </Alert>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nome *</Form.Label>
              <Form.Control
                type="text"
                value={produtoForm.nome}
                onChange={(e) => atualizarProdutoForm('nome', e.target.value)}
                placeholder="Ex: Camiseta Personalizada"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={produtoForm.descricao}
                onChange={(e) => atualizarProdutoForm('descricao', e.target.value)}
                placeholder="Descrição do produto"
              />
            </Form.Group>
            <div className="row">
              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Preço *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={produtoForm.preco > 0 ? produtoForm.preco : ''}
                  onChange={(e) =>
                    atualizarProdutoForm('preco', e.target.value === '' ? 0 : Number(e.target.value))
                  }
                  placeholder="0,00"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Estoque *</Form.Label>
                <Form.Control
                  type="number"
                  value={produtoForm.estoque}
                  onChange={(e) => atualizarProdutoForm('estoque', Number(e.target.value))}
                  placeholder="0"
                  required
                />
              </Form.Group>
            </div>
            <div className="row">
              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Categoria *</Form.Label>
                <Form.Select
                  value={produtoForm.categoriaId}
                  onChange={(e) => atualizarProdutoForm('categoriaId', e.target.value)}
                  required
                >
                  <option value="">Selecione uma subcategoria</option>
                  {getCategoriasRaiz(categorias).map((pai) => {
                    const filhas = categorias.filter((c) => c.categoriaPaiId === pai.id && c.ativo);
                    if (filhas.length === 0) return null;
                    return (
                      <optgroup key={pai.id} label={pai.nome}>
                        {filhas.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {pai.nome} › {sub.nome}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                  {getCategoriasFolha(categorias).length === 0 &&
                    categorias
                      .filter((c) => !c.categoriaPaiId && c.ativo)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome} (categoria antiga)
                        </option>
                      ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Cadastre o produto na subcategoria (ex.: Umbanda › Camisetas).
                </Form.Text>
                {produtoForm.categoriaId && !categoriaEhSubcategoria(produtoForm.categoriaId) && (
                  <Form.Text className="text-warning d-block">
                    Categoria atual: {getNomeCategoriaCompleto(undefined, categorias, produtoForm.categoriaId)}.
                    Escolha uma opção com o nome da linha (ex.: Umbanda › Camisetas) e salve.
                  </Form.Text>
                )}
              </Form.Group>
              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Tipo de Produto *</Form.Label>
                <Form.Select
                  value={produtoForm.tipoProduto}
                  onChange={(e) => atualizarProdutoForm('tipoProduto', Number(e.target.value) as TipoProduto)}
                  required
                >
                  {Object.entries(TIPO_PRODUTO_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            {Number(produtoForm.tipoProduto) === TipoProduto.Camiseta && (
              <>
                <EnumMultiSelect
                  label="Tamanhos disponíveis *"
                  hint="Clique para marcar ou desmarcar cada tamanho."
                  opcoes={valoresEnumNumericos(TamanhoProduto).map((t) => ({
                    value: t,
                    label: TamanhoProduto[t as TamanhoProduto],
                  }))}
                  selecionados={produtoForm.tamanhosDisponiveis}
                  onToggle={(t) => toggleTamanho(t as TamanhoProduto)}
                />
                <EnumMultiSelect
                  label="Cores disponíveis *"
                  hint="Clique para marcar ou desmarcar cada cor."
                  opcoes={valoresEnumNumericos(CorProduto).map((c) => ({
                    value: c,
                    label: CorProduto[c as CorProduto],
                    swatch: COR_PRODUTO_HEX[c as CorProduto],
                  }))}
                  selecionados={produtoForm.coresDisponiveis}
                  onToggle={(c) => toggleCor(c as CorProduto)}
                />
              </>
            )}

            {Number(produtoForm.tipoProduto) === TipoProduto.Caneca && (
              <EnumMultiSelect
                label="Cores disponíveis *"
                hint="Clique para marcar ou desmarcar cada cor."
                opcoes={valoresEnumNumericos(CorProduto).map((c) => ({
                  value: c,
                  label: CorProduto[c as CorProduto],
                  swatch: COR_PRODUTO_HEX[c as CorProduto],
                }))}
                selecionados={produtoForm.coresDisponiveis}
                onToggle={(c) => toggleCor(c as CorProduto)}
              />
            )}

            <Form.Group className="mb-3">
              <Form.Label>Imagens do Produto</Form.Label>
              
              {/* Upload de arquivo */}
              <div className="mb-3">
                <Form.Label htmlFor="produto-imagem-upload" className="fw-bold">
                  📤 Fazer Upload de Imagem
                </Form.Label>
                <Form.Control
                  id="produto-imagem-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="mb-2"
                />
                {uploadingImage && (
                  <small className="text-muted">Processando imagem...</small>
                )}
                <Form.Text className="text-muted d-block">
                  Selecione uma imagem do seu computador (máximo 5MB)
                </Form.Text>
              </div>

              {/* Ou inserir URL manualmente */}
              <div className="mb-3">
                <Form.Label className="fw-bold">🔗 Ou inserir URL manualmente</Form.Label>
                <Form.Text className="text-muted d-block mb-2">
                  Para imagens na pasta <code>public</code>, use: <code>/nome-da-imagem.jpg</code>
                  <br />
                  Exemplo: Se a imagem está em <code>public/produtos/camiseta.jpg</code>, digite: <code>/produtos/camiseta.jpg</code>
                </Form.Text>
                <div className="d-flex gap-2 mb-2">
                  <Form.Control
                    type="text"
                    value={novaImagem}
                    onChange={(e) => setNovaImagem(e.target.value)}
                    placeholder="/produtos/imagem.jpg ou https://exemplo.com/imagem.jpg"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarImagem())}
                  />
                  <Button variant="outline-primary" onClick={adicionarImagem}>
                    Adicionar
                  </Button>
                </div>
              </div>
              {produtoForm.imagens.length > 0 && (
                <div className="mt-2">
                  {produtoForm.imagens.map((img, index) => (
                    <div key={index} className="d-flex align-items-center gap-2 mb-2 p-2 border rounded">
                      <img
                        src={img}
                        alt={`Imagem ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect width="60" height="60" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImagem não encontrada%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <span className="flex-grow-1 text-truncate small">{rotuloImagemCadastro(img, index + 1)}</span>
                      <Button variant="outline-danger" size="sm" onClick={() => removerImagem(index)}>
                        <Icon icon={FiTrash2} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Form.Group>

            {produtoForm.coresDisponiveis.length > 0 && produtoForm.imagens.length > 0 && (
              <Form.Group className="mb-3">
                <Form.Label>Imagem por cor</Form.Label>
                <Form.Text className="text-muted d-block mb-2">
                  Escolha qual foto aparece quando o cliente seleciona cada cor na loja.
                </Form.Text>
                {produtoForm.coresDisponiveis.map((cor) => (
                  <div key={cor} className="d-flex align-items-center gap-2 mb-2">
                    <span className="text-nowrap" style={{ minWidth: '5rem' }}>
                      {CorProduto[cor]}
                    </span>
                    <Form.Select
                      value={produtoForm.imagensPorCor[cor] ?? ''}
                      onChange={(e) => definirImagemCor(cor, e.target.value)}
                      size="sm"
                    >
                      <option value="">Automático (padrão)</option>
                      {produtoForm.imagens.map((img, index) => (
                        <option key={index} value={img}>
                          {rotuloImagemCadastro(img, index + 1)}
                        </option>
                      ))}
                    </Form.Select>
                    {produtoForm.imagensPorCor[cor] && (
                      <img
                        src={produtoForm.imagensPorCor[cor]}
                        alt={CorProduto[cor]}
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                      />
                    )}
                  </div>
                ))}
              </Form.Group>
            )}

            <Form.Check
              type="switch"
              label="Produto ativo"
              checked={produtoForm.ativo}
              onChange={(e) => atualizarProdutoForm('ativo', e.target.checked)}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            liberarBlobUrls(produtoForm.imagens);
            setShowProdutoModal(false);
          }}>
            <Icon icon={FiX} className="me-2" />
            Cancelar
          </Button>
          <Button variant="primary" onClick={salvarProduto} disabled={uploadingImage}>
            <Icon icon={FiSave} className="me-2" />
            {uploadingImage ? 'Processando imagem...' : 'Salvar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminProdutos;
