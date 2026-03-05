# 🚀 Deploy Backend - Guia Rápido

## Opção 1: Railway (Recomendado)

### Passo 1: Criar Conta
1. Acesse: https://railway.app
2. Faça login com GitHub
3. Escolha plano **Hobby** (gratuito)

### Passo 2: Criar Projeto
1. Clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Autorize e selecione: `raizesStore/raizes-store`
4. Configure:
   - **Root Directory**: `backend`
   - **Service Type**: Web Service

### Passo 3: Adicionar PostgreSQL
1. No projeto, clique em **"New"** > **"Database"** > **"Add PostgreSQL"**
2. Anote as variáveis de ambiente que aparecerem

### Passo 4: Configurar Variáveis de Ambiente
No serviço da API, vá em **"Variables"** e adicione:

**Do PostgreSQL (copie do banco criado):**
- `DATABASE_URL` = (vem automaticamente do PostgreSQL)

**Ou monte manualmente:**
- `ConnectionStrings__DefaultConnection` = `Host={PGHOST};Port={PGPORT};Database={PGDATABASE};Username={PGUSER};Password={PGPASSWORD};SSL Mode=Require;`

**Outras:**
- `ASPNETCORE_ENVIRONMENT` = `Production`
- `PORT` = (Railway define automaticamente)

### Passo 5: Configurar Build
O Railway deve detectar automaticamente que é .NET. Se não:
- **Build Command**: `dotnet publish RaizesStore.Api/RaizesStore.Api.csproj -c Release -o /app`
- **Start Command**: `cd /app && dotnet RaizesStore.Api.dll`

### Passo 6: Deploy
- O Railway fará deploy automaticamente
- Quando terminar, você terá uma URL tipo: `raizes-store-api.up.railway.app`

### Passo 7: Atualizar Frontend
1. No Vercel, vá em **Settings** > **Environment Variables**
2. Edite `REACT_APP_API_URL`
3. Coloque: `https://sua-url-railway.up.railway.app/api`
4. Faça redeploy no Vercel

---

## ✅ Checklist

- [ ] Conta criada no Railway
- [ ] Projeto criado e conectado ao GitHub
- [ ] PostgreSQL adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy concluído
- [ ] URL da API anotada
- [ ] Frontend atualizado com nova URL da API
- [ ] Testado acesso ao site

---

## 🔗 Links Úteis

- Railway: https://railway.app
- Dashboard: https://railway.app/dashboard
- Documentação: https://docs.railway.app
