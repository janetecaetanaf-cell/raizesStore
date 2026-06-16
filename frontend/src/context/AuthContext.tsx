import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefoneCelular: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  login: (email: string, senha?: string) => Promise<void>;
  cadastrar: (dados: {
    nome: string;
    email: string;
    telefoneCelular: string;
    dataNascimento: string;
    cpf?: string;
    senha?: string;
  }) => Promise<void>;
  logout: () => void;
  estaAutenticado: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const usuarioSalvo = localStorage.getItem('usuario');
    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
  }, []);

  const login = async (email: string, _senha?: string) => {
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado) {
      throw new Error('Informe o e-mail.');
    }

    try {
      const response = await api.get('/clientes/por-email', {
        params: { email: emailNormalizado },
      });
      const cliente = response.data;

      const usuarioData: Usuario = {
        id: cliente.id ?? cliente.Id,
        nome: cliente.nome ?? cliente.Nome,
        email: cliente.email ?? cliente.Email,
        telefoneCelular: cliente.telefoneCelular ?? cliente.TelefoneCelular,
      };
      setUsuario(usuarioData);
      localStorage.setItem('usuario', JSON.stringify(usuarioData));
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('E-mail não cadastrado. Use a aba Cadastre-se para criar sua conta.');
      }
      const msgApi =
        error.response?.data?.message ??
        error.response?.data ??
        error.message;
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
    senha?: string;
  }) => {
    try {
      // Converter data para ISO string e garantir que CPF seja null se vazio
      const dataNascimento = dados.dataNascimento 
        ? new Date(dados.dataNascimento).toISOString()
        : new Date().toISOString();
      
      const cpf = dados.cpf && dados.cpf.trim() ? dados.cpf.trim() : null;

      const response = await api.post('/clientes', {
        nome: dados.nome.trim(),
        email: dados.email.trim(),
        telefoneCelular: dados.telefoneCelular.trim(),
        dataNascimento: dataNascimento,
        cpf: cpf,
      });

      const cliente = response.data;
      const usuarioData: Usuario = {
        id: cliente.id ?? cliente.Id,
        nome: cliente.nome ?? cliente.Nome,
        email: cliente.email ?? cliente.Email,
        telefoneCelular: cliente.telefoneCelular ?? cliente.TelefoneCelular,
      };
      setUsuario(usuarioData);
      localStorage.setItem('usuario', JSON.stringify(usuarioData));
    } catch (error: any) {
      const msgApi =
        error.response?.data?.message ??
        error.response?.data ??
        error.message;
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
