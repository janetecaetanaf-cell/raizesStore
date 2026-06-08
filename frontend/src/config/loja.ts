export const LOJA = {
  nome: 'Raízes Estampas',
  instagram: 'raizes.estampas',
  instagramUrl: 'https://instagram.com/raizes.estampas',
  whatsapp: '5561981933827',
  whatsappDisplay: '(61) 98193-3827',
  email: 'contato@raizesestampas.com.br',
};

export const whatsappLink = (mensagem: string) =>
  `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(mensagem)}`;
