# Deploy Backend no Render

Guia para publicar a API .NET + PostgreSQL da Raizes Store no [Render](https://render.com).

## Custos (aproximado)

| Recurso | Plano | Custo |
|---------|-------|-------|
| Web Service (API) | **Starter** | ~US$ 7/mês |
| PostgreSQL | **Starter** | ~US$ 7/mês |
| **Total** | | ~**US$ 14/mês** |

Use plano **Starter** (não Free) para loja em produção — API sempre no ar e banco persistente.

---

## Passo 1 — Conta e repositório

1. Acesse https://render.com e crie conta (GitHub).
2. Confirme que o código está no GitHub: `janetecaetanaf-cell/raizesStore`.
3. Faça push do `Dockerfile` e `render.yaml` (se ainda não estiverem no GitHub).

---

## Passo 2 — Banco PostgreSQL

1. Dashboard → **New +** → **PostgreSQL**
2. Nome: `raizes-store-db`
3. Plano: **Starter**
4. Região: escolha a mais próxima (ex.: Oregon ou São Paulo se disponível)
5. **Create Database**
6. Anote a **Internal Database URL** (formato `postgres://...`)

---

## Passo 3 — Web Service (API)

1. **New +** → **Web Service**
2. Conecte o repositório `raizesStore`
3. Configuração:

| Campo | Valor |
|-------|--------|
| **Name** | `raizes-store-api` |
| **Root Directory** | `backend` |
| **Runtime** | **Docker** |
| **Dockerfile Path** | `./Dockerfile` |
| **Plan** | **Starter** |

4. **Environment Variables**:

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | Cole a **Internal Database URL** do Postgres |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `FRONTEND_URL` | URL do site no Vercel (ex.: `https://raizes-store-livid.vercel.app`) |

5. **Create Web Service** — aguarde o build (~5–10 min na 1ª vez).

---

## Passo 4 — Testar a API

Quando ficar **Live**, abra:

- `https://SUA-URL.onrender.com/health` → deve retornar `{"status":"ok"}`
- `https://SUA-URL.onrender.com/api/produtos` → JSON com produtos

---

## Passo 5 — Conectar o site (Vercel)

1. Vercel → projeto **raizes-store** → **Settings** → **Environment Variables**
2. Adicione ou edite:
   - `REACT_APP_API_URL` = `https://SUA-URL.onrender.com/api`
3. **Deployments** → **Redeploy**

O site passará a usar produtos e admin do banco real.

---

## Passo 6 — Painel admin

1. Acesse `https://SEU-SITE.vercel.app/admin`
2. Faça login com usuário admin (criado no seed do banco na 1ª subida)

---

## PagSeguro (quando quiser)

No Render, no Web Service → **Environment**:

| Variável | Exemplo |
|----------|---------|
| `PAGSEGURO_EMAIL` | seu e-mail PagSeguro |
| `PAGSEGURO_TOKEN` | token |
| `PAGSEGURO_PUBLIC_KEY` | chave pública |
| `PAGSEGURO_SANDBOX` | `true` (teste) ou `false` (produção) |
| `PAGSEGURO_NOTIFICATION_URL` | `https://SUA-URL.onrender.com/api/pagamentos/webhook` |

No frontend (`frontend/src/config/loja.ts`), troque `PAGAMENTO.modo` para `'pagseguro'` quando for usar checkout automático.

---

## Alternativa: Blueprint

No Render: **New +** → **Blueprint** → selecione o repo `raizesStore` (usa o `render.yaml` na raiz).

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| Build falha | Veja **Logs**; confirme Root Directory = `backend` |
| API sem produtos | Verifique `DATABASE_URL` e logs de migration/seed |
| Site não carrega produtos | Confira `REACT_APP_API_URL` no Vercel + redeploy |
| Upload de imagens some após deploy | Render Starter usa disco efêmero — use URLs de imagens em `public/images` no Git |

---

## Links

- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
