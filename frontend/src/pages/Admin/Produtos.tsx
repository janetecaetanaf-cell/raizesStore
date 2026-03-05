import React, { useState, useEffect } from 'react';
import { Container, Card, Tab, Tabs, Table, Button, Form, Modal, Alert, Badge } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import api from '../../services/api';
import { Categoria, Produto, TipoProduto, TamanhoProduto, CorProduto } from '../../types';
import { Icon } from '../../components/Icon';

const AdminProdutos = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('produtos');
  
  // Estados para modal de categoria
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [categoriaForm, setCategoriaForm] = useState({ nome: '', descricao: '', ativo: true, ordem: 0 });
  
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
  });
  const [novaImagem, setNovaImagem] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [categoriasRes, produtosRes] = await Promise.all([
        api.get('/categorias'),
        api.get('/produtos'),
      ]);
      console.log('Categorias carregadas:', categoriasRes.data);
      console.log('Produtos carregados:', produtosRes.data);
      setCategorias(categoriasRes.data || []);
      setProdutos(produtosRes.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      mostrarAlert('danger', `Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const mostrarAlert = (type: 'success' | 'danger', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
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
      });
    } else {
      setCategoriaEditando(null);
      setCategoriaForm({ nome: '', descricao: '', ativo: true, ordem: 0 });
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
      const dados: any = {
        Nome: categoriaForm.nome.trim(),
        Descricao: categoriaForm.descricao.trim() || '',
        Ativo: categoriaForm.ativo,
        Ordem: categoriaForm.ordem || 0,
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
      });
    } else {
      setProdutoEditando(null);
      setProdutoForm({
        nome: '',
        descricao: '',
        preco: 0,
        categoriaId: categorias[0]?.id || '',
        tipoProduto: TipoProduto.Camiseta,
        ativo: true,
        estoque: 0,
        tamanhosDisponiveis: [],
        coresDisponiveis: [],
        imagens: [],
      });
    }
    setShowProdutoModal(true);
  };

  const salvarProduto = async () => {
    try {
      // Validar campos obrigatórios
      if (!produtoForm.nome.trim()) {
        mostrarAlert('danger', 'O nome do produto é obrigatório');
        return;
      }
      if (!produtoForm.categoriaId && categorias.length === 0) {
        mostrarAlert('danger', 'É necessário cadastrar uma categoria primeiro');
        return;
      }
      if (produtoForm.preco <= 0) {
        mostrarAlert('danger', 'O preço deve ser maior que zero');
        return;
      }

      // Converter para o formato esperado pelo backend (PascalCase)
      const dados = {
        Nome: produtoForm.nome.trim(),
        Descricao: produtoForm.descricao.trim(),
        Preco: produtoForm.preco,
        CategoriaId: produtoForm.categoriaId || categorias[0]?.id,
        TipoProduto: produtoForm.tipoProduto,
        Ativo: produtoForm.ativo,
        Estoque: produtoForm.estoque,
        TamanhosDisponiveis: produtoForm.tamanhosDisponiveis,
        CoresDisponiveis: produtoForm.coresDisponiveis,
        Imagens: produtoForm.imagens,
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
      setShowProdutoModal(false);
      await carregarDados();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.title ||
                          error.message || 
                          'Erro ao salvar produto';
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
    const index = produtoForm.tamanhosDisponiveis.indexOf(tamanho);
    if (index > -1) {
      setProdutoForm({
        ...produtoForm,
        tamanhosDisponiveis: produtoForm.tamanhosDisponiveis.filter(t => t !== tamanho),
      });
    } else {
      setProdutoForm({
        ...produtoForm,
        tamanhosDisponiveis: [...produtoForm.tamanhosDisponiveis, tamanho],
      });
    }
  };

  const toggleCor = (cor: CorProduto) => {
    const index = produtoForm.coresDisponiveis.indexOf(cor);
    if (index > -1) {
      setProdutoForm({
        ...produtoForm,
        coresDisponiveis: produtoForm.coresDisponiveis.filter(c => c !== cor),
      });
    } else {
      setProdutoForm({
        ...produtoForm,
        coresDisponiveis: [...produtoForm.coresDisponiveis, cor],
      });
    }
  };

  const adicionarImagem = () => {
    if (novaImagem.trim()) {
      setProdutoForm({
        ...produtoForm,
        imagens: [...produtoForm.imagens, novaImagem.trim()],
      });
      setNovaImagem('');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      // Converter para base64 e usar como data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProdutoForm({
          ...produtoForm,
          imagens: [...produtoForm.imagens, base64String],
        });
        setUploadingImage(false);
        mostrarAlert('success', 'Imagem adicionada com sucesso!');
      };
      reader.onerror = () => {
        mostrarAlert('danger', 'Erro ao ler a imagem');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      mostrarAlert('danger', `Erro ao fazer upload: ${error.message}`);
      setUploadingImage(false);
    }
    
    // Limpar o input
    event.target.value = '';
  };

  const removerImagem = (index: number) => {
    setProdutoForm({
      ...produtoForm,
      imagens: produtoForm.imagens.filter((_, i) => i !== index),
    });
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
                        <td colSpan={7} className="text-center py-4">
                          Nenhum produto cadastrado
                        </td>
                      </tr>
                    ) : (
                      produtos.map((produto) => (
                        <tr key={produto.id}>
                          <td>{produto.nome}</td>
                          <td>{produto.categoria?.nome || '-'}</td>
                          <td>
                            <Badge bg="secondary">{produto.tipoProduto}</Badge>
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
                      <th>Descrição</th>
                      <th>Ordem</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4">
                          Nenhuma categoria cadastrada
                        </td>
                      </tr>
                    ) : (
                      categorias.map((categoria) => (
                        <tr key={categoria.id}>
                          <td>{categoria.nome}</td>
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
              <Form.Label>Nome *</Form.Label>
              <Form.Control
                type="text"
                value={categoriaForm.nome}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })}
                placeholder="Ex: Camisetas Religiosas"
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
      <Modal show={showProdutoModal} onHide={() => setShowProdutoModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nome *</Form.Label>
              <Form.Control
                type="text"
                value={produtoForm.nome}
                onChange={(e) => setProdutoForm({ ...produtoForm, nome: e.target.value })}
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
                onChange={(e) => setProdutoForm({ ...produtoForm, descricao: e.target.value })}
                placeholder="Descrição do produto"
              />
            </Form.Group>
            <div className="row">
              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Preço *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={produtoForm.preco}
                  onChange={(e) => setProdutoForm({ ...produtoForm, preco: Number(e.target.value) })}
                  placeholder="0.00"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Estoque *</Form.Label>
                <Form.Control
                  type="number"
                  value={produtoForm.estoque}
                  onChange={(e) => setProdutoForm({ ...produtoForm, estoque: Number(e.target.value) })}
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
                  onChange={(e) => setProdutoForm({ ...produtoForm, categoriaId: e.target.value })}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Tipo de Produto *</Form.Label>
                <Form.Select
                  value={produtoForm.tipoProduto}
                  onChange={(e) => setProdutoForm({ ...produtoForm, tipoProduto: Number(e.target.value) as TipoProduto })}
                  required
                >
                  <option value={TipoProduto.Camiseta}>Camiseta</option>
                  <option value={TipoProduto.Caneca}>Caneca</option>
                </Form.Select>
              </Form.Group>
            </div>

            {produtoForm.tipoProduto === TipoProduto.Camiseta && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Tamanhos Disponíveis</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {Object.values(TamanhoProduto)
                      .filter((t): t is TamanhoProduto => typeof t === 'number')
                      .map((tamanho) => (
                        <Form.Check
                          key={tamanho}
                          type="checkbox"
                          label={TamanhoProduto[tamanho]}
                          checked={produtoForm.tamanhosDisponiveis.includes(tamanho)}
                          onChange={() => toggleTamanho(tamanho)}
                        />
                      ))}
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Cores Disponíveis</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {Object.values(CorProduto)
                      .filter((c): c is CorProduto => typeof c === 'number')
                      .map((cor) => (
                        <Form.Check
                          key={cor}
                          type="checkbox"
                          label={CorProduto[cor]}
                          checked={produtoForm.coresDisponiveis.includes(cor)}
                          onChange={() => toggleCor(cor)}
                        />
                      ))}
                  </div>
                </Form.Group>
              </>
            )}

            {produtoForm.tipoProduto === TipoProduto.Caneca && (
              <Form.Group className="mb-3">
                <Form.Label>Cores Disponíveis</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {Object.values(CorProduto)
                    .filter((c): c is CorProduto => typeof c === 'number')
                    .map((cor) => (
                      <Form.Check
                        key={cor}
                        type="checkbox"
                        label={CorProduto[cor]}
                        checked={produtoForm.coresDisponiveis.includes(cor)}
                        onChange={() => toggleCor(cor)}
                      />
                    ))}
                </div>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Imagens do Produto</Form.Label>
              
              {/* Upload de arquivo */}
              <div className="mb-3">
                <Form.Label className="fw-bold">📤 Fazer Upload de Imagem</Form.Label>
                <Form.Control
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
                    onKeyPress={(e) => e.key === 'Enter' && adicionarImagem()}
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
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect width="60" height="60" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImagem não encontrada%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <span className="flex-grow-1 text-truncate small">{img}</span>
                      <Button variant="outline-danger" size="sm" onClick={() => removerImagem(index)}>
                        <Icon icon={FiTrash2} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Form.Group>

            <Form.Check
              type="switch"
              label="Produto ativo"
              checked={produtoForm.ativo}
              onChange={(e) => setProdutoForm({ ...produtoForm, ativo: e.target.checked })}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProdutoModal(false)}>
            <Icon icon={FiX} className="me-2" />
            Cancelar
          </Button>
          <Button variant="primary" onClick={salvarProduto}>
            <Icon icon={FiSave} className="me-2" />
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminProdutos;
