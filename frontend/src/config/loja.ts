export const LOJA = {
  nome: 'Raízes Estampas',
  instagram: 'raizes.estampas',
  instagramUrl: 'https://instagram.com/raizes.estampas',
  whatsapp: '5561981933827',
  whatsappDisplay: '(61) 98193-3827',
  email: 'contato@raizesestampas.com.br',
};

/** Troque para 'pagseguro' quando o backend + PagSeguro estiverem no ar. */
export type ModoPagamentoCheckout = 'pix-manual' | 'pagseguro';

export const PAGAMENTO = {
  modo: 'pix-manual' as ModoPagamentoCheckout,
  pix: {
    chave: '61981933827',
    chaveExibicao: '(61) 98193-3827',
    titular: 'Raízes Estampas',
    tipo: 'Celular',
  },
};

export const whatsappLink = (mensagem: string) =>
  `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(mensagem)}`;

export interface ResumoPedidoWhatsApp {
  numeroPedido: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  enderecoLinha: string;
  itensLinhas: string;
  total: number;
}

export const montarMensagemPedidoWhatsApp = (resumo: ResumoPedidoWhatsApp): string =>
  [
    `Olá! Fiz um pedido na ${LOJA.nome}.`,
    '',
    `Pedido: ${resumo.numeroPedido}`,
    `Nome: ${resumo.nome}`,
    `E-mail: ${resumo.email}`,
    `Telefone: ${resumo.telefone}`,
    `CPF: ${resumo.cpf}`,
    '',
    'Itens:',
    resumo.itensLinhas,
    '',
    `Total: R$ ${resumo.total.toFixed(2).replace('.', ',')}`,
    `Endereço: ${resumo.enderecoLinha}`,
    '',
    'Segue em anexo o comprovante do Pix.',
  ].join('\n');
