const carregarScriptPagBank = (sdkUrl: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (window.PagSeguro) {
      resolve();
      return;
    }

    const existente = document.querySelector<HTMLScriptElement>('script[data-pagbank-sdk]');
    if (existente) {
      existente.addEventListener('load', () => resolve());
      existente.addEventListener('error', () => reject(new Error('Falha ao carregar SDK do PagBank.')));
      return;
    }

    const script = document.createElement('script');
    script.src = sdkUrl;
    script.async = true;
    script.dataset.pagbankSdk = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar SDK do PagBank.'));
    document.body.appendChild(script);
  });

export const inicializarPagBank = async (publicKey: string, checkoutSdkUrl: string): Promise<void> => {
  if (!publicKey?.trim()) {
    throw new Error('Chave pública do PagBank não configurada no servidor.');
  }

  await carregarScriptPagBank(checkoutSdkUrl);

  if (!window.PagSeguro) {
    throw new Error('SDK do PagBank não disponível.');
  }
};

export const criptografarCartao = (
  publicKey: string,
  dados: {
    holder: string;
    number: string;
    expMonth: string;
    expYear: string;
    securityCode: string;
  },
): string => {
  const sdk = window.PagSeguro;
  if (!sdk) {
    throw new Error('SDK do PagBank não disponível.');
  }

  const ano = dados.expYear.length === 2 ? `20${dados.expYear}` : dados.expYear;

  const resultado = sdk.encryptCard({
    publicKey,
    holder: dados.holder.trim(),
    number: dados.number.replace(/\D/g, ''),
    expMonth: dados.expMonth.padStart(2, '0'),
    expYear: ano,
    securityCode: dados.securityCode.replace(/\D/g, ''),
  });

  if (resultado.hasErrors) {
    const mensagens: Record<string, string> = {
      INVALID_NUMBER: 'Número do cartão inválido',
      INVALID_SECURITY_CODE: 'CVV inválido',
      INVALID_EXPIRATION_MONTH: 'Mês de validade inválido',
      INVALID_EXPIRATION_YEAR: 'Ano de validade inválido',
      INVALID_PUBLIC_KEY: 'Chave pública do PagBank inválida',
      INVALID_HOLDER: 'Nome do titular inválido',
    };

    const msg = resultado.errors
      .map((e) => mensagens[e.code] ?? e.message)
      .join('. ');
    throw new Error(msg || 'Dados do cartão inválidos.');
  }

  if (!resultado.encryptedCard) {
    throw new Error('Não foi possível criptografar o cartão.');
  }

  return resultado.encryptedCard;
};

export const formatarMoeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const extrairTelefone = (telefone: string) => {
  const digitos = telefone.replace(/\D/g, '');
  if (digitos.length >= 10) {
    return { area: digitos.slice(0, 2), numero: digitos.slice(2) };
  }
  return { area: '61', numero: digitos || '999999999' };
};
