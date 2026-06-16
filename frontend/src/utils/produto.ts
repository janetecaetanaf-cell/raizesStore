import { Produto, TipoProduto, TamanhoProduto, CorProduto } from '../types';

export const normalizarProduto = (data: Record<string, unknown>): Produto => {
  const asArray = <T>(value: unknown): T[] =>
    Array.isArray(value) ? (value as T[]) : [];

  return {
    id: String(data.id ?? data.Id ?? ''),
    nome: String(data.nome ?? data.Nome ?? ''),
    descricao: String(data.descricao ?? data.Descricao ?? ''),
    preco: Number(data.preco ?? data.Preco ?? 0),
    categoriaId: String(data.categoriaId ?? data.CategoriaId ?? ''),
    categoria: (data.categoria ?? data.Categoria) as Produto['categoria'],
    tipoProduto: Number(data.tipoProduto ?? data.TipoProduto ?? TipoProduto.Outros) as TipoProduto,
    ativo: Boolean(data.ativo ?? data.Ativo ?? true),
    estoque: Number(data.estoque ?? data.Estoque ?? 0),
    tamanhosDisponiveis: asArray<number>(data.tamanhosDisponiveis ?? data.TamanhosDisponiveis).map(
      Number
    ) as TamanhoProduto[],
    coresDisponiveis: asArray<number>(data.coresDisponiveis ?? data.CoresDisponiveis).map(
      Number
    ) as CorProduto[],
    imagens: asArray<string>(data.imagens ?? data.Imagens).filter(Boolean),
    imagensPorCor: parseImagensPorCor(data.imagensPorCor ?? data.ImagensPorCor),
  };
};

export const COR_PRODUTO_HEX: Record<CorProduto, string> = {
  [CorProduto.Branco]: '#ffffff',
  [CorProduto.Preto]: '#1a1a1a',
  [CorProduto.Azul]: '#2563eb',
  [CorProduto.Vermelho]: '#dc2626',
  [CorProduto.Verde]: '#16a34a',
  [CorProduto.Amarelo]: '#eab308',
  [CorProduto.Rosa]: '#ec4899',
  [CorProduto.Cinza]: '#6b7280',
  [CorProduto.Marrom]: '#78350f',
  [CorProduto.Laranja]: '#ea580c',
  [CorProduto.Roxo]: '#7c3aed',
  [CorProduto.Bege]: '#d4c4a8',
};

export const CORES_PADRAO_CAMISETA = [
  CorProduto.Branco,
  CorProduto.Preto,
  CorProduto.Azul,
  CorProduto.Verde,
];

export const CORES_PADRAO_CANECA = [CorProduto.Branco, CorProduto.Preto, CorProduto.Azul];

export const TAMANHOS_PADRAO_CAMISETA = [
  TamanhoProduto.P,
  TamanhoProduto.M,
  TamanhoProduto.G,
  TamanhoProduto.GG,
];

/** Valores numéricos de um enum TypeScript (ignora chaves string do mapeamento reverso). */
export const valoresEnumNumericos = <E extends Record<string, string | number>>(enumObj: E): number[] =>
  Object.values(enumObj).filter((v): v is number => typeof v === 'number');

export const CAMISETA_PLACEHOLDER_DEFAULT = '/images/produtos/camiseta-sua-ideia-branca.png';

export const CAMISETA_PLACEHOLDER_POR_COR: Partial<Record<CorProduto, string>> = {
  [CorProduto.Branco]: '/images/produtos/camiseta-sua-ideia-branca.png',
  [CorProduto.Preto]: '/images/produtos/camiseta-sua-ideia-preta.png',
  [CorProduto.Verde]: '/images/produtos/camiseta-sua-ideia-verde.svg',
  [CorProduto.Rosa]: '/images/produtos/camiseta-sua-ideia-rosa.png',
  [CorProduto.Bege]: '/images/produtos/camiseta-sua-ideia-bege.svg',
};

