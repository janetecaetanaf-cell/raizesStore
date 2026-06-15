import { Categoria, Produto, TipoProduto, CorProduto, TamanhoProduto } from '../types';
import { buildImagensCamiseta } from '../utils/camisetaMockups';

export const categoriasDemo: Categoria[] = [
  { id: 'demo-1', nome: 'Camisetas', descricao: 'Camisetas personalizadas com estampas exclusivas', ativo: true, ordem: 1 },
  { id: 'demo-2', nome: 'Canecas', descricao: 'Canecas personalizadas para qualquer ocasião', ativo: true, ordem: 2 },
];

const imgCaneca = 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=600&fit=crop';
const imgCanecaEmpresaBranca = '/images/produtos/caneca-empresa-branca.png';
const imgCanecaEmpresaPreta = '/images/produtos/caneca-empresa-preta.png';

const camisetaSuaIdeia = buildImagensCamiseta([CorProduto.Branco, CorProduto.Preto, CorProduto.Rosa], 'sua-ideia');
const camisetaRock = buildImagensCamiseta([CorProduto.Preto, CorProduto.Branco], 'rock');
const camisetaNoivado = buildImagensCamiseta([CorProduto.Branco, CorProduto.Rosa], 'noivado');
const camisetaBrasil = buildImagensCamiseta([CorProduto.Amarelo, CorProduto.Verde, CorProduto.Branco], 'brasil');
const imgCanecaFrasesBranca = '/images/produtos/caneca-frases-branca.png';
const imgCanecaFrasesPreta = '/images/produtos/caneca-frases-preta.png';
const imgCanecaNamoradosBranca = '/images/produtos/caneca-namorados-branca.png';
const imgCanecaNamoradosVermelha = '/images/produtos/caneca-namorados-vermelha.png';
const imgCanecaGeekBranca = '/images/produtos/caneca-geek-branca.png';
const imgCanecaGeekPreta = '/images/produtos/caneca-geek-preta.png';
const imgCanecaPetBranca = '/images/produtos/caneca-pet-branca.png';
const imgCanecaPetAzul = '/images/produtos/caneca-pet-azul.png';
const camisetaAurora = {
  imagens: ['/images/produtos/camiseta-aurora-preta.png', '/images/produtos/camiseta-aurora-estampa.png'],
  imagensPorCor: { [CorProduto.Preto]: '/images/produtos/camiseta-aurora-preta.png' } as Partial<Record<CorProduto, string>>,
};
export const produtosDemo: Produto[] = [
  {
    id: 'demo-p1',
    nome: 'Caneca Motivacional — Frase do Dia',
    descricao: 'Caneca 325ml com frase inspiradora personalizada. Ideal para presentear ou usar no dia a dia.',
    preco: 39.9,
    precoOriginal: 44.9,
    categoriaId: 'demo-2',
    categoria: categoriasDemo[1],
    tipoProduto: TipoProduto.Caneca,
    ativo: true,
    estoque: 12,
    tamanhosDisponiveis: [],
    coresDisponiveis: [CorProduto.Branco, CorProduto.Preto, CorProduto.Bege],
    imagens: [imgCanecaFrasesBranca, imgCanecaFrasesPreta],
    imagensPorCor: {
      [CorProduto.Branco]: imgCanecaFrasesBranca,
      [CorProduto.Preto]: imgCanecaFrasesPreta,
      [CorProduto.Bege]: imgCanecaFrasesBranca,
    },
  },
  {
    id: 'demo-p2',
    nome: 'Camiseta Sua Ideia Aqui',
    descricao: 'Camiseta 100% algodão totalmente personalizável. Nome, frase, logo, foto ou qualquer estampa — sua ideia estampada aqui.',
    preco: 64.9,
    categoriaId: 'demo-1',
    categoria: categoriasDemo[0],
    tipoProduto: TipoProduto.Camiseta,
    ativo: true,
    estoque: 20,
    tamanhosDisponiveis: [TamanhoProduto.P, TamanhoProduto.M, TamanhoProduto.G, TamanhoProduto.GG],
    coresDisponiveis: [CorProduto.Branco, CorProduto.Preto, CorProduto.Rosa],
    imagens: camisetaSuaIdeia.imagens,
    imagensPorCor: camisetaSuaIdeia.imagensPorCor,
  },
  {
    id: 'demo-p3',
    nome: 'Camiseta Banda de Rock — Estampa Vintage',
    descricao: 'Camiseta com estampa estilo vintage. Perfeita para fãs de música e colecionadores.',
    preco: 64.9,
    categoriaId: 'demo-1',
    categoria: categoriasDemo[0],
    tipoProduto: TipoProduto.Camiseta,
    ativo: true,
    estoque: 15,
    tamanhosDisponiveis: [TamanhoProduto.P, TamanhoProduto.M, TamanhoProduto.G, TamanhoProduto.GG],
    coresDisponiveis: [CorProduto.Preto, CorProduto.Branco],
    imagens: camisetaRock.imagens,
    imagensPorCor: camisetaRock.imagensPorCor,
  },
  {
    id: 'demo-p4',
    nome: 'Caneca Empresa — Logo Corporativo',
    descricao: 'Caneca com logo e identidade visual da sua empresa. Ótima para brindes e eventos.',
    preco: 34.9,
    categoriaId: 'demo-2',
    categoria: categoriasDemo[1],
    tipoProduto: TipoProduto.Caneca,
    ativo: true,
    estoque: 30,
    tamanhosDisponiveis: [],
    coresDisponiveis: [CorProduto.Branco, CorProduto.Preto],
    imagens: [imgCanecaEmpresaBranca, imgCanecaEmpresaPreta],
    imagensPorCor: {
      [CorProduto.Branco]: imgCanecaEmpresaBranca,
      [CorProduto.Preto]: imgCanecaEmpresaPreta,
    },
  },
  {
    id: 'demo-p5b',
    nome: 'Camiseta Noivado — Ela Disse Sim',
    descricao: 'Camiseta para celebrar o noivado. Nomes do casal, data do pedido e frase especial — ideal para chá bar, festa de noivado ou foto a dois.',
    preco: 69.9,
    categoriaId: 'demo-1',
    categoria: categoriasDemo[0],
    tipoProduto: TipoProduto.Camiseta,
    ativo: true,
    estoque: 12,
    tamanhosDisponiveis: [TamanhoProduto.P, TamanhoProduto.M, TamanhoProduto.G, TamanhoProduto.GG],
    coresDisponiveis: [CorProduto.Branco, CorProduto.Rosa],
    imagens: camisetaNoivado.imagens,
    imagensPorCor: camisetaNoivado.imagensPorCor,
  },
  {
    id: 'demo-p4b',
    nome: 'Caneca Dia dos Namorados — Te Amo',
    descricao: 'Caneca 325ml romântica para presentear no Dia dos Namorados. Nome do casal, foto ou mensagem de amor personalizada.',
    preco: 42.9,
    categoriaId: 'demo-2',
    categoria: categoriasDemo[1],
    tipoProduto: TipoProduto.Caneca,
    ativo: true,
    estoque: 15,
    tamanhosDisponiveis: [],
    coresDisponiveis: [CorProduto.Branco, CorProduto.Vermelho, CorProduto.Rosa],
    imagens: [imgCanecaNamoradosBranca, imgCanecaNamoradosVermelha],
    imagensPorCor: {
      [CorProduto.Branco]: imgCanecaNamoradosBranca,
      [CorProduto.Vermelho]: imgCanecaNamoradosVermelha,
      [CorProduto.Rosa]: imgCanecaNamoradosBranca,
    },
  },
  {
    id: 'demo-p4c',
    nome: 'Caneca Frases — Sua Frase Aqui',
    descricao: 'Caneca 325ml com a frase que você quiser. Exemplo: "Menos reação e mais ação..." — motivação, humor, amizade ou qualquer texto.',
    preco: 39.9,
    categoriaId: 'demo-2',
    categoria: categoriasDemo[1],
    tipoProduto: TipoProduto.Caneca,
    ativo: true,
    estoque: 20,
    tamanhosDisponiveis: [],
    coresDisponiveis: [CorProduto.Branco, CorProduto.Preto],
    imagens: [imgCanecaFrasesBranca, imgCanecaFrasesPreta],
    imagensPorCor: {
      [CorProduto.Branco]: imgCanecaFrasesBranca,
      [CorProduto.Preto]: imgCanecaFrasesPreta,
    },
  },
  {
    id: 'demo-p6',
    nome: 'Caneca Pet — Amor de Cachorro',
    descricao: 'Caneca com foto e nome do seu pet. Presente perfeito para amantes de animais.',
    preco: 39.9,
    categoriaId: 'demo-2',
    categoria: categoriasDemo[1],
    tipoProduto: TipoProduto.Caneca,
    ativo: true,
    estoque: 10,
    tamanhosDisponiveis: [],
    coresDisponiveis: [CorProduto.Branco, CorProduto.Azul],
    imagens: [imgCanecaPetBranca, imgCanecaPetAzul],
    imagensPorCor: {
      [CorProduto.Branco]: imgCanecaPetBranca,
      [CorProduto.Azul]: imgCanecaPetAzul,
    },
  },
  {
    id: 'demo-p7',
    nome: 'Camiseta Brasil — Seleção',
    descricao: 'Camiseta amarela da Seleção Brasileira com estampa BRASIL. Personalize com nome e número.',
    preco: 59.9,
    categoriaId: 'demo-1',
    categoria: categoriasDemo[0],
    tipoProduto: TipoProduto.Camiseta,
    ativo: true,
    estoque: 6,
    tamanhosDisponiveis: [TamanhoProduto.P, TamanhoProduto.M, TamanhoProduto.G, TamanhoProduto.GG, TamanhoProduto.XG],
    coresDisponiveis: [CorProduto.Amarelo, CorProduto.Verde, CorProduto.Branco],
    imagens: camisetaBrasil.imagens,
    imagensPorCor: camisetaBrasil.imagensPorCor,
  },
  {
    id: 'demo-p8',
    nome: 'Caneca Geek — Gamer Life',
    descricao: 'Caneca com estampas geek, games e frases divertidas. Para gamers e fãs de cultura pop.',
    preco: 39.9,
    categoriaId: 'demo-2',
    categoria: categoriasDemo[1],
    tipoProduto: TipoProduto.Caneca,
    ativo: true,
    estoque: 25,
    tamanhosDisponiveis: [],
    coresDisponiveis: [CorProduto.Preto, CorProduto.Branco],
    imagens: [imgCanecaGeekPreta, imgCanecaGeekBranca],
    imagensPorCor: {
      [CorProduto.Preto]: imgCanecaGeekPreta,
      [CorProduto.Branco]: imgCanecaGeekBranca,
    },
  },
  {
    id: 'demo-p9',
    nome: 'Camiseta Aurora Boreal — Árvore Mística',
    descricao: 'Camiseta com estampa de aurora boreal e árvore sob céu estrelado. Visual místico e impactante.',
    preco: 69.9,
    precoOriginal: 79.9,
    categoriaId: 'demo-1',
    categoria: categoriasDemo[0],
    tipoProduto: TipoProduto.Camiseta,
    ativo: true,
    estoque: 10,
    tamanhosDisponiveis: [TamanhoProduto.P, TamanhoProduto.M, TamanhoProduto.G, TamanhoProduto.GG],
    coresDisponiveis: [CorProduto.Preto],
    imagens: camisetaAurora.imagens,
    imagensPorCor: camisetaAurora.imagensPorCor,
  },
];
