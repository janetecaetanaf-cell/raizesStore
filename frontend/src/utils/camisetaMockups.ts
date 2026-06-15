import { CorProduto } from '../types';

export type CamisetaTema = 'sua-ideia' | 'motivacao' | 'rock' | 'casamento' | 'noivado' | 'brasil' | 'aurora';

const COR_SLUG: Partial<Record<CorProduto, string>> = {
  [CorProduto.Branco]: 'branca',
  [CorProduto.Preto]: 'preta',
  [CorProduto.Verde]: 'verde',
  [CorProduto.Amarelo]: 'amarela',
  [CorProduto.Rosa]: 'rosa',
  [CorProduto.Bege]: 'bege',
};

const TEMA_COR_PADRAO: Record<CamisetaTema, CorProduto> = {
  'sua-ideia': CorProduto.Branco,
  motivacao: CorProduto.Branco,
  rock: CorProduto.Preto,
  casamento: CorProduto.Bege,
  noivado: CorProduto.Branco,
  brasil: CorProduto.Amarelo,
  aurora: CorProduto.Preto,
};

export const resolveCamisetaTema = (nome: string): CamisetaTema => {
  if (nome.includes('Sua Ideia')) return 'sua-ideia';
  if (nome.includes('Motivacional')) return 'motivacao';
  if (nome.includes('Rock')) return 'rock';
  if (nome.includes('Casamento')) return 'casamento';
  if (nome.includes('Noivado')) return 'noivado';
  if (nome.includes('Brasil') || nome.includes('Seleção') || nome.includes('Time')) return 'brasil';
  if (nome.includes('Aurora')) return 'aurora';
  return 'sua-ideia';
};

const EXTENSAO_POR_TEMA: Partial<Record<CamisetaTema, string>> = {
  'sua-ideia': 'png',
  rock: 'png',
  noivado: 'png',
  brasil: 'png',
  aurora: 'png',
};

export const getCamisetaMockup = (tema: CamisetaTema, cor?: CorProduto) => {
  if (tema === 'aurora') {
    if (cor === CorProduto.Preto) return '/images/produtos/camiseta-aurora-preta.png';
    return '/images/produtos/camiseta-aurora-estampa.png';
  }

  let slug = (cor != null && COR_SLUG[cor]) || COR_SLUG[TEMA_COR_PADRAO[tema]] || 'branca';
  if (tema === 'brasil' && slug === 'preta') slug = 'amarela';
  const ext = EXTENSAO_POR_TEMA[tema] ?? 'svg';
  return `/images/produtos/camiseta-${tema}-${slug}.${ext}`;
};

export const buildImagensCamiseta = (cores: CorProduto[], tema: CamisetaTema = 'sua-ideia') => {
  const listaCores = cores.length > 0 ? cores : [TEMA_COR_PADRAO[tema]];

  const imagensPorCor = listaCores.reduce((acc, cor) => {
    acc[cor] = getCamisetaMockup(tema, cor);
    return acc;
  }, {} as Partial<Record<CorProduto, string>>);

  const imagens = listaCores
    .map((cor) => getCamisetaMockup(tema, cor))
    .filter((img, idx, arr) => arr.indexOf(img) === idx);

  return {
    imagens: imagens.length > 0 ? imagens : [getCamisetaMockup(tema)],
    imagensPorCor,
  };
};
