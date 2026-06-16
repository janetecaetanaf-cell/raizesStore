import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Envia o e-mail do usuário logado em cada requisição para que
// o backend possa verificar permissões de admin.
api.interceptors.request.use((config) => {
  const usuarioSalvo = localStorage.getItem('usuario');
  if (usuarioSalvo) {
    try {
      const usuario = JSON.parse(usuarioSalvo);
      if (usuario?.email) {
        config.headers['X-User-Email'] = usuario.email;
      }
    } catch {
      // ignora localStorage corrompido
    }
  }
  return config;
});

export default api;