export const getCamisetaPlaceholder = (cor?: CorProduto) =>
  (cor != null && CAMISETA_PLACEHOLDER_POR_COR[cor]) || CAMISETA_PLACEHOLDER_DEFAULT;

export const buildImagensCamiseta = (cores: CorProduto[]) => {
  const imagensPorCor = cores.reduce((acc, cor) => {
    const img = getCamisetaPlaceholder(cor);
    if (img) acc[cor] = img;
    return acc;
  }, {} as Partial<Record<CorProduto, string>>);

  const imagens = cores
    .map((cor) => getCamisetaPlaceholder(cor))
    .filter((img, idx, arr) => arr.indexOf(img) === idx);

  return {
    imagens: imagens.length > 0 ? imagens : [CAMISETA_PLACEHOLDER_DEFAULT],
    imagensPorCor,
  };
};

const COR_SLUGS: Record<CorProduto, string[]> = {
  [CorProduto.Branco]: ['branco', 'white'],
  [CorProduto.Preto]: ['preto', 'black'],
  [CorProduto.Azul]: ['azul', 'blue'],
  [CorProduto.Vermelho]: ['vermelho', 'red'],
  [CorProduto.Verde]: ['verde', 'green'],
  [CorProduto.Amarelo]: ['amarelo', 'yellow'],
  [CorProduto.Rosa]: ['rosa', 'pink'],
  [CorProduto.Cinza]: ['cinza', 'gray', 'grey'],
  [CorProduto.Marrom]: ['marrom', 'brown'],
  [CorProduto.Laranja]: ['laranja', 'orange'],
  [CorProduto.Roxo]: ['roxo', 'purple'],
  [CorProduto.Bege]: ['bege', 'beige'],
};

export const parseImagensPorCor = (value: unknown): Partial<Record<CorProduto, string>> => {
  if (!value || typeof value !== 'object') return {};

  if (Array.isArray(value)) {
    return (value as { cor?: number; Cor?: number; url?: string; Url?: string }[]).reduce(
      (acc, item) => {
        const cor = Number(item.cor ?? item.Cor);
        const url = String(item.url ?? item.Url ?? '');
        if (cor && url) acc[cor as CorProduto] = url;
        return acc;
      },
      {} as Partial<Record<CorProduto, string>>
    );
  }

  return Object.entries(value as Record<string, string>).reduce((acc, [cor, url]) => {
    const corNum = Number(cor);
    if (corNum && url) acc[corNum as CorProduto] = url;
    return acc;
  }, {} as Partial<Record<CorProduto, string>>);
};

export const getImagemDaCor = (
  produto: Produto,
  cor: CorProduto,
  coresDisponiveis: CorProduto[]
): string | null => {
  const map = produto.imagensPorCor ?? {};
  const imagemMapeada = map[cor];
  if (imagemMapeada) return imagemMapeada;

  const idx = coresDisponiveis.indexOf(cor);
  if (idx >= 0 && produto.imagens[idx]) return produto.imagens[idx];

  const slugs = COR_SLUGS[cor] ?? [];
  const porNome = produto.imagens.find((img) => {
    const lower = img.toLowerCase();
    return slugs.some((slug) => lower.includes(slug));
  });
  if (porNome) return porNome;

  return produto.imagens[0] ?? null;
};

export const getImagensExibidas = (
  produto: Produto,
  corSelecionada: CorProduto | '',
  coresDisponiveis: CorProduto[]
): string[] => {
  const todasImagens = [...produto.imagens];
  const porCor = Object.values(produto.imagensPorCor ?? {}).filter(Boolean) as string[];
  porCor.forEach((img) => {
    if (!todasImagens.includes(img)) todasImagens.push(img);
  });

  if (todasImagens.length === 0) return [];

  if (!corSelecionada) return todasImagens;

  const imagemCor = getImagemDaCor(produto, corSelecionada, coresDisponiveis);
  if (!imagemCor) return todasImagens;

  const restantes = todasImagens.filter((img) => img !== imagemCor);
  return [imagemCor, ...restantes];
};

