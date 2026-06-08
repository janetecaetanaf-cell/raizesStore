import { NavigateFunction } from 'react-router-dom';

export const obterRedirectSeguro = (redirect?: string | null): string => {
  if (!redirect) return '/';
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return '/';
  return redirect;
};

export const irParaLogin = (navigate: NavigateFunction, returnPath: string) => {
  navigate(`/login?redirect=${encodeURIComponent(returnPath)}`);
};
