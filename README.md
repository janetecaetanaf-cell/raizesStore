# Raizes Store

Loja online para venda de camisetas religiosas, de copa, personalizadas, para eventos, datas comemorativas, canecas e outros produtos.

## Estrutura do Projeto

- `backend/` - API .NET Core
- `frontend/` - Aplicação React

## Funcionalidades

### Loja (Frontend)
- ✅ Catálogo de produtos por categoria
- ✅ Seleção de tamanho e cor para camisetas
- ✅ Seleção de cor para canecas
- ✅ Carrinho de compras
- ✅ Checkout com pagamento via PIX
- ✅ Cadastro de clientes

### Administrativo
- ✅ Dashboard com estatísticas (clientes cadastrados, compras pagas, aguardando pagamento)
- ✅ Gestão de produtos e categorias (via API)
- ✅ Gestão de pedidos
- ✅ Visualização de clientes cadastrados (telefone, email, data de nascimento)
- ✅ Controle de estoque

## Tecnologias

- Backend: .NET 8, Entity Framework Core, SQL Server
- Frontend: React, TypeScript, Chakra UI
- Pagamento: PIX (estrutura preparada)

## Pré-requisitos

- .NET 8 SDK
- Node.js 18+ e npm
- SQL Server (ou SQL Server Express)

## Como executar

### 1. Configurar Banco de Dados

Edite o arquivo `backend/RaizesStore.Api/appsettings.json` e configure a connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=RaizesStore;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### 2. Executar Backend

```bash
cd backend
dotnet restore
dotnet run --project RaizesStore.Api
```

A API estará disponível em `http://localhost:5000` (ou porta configurada)

### 3. Executar Frontend

```bash
cd frontend
npm install
npm start
```

O frontend estará disponível em `http://localhost:3000`

## Endpoints da API

### Categorias
- `GET /api/categorias` - Listar categorias
- `GET /api/categorias/{id}` - Obter categoria
- `POST /api/categorias` - Criar categoria
- `PUT /api/categorias/{id}` - Atualizar categoria
- `DELETE /api/categorias/{id}` - Deletar categoria

### Produtos
- `GET /api/produtos` - Listar produtos (filtros: categoriaId, tipoProduto)
- `GET /api/produtos/{id}` - Obter produto
- `POST /api/produtos` - Criar produto
- `PUT /api/produtos/{id}` - Atualizar produto
- `DELETE /api/produtos/{id}` - Deletar produto

### Clientes
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/{id}` - Obter cliente
- `POST /api/clientes` - Criar cliente
- `PUT /api/clientes/{id}` - Atualizar cliente

### Pedidos
- `GET /api/pedidos` - Listar pedidos (filtro: status)
- `GET /api/pedidos/{id}` - Obter pedido
- `POST /api/pedidos` - Criar pedido
- `POST /api/pedidos/{id}/confirmar-pagamento` - Confirmar pagamento
- `POST /api/pedidos/{id}/enviar` - Marcar como enviado
- `POST /api/pedidos/{id}/entregue` - Marcar como entregue

### Admin
- `GET /api/admin/dashboard` - Dashboard com estatísticas
- `GET /api/admin/clientes` - Lista de clientes para admin
- `GET /api/admin/pedidos` - Lista de pedidos para admin (filtro: status)

## Próximos Passos

1. Integrar com serviço real de PIX (ex: Gerencianet, Mercado Pago)
2. Implementar autenticação e autorização
3. Adicionar upload de imagens para produtos
4. Implementar formulários completos de gestão de produtos no admin
5. Adicionar relatórios e exportação de dados
6. Implementar notificações por email
7. Adicionar sistema de cupons de desconto
