import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ItemCarrinho } from '../types';

interface CarrinhoContextType {
  itens: ItemCarrinho[];
  adicionarItem: (item: ItemCarrinho) => void;
  removerItem: (produtoId: string, tamanho?: number, cor?: number) => void;
  atualizarQuantidade: (produtoId: string, quantidade: number, tamanho?: number, cor?: number) => void;
  limparCarrinho: () => void;
  total: number;
}

const CarrinhoContext = createContext<CarrinhoContextType | undefined>(undefined);

export const CarrinhoProvider = ({ children }: { children: ReactNode }) => {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  const adicionarItem = (novoItem: ItemCarrinho) => {
    setItens((prevItens) => {
      const itemExistente = prevItens.find(
        (item) =>
          item.produto.id === novoItem.produto.id &&
          item.tamanho === novoItem.tamanho &&
          item.cor === novoItem.cor
      );

      if (itemExistente) {
        return prevItens.map((item) =>
          item.produto.id === novoItem.produto.id &&
          item.tamanho === novoItem.tamanho &&
          item.cor === novoItem.cor
            ? { ...item, quantidade: item.quantidade + novoItem.quantidade }
            : item
        );
      }

      return [...prevItens, novoItem];
    });
  };

  const removerItem = (produtoId: string, tamanho?: number, cor?: number) => {
    setItens((prevItens) =>
      prevItens.filter(
        (item) =>
          !(
            item.produto.id === produtoId &&
            item.tamanho === tamanho &&
            item.cor === cor
          )
      )
    );
  };

  const atualizarQuantidade = (produtoId: string, quantidade: number, tamanho?: number, cor?: number) => {
    if (quantidade <= 0) {
      removerItem(produtoId, tamanho, cor);
      return;
    }

    setItens((prevItens) =>
      prevItens.map((item) =>
        item.produto.id === produtoId &&
        item.tamanho === tamanho &&
        item.cor === cor
          ? { ...item, quantidade }
          : item
      )
    );
  };

  const limparCarrinho = () => {
    setItens([]);
  };

  const total = itens.reduce(
    (acc, item) => acc + item.produto.preco * item.quantidade,
    0
  );

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        adicionarItem,
        removerItem,
        atualizarQuantidade,
        limparCarrinho,
        total,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
};

export const useCarrinho = () => {
  const context = useContext(CarrinhoContext);
  if (!context) {
    throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider');
  }
  return context;
};
