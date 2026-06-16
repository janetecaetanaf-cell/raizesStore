import { Categoria } from '../types';

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
  categorias: Categoria[]
): string => {
  if (!categoria) return '-';
  if (!categoria.categoriaPaiId) return categoria.nome;
  const pai = categorias.find((c) => c.id === categoria.categoriaPaiId);
  return pai ? `${pai.nome} › ${categoria.nome}` : categoria.nome;
};

export const getIdsSubcategorias = (categorias: Categoria[], categoriaPaiId: string): string[] =>
  getSubcategorias(categorias, categoriaPaiId).map((c) => c.id);
