import { Categoria } from '../types';
import type { Produto } from '../types';

export const normalizarCategoria = (data: Record<string, unknown>): Categoria => {
  const paiId = data.categoriaPaiId ?? data.CategoriaPaiId;
  return {
    id: String(data.id ?? data.Id ?? ''),
    nome: String(data.nome ?? data.Nome ?? ''),
    descricao: String(data.descricao ?? data.Descricao ?? ''),
    ativo: Boolean(data.ativo ?? data.Ativo ?? true),
    ordem: Number(data.ordem ?? data.Ordem ?? 0),
    categoriaPaiId: paiId ? String(paiId) : undefined,
  };
};

export const normalizarCategorias = (lista: Record<string, unknown>[]): Categoria[] =>
  lista.map((c) => normalizarCategoria(c));

export const getCategoriasRaiz = (categorias: Categoria[]): Categoria[] =>
  categorias
    .filter((c) => c.ativo && !c.categoriaPaiId)
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));

export const getSubcategorias = (categorias: Categoria[], categoriaPaiId: string): Categoria[] =>
  categorias
    .filter((c) => c.ativo && c.categoriaPaiId === categoriaPaiId)
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));

export const getCategoriasFolha = (categorias: Categoria[]): Categoria[] =>
  categorias
    .filter((c) => c.ativo && c.categoriaPaiId)
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));

export const getNomeCategoriaCompleto = (
  categoria: Categoria | undefined,
  categorias: Categoria[],
  categoriaId?: string
): string => {
  const cat =
    (categoria?.id ? categorias.find((c) => c.id === categoria.id) : undefined) ??
    (categoriaId ? categorias.find((c) => c.id === categoriaId) : undefined) ??
    categoria;

  if (!cat) return '-';
  if (!cat.categoriaPaiId) return cat.nome;
  const pai = categorias.find((c) => c.id === cat.categoriaPaiId);
  return pai ? `${pai.nome} › ${cat.nome}` : cat.nome;
};

export const getIdsSubcategorias = (categorias: Categoria[], categoriaPaiId: string): string[] =>
  getSubcategorias(categorias, categoriaPaiId).map((c) => c.id);

const obterDataCriacao = (produto: Produto) =>
  produto.createdAt ? new Date(produto.createdAt).getTime() : 0;

/** Um produto mais recente por categoria principal (aba Variados). */
export const selecionarDestaquesPorLinha = (
  produtos: Produto[],
  categorias: Categoria[],
): Produto[] => {
  const selecionados: Produto[] = [];

  for (const pai of getCategoriasRaiz(categorias)) {
    const idsCategoria = new Set(getIdsSubcategorias(categorias, pai.id));
    idsCategoria.add(pai.id);

    const maisRecente = produtos
      .filter((p) => idsCategoria.has(p.categoriaId))
      .sort((a, b) => obterDataCriacao(b) - obterDataCriacao(a))[0];

    if (maisRecente) {
      selecionados.push(maisRecente);
    }
  }

  return selecionados;
};
