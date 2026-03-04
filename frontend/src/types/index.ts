export enum TipoProduto {
  Camiseta = 1,
  Caneca = 2,
  Outros = 3,
}

export enum TamanhoProduto {
  PP = 1,
  P = 2,
  M = 3,
  G = 4,
  GG = 5,
  XG = 6,
  XXG = 7,
}

export enum CorProduto {
  Branco = 1,
  Preto = 2,
  Azul = 3,
  Vermelho = 4,
  Verde = 5,
  Amarelo = 6,
  Rosa = 7,
  Cinza = 8,
  Marrom = 9,
  Laranja = 10,
  Roxo = 11,
  Bege = 12,
}

export enum StatusPedido {
  AguardandoPagamento = 1,
  Pago = 2,
  Enviado = 3,
  Entregue = 4,
  Cancelado = 5,
}

export interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoriaId: string;
  categoria?: Categoria;
  tipoProduto: TipoProduto;
  ativo: boolean;
  estoque: number;
  tamanhosDisponiveis: TamanhoProduto[];
  coresDisponiveis: CorProduto[];
  imagens: string[];
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefoneCelular: string;
  dataNascimento: string;
  cpf?: string;
  enderecos: EnderecoCliente[];
}

export interface EnderecoCliente {
  id: string;
  clienteId: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string;
  principal: boolean;
}

export interface ItemPedido {
  id: string;
  pedidoId: string;
  produtoId: string;
  produto?: Produto;
  quantidade: number;
  tamanho?: TamanhoProduto;
  cor?: CorProduto;
  precoUnitario: number;
  valorTotal: number;
}

export interface Pedido {
  id: string;
  numeroPedido: string;
  clienteId: string;
  cliente?: Cliente;
  enderecoEntregaId: string;
  enderecoEntrega?: EnderecoCliente;
  status: StatusPedido;
  itens: ItemPedido[];
  valorTotal: number;
  codigoPix?: string;
  qrCodePix?: string;
  dataPagamento?: string;
  dataEnvio?: string;
  dataEntrega?: string;
  codigoRastreamento?: string;
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  tamanho?: TamanhoProduto;
  cor?: CorProduto;
}
