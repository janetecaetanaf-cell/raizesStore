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

  const login = async (email: string, senha?: string) => {
    // Buscar cliente pelo email
    try {
      const response = await api.get('/clientes');
      const clientes = response.data;
      const cliente = Array.isArray(clientes) 
        ? clientes.find((c: any) => c.email === email) 
        : null;
      
      if (cliente) {
        const usuarioData: Usuario = {
          id: cliente.id,
          nome: cliente.nome,
          email: cliente.email,
          telefoneCelular: cliente.telefoneCelular,
        };
        setUsuario(usuarioData);
        localStorage.setItem('usuario', JSON.stringify(usuarioData));
      } else {
        throw new Error('Cliente não encontrado. Cadastre-se primeiro.');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
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
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefoneCelular: cliente.telefoneCelular,
      };
      setUsuario(usuarioData);
      localStorage.setItem('usuario', JSON.stringify(usuarioData));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao cadastrar');
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
