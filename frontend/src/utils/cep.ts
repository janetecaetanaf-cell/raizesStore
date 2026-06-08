export interface EnderecoViaCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
}

export const limparCep = (cep: string): string => cep.replace(/\D/g, '').slice(0, 8);

export const formatarCep = (cep: string): string => {
  const digits = limparCep(cep);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const buscarEnderecoPorCep = async (cep: string): Promise<EnderecoViaCep | null> => {
  const digits = limparCep(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) return null;

  const data = await response.json();
  if (data.erro) return null;

  return {
    logradouro: data.logradouro ?? '',
    bairro: data.bairro ?? '',
    cidade: data.localidade ?? '',
    estado: data.uf ?? '',
    complemento: data.complemento ?? '',
  };
};
