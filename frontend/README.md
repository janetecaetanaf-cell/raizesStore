# Raizes Store - Frontend

Loja online de impressões criativas.

## 🚀 Deploy no Vercel

### Passo a Passo:

1. **Criar conta no Vercel**
   - Acesse: https://vercel.com
   - Faça login com GitHub

2. **Conectar repositório**
   - Clique em "New Project"
   - Conecte seu repositório GitHub
   - Selecione o diretório `frontend`

3. **Configurar variáveis de ambiente**
   - Em "Environment Variables", adicione:
     - `REACT_APP_API_URL` = URL do seu backend (ex: `https://seu-backend.railway.app/api`)

4. **Deploy**
   - Clique em "Deploy"
   - O Vercel fará o build automaticamente

5. **Conectar domínio (depois de comprar)**
   - Vá em "Settings" > "Domains"
   - Adicione seu domínio
   - Siga as instruções de DNS

## 📦 Instalação Local

```bash
npm install
npm start
```

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📝 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm test` - Executa testes
