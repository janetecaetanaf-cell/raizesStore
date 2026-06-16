import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefoneCelular: string;
  isAdmin: boolean;
}

interface AuthContextType {
  usuario: Usuario | null;
  login: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: {
    nome: string;
    email: string;
    telefoneCelular: string;
    dataNascimento: string;
    cpf?: string;
    senha: string;
  }) => Promise<void>;
  logout: () => void;
  estaAutenticado: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const extrairUsuario = (cliente: Record<string, unknown>): Usuario => ({
  id: String(cliente.id ?? cliente.Id ?? ''),
  nome: String(cliente.nome ?? cliente.Nome ?? ''),
  email: String(cliente.email ?? cliente.Email ?? ''),
  telefoneCelular: String(cliente.telefoneCelular ?? cliente.TelefoneCelular ?? ''),
  isAdmin: Boolean(cliente.isAdmin ?? cliente.IsAdmin ?? false),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario');
    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo));
      } catch {
        localStorage.removeItem('usuario');
      }
    }
  }, []);

  const salvarUsuario = (usuarioData: Usuario) => {
    setUsuario(usuarioData);
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
  };

  const login = async (email: string, senha: string) => {
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado) throw new Error('Informe o e-mail.');
    if (!senha?.trim()) throw new Error('Informe a senha.');

    try {
      const response = await api.post('/clientes/login', { email: emailNormalizado, senha });
      salvarUsuario(extrairUsuario(response.data));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } | string }; message?: string };
      const msgApi = typeof err.response?.data === 'object'
        ? err.response?.data?.message
        : err.response?.data ?? err.message;
      throw new Error(
        typeof msgApi === 'string' && msgApi.trim()
          ? msgApi
          : 'Não foi possível entrar. Tente novamente em instantes.'
      );
    }
  };

  const cadastrar = async (dados: {
    nome: string;
    email: string;
    telefoneCelular: string;
    dataNascimento: string;
    cpf?: string;
    senha: string;
  }) => {
    try {
      const dataNascimento = dados.dataNascimento
        ? new Date(dados.dataNascimento).toISOString()
        : new Date().toISOString();
      const cpf = dados.cpf && dados.cpf.trim() ? dados.cpf.trim() : null;

      const response = await api.post('/clientes', {
        nome: dados.nome.trim(),
        email: dados.email.trim().toLowerCase(),
        telefoneCelular: dados.telefoneCelular.trim(),
        dataNascimento,
        cpf,
        senha: dados.senha,
      });

      salvarUsuario(extrairUsuario(response.data));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } | string }; message?: string };
      const msgApi = typeof err.response?.data === 'object'
        ? err.response?.data?.message
        : err.response?.data ?? err.message;
      throw new Error(
        typeof msgApi === 'string' && msgApi.trim()
          ? msgApi
          : 'Não foi possível cadastrar. Tente novamente em instantes.'
      );
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        cadastrar,
        logout,
        estaAutenticado: !!usuario,
        isAdmin: usuario?.isAdmin ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
