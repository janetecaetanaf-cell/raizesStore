# 🚀 Guia de Deploy do Backend no Railway

## Pré-requisitos
- Conta no GitHub (já tem ✅)
- Conta no Railway: https://railway.app

## Passo 1: Criar Conta no Railway

1. Acesse: https://railway.app
2. Clique em "Start a New Project"
3. Faça login com GitHub
4. Escolha o plano **Hobby** (gratuito)

## Passo 2: Adicionar Projeto

1. No dashboard do Railway, clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Autorize o Railway a acessar seus repositórios
4. Selecione o repositório `raizesStore/raizes-store`
5. Configure:
   - **Root Directory**: `backend/RaizesStore.Api`
   - **Build Command**: `dotnet publish -c Release -o /app`
   - **Start Command**: `dotnet RaizesStore.Api.dll`

## Passo 3: Adicionar Banco de Dados PostgreSQL

1. No projeto do Railway, clique em **"New"**
2. Selecione **"Database"** > **"Add PostgreSQL"**
3. O Railway criará um banco PostgreSQL automaticamente
4. Anote as variáveis de ambiente que aparecerem (serão usadas depois)

## Passo 4: Configurar Variáveis de Ambiente

No projeto da API, vá em **"Variables"** e adicione:

### Variáveis do Banco de Dados (vêm do PostgreSQL que você criou):
- `PGHOST` = (vem do PostgreSQL)
- `PGPORT` = (vem do PostgreSQL)
- `PGDATABASE` = (vem do PostgreSQL)
- `PGUSER` = (vem do PostgreSQL)
- `PGPASSWORD` = (vem do PostgreSQL)

### Ou use a variável completa:
- `DATABASE_URL` = (vem do PostgreSQL - formato: postgresql://user:password@host:port/database)

### Outras variáveis:
- `ASPNETCORE_ENVIRONMENT` = `Production`
- `ASPNETCORE_URLS` = `http://0.0.0.0:$PORT` (Railway define $PORT automaticamente)

## Passo 5: Configurar Connection String

No `appsettings.json` ou via variável de ambiente, configure:

```
ConnectionStrings__DefaultConnection = (use a DATABASE_URL ou monte a string com as variáveis PGHOST, etc)
```

## Passo 6: Executar Migrations

1. No Railway, vá em **"Settings"** do projeto da API
2. Em **"Deploy"**, adicione um comando de build customizado:
   - Ou crie um script que execute as migrations antes de iniciar

## Passo 7: Deploy

1. O Railway fará o deploy automaticamente
2. Quando terminar, você verá uma URL tipo: `raizes-store-api.up.railway.app`
3. Essa é a URL da sua API em produção!

## Passo 8: Atualizar Frontend

1. No Vercel, vá em **Settings** > **Environment Variables**
2. Edite `REACT_APP_API_URL`
3. Coloque: `https://sua-url-railway.up.railway.app/api`
4. Faça um novo deploy no Vercel

---

## 📝 Notas Importantes

- O Railway oferece 500 horas gratuitas por mês no plano Hobby
- O banco PostgreSQL também é gratuito (com limitações)
- As migrations precisam ser executadas manualmente ou via script
- A URL da API será algo como: `https://seu-projeto.up.railway.app`

## 🔧 Alternativa: Render

Se preferir usar Render:
1. Acesse: https://render.com
2. Crie conta com GitHub
3. New > Web Service
4. Conecte o repositório
5. Configure similar ao Railway
