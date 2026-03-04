# 🚀 Guia para Criar Repositório GitHub e Fazer Deploy

## Passo 1: Criar Conta no GitHub

1. Acesse: https://github.com
2. Clique em "Sign up"
3. Preencha seus dados e crie a conta
4. Confirme seu email

## Passo 2: Criar Repositório no GitHub

1. Após fazer login, clique no botão **"+"** no canto superior direito
2. Selecione **"New repository"**
3. Preencha:
   - **Repository name**: `raizes-store` (ou o nome que preferir)
   - **Description**: "Loja online de impressões criativas"
   - **Public** ou **Private** (você escolhe)
   - **NÃO marque** "Initialize with README" (já temos arquivos)
4. Clique em **"Create repository"**

## Passo 3: Inicializar Git no Projeto

Execute os comandos abaixo no terminal (PowerShell), na pasta `D:\raizes-store`:

```powershell
# Navegar para a pasta do projeto
cd D:\raizes-store

# Inicializar repositório Git
git init

# Adicionar todos os arquivos
git add .

# Fazer primeiro commit
git commit -m "Initial commit - Raizes Store"

# Renomear branch para main (se necessário)
git branch -M main

# Adicionar o repositório remoto do GitHub
# SUBSTITUA 'seu-usuario' pelo seu nome de usuário do GitHub
git remote add origin https://github.com/seu-usuario/raizes-store.git

# Enviar código para o GitHub
git push -u origin main
```

## Passo 4: Conectar ao Vercel

1. Acesse: https://vercel.com
2. Faça login com sua conta GitHub
3. Clique em **"New Project"**
4. Selecione o repositório `raizes-store`
5. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. Adicione variável de ambiente:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `http://localhost:5000/api` (ou URL do seu backend em produção)
7. Clique em **"Deploy"**

## Passo 5: Conectar Domínio (Depois de Comprar)

1. No Vercel, vá em **Settings** > **Domains**
2. Adicione seu domínio
3. Configure o DNS conforme as instruções do Vercel

---

## ⚠️ Importante

- **NÃO faça commit** de arquivos sensíveis (senhas, chaves de API)
- O arquivo `.gitignore` já está configurado para ignorar arquivos desnecessários
- Mantenha suas variáveis de ambiente seguras

## 📝 Próximos Passos

1. ✅ Criar conta no GitHub
2. ✅ Criar repositório
3. ✅ Fazer commit e push
4. ✅ Deploy no Vercel
5. ⏳ Comprar domínio
6. ⏳ Conectar domínio ao Vercel
