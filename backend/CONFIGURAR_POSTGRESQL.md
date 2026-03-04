# Configuração do PostgreSQL

## Pré-requisitos

1. **Instalar PostgreSQL**
   - Baixe em: https://www.postgresql.org/download/windows/
   - Durante a instalação, anote a senha do usuário `postgres`

2. **Instalar pgAdmin 4** (opcional, mas recomendado)
   - Geralmente vem junto com o PostgreSQL
   - Ou baixe em: https://www.pgadmin.org/download/

## Configuração da Connection String

Edite o arquivo `RaizesStore.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=RaizesStore;Username=postgres;Password=SUA_SENHA_AQUI"
  }
}
```

**Substitua `SUA_SENHA_AQUI` pela senha que você definiu durante a instalação do PostgreSQL.**

## Criar o Banco de Dados

### Opção 1: Via pgAdmin 4

1. Abra o pgAdmin 4
2. Conecte ao servidor PostgreSQL (localhost)
3. Clique com botão direito em "Databases" → "Create" → "Database"
4. Nome: `RaizesStore`
5. Owner: `postgres`
6. Clique em "Save"

### Opção 2: Via linha de comando

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar o banco
CREATE DATABASE "RaizesStore";

# Sair
\q
```

### Opção 3: Automático

A aplicação criará o banco automaticamente quando você executar pela primeira vez (se tiver permissões).

## Executar a Aplicação

```bash
cd D:\raizes-store\backend\RaizesStore.Api
dotnet restore
dotnet run
```

As migrations serão aplicadas automaticamente e o banco será criado se não existir.

## Verificar se está funcionando

Após executar, você deve ver no console:

```
info: Program[0]
      Verificando migrations do banco de dados...
info: Program[0]
      Aplicando migrations pendentes...
info: Program[0]
      Migrations aplicadas com sucesso!
info: Program[0]
      Conexão com o banco de dados estabelecida com sucesso.
```

## Troubleshooting

### Erro: "password authentication failed"
- Verifique se a senha no `appsettings.json` está correta
- A senha padrão pode ser `postgres` se você não mudou durante a instalação

### Erro: "could not connect to server"
- Verifique se o PostgreSQL está rodando:
  - Windows: Abra "Services" e verifique se "postgresql-x64-XX" está rodando
  - Ou execute: `Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"}`

### Erro: "database does not exist"
- Crie o banco manualmente usando uma das opções acima
- Ou verifique se você tem permissão para criar bancos

## Estrutura do Banco

Após as migrations serem aplicadas, você terá as seguintes tabelas:
- `Categorias`
- `Produtos`
- `Clientes`
- `EnderecosClientes`
- `Pedidos`
- `ItensPedido`

Você pode visualizar tudo no pgAdmin 4!
