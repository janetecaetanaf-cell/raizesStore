# Como Criar o Banco de Dados

## Opção 1: Migrations Automáticas (Recomendado)

O banco de dados será criado automaticamente quando você executar a aplicação pela primeira vez, pois o `Program.cs` está configurado para aplicar as migrations automaticamente.

```bash
cd RaizesStore.Api
dotnet run
```

## Opção 2: Criar Manualmente via Migrations

Se preferir criar o banco manualmente antes de executar:

```bash
cd backend/RaizesStore.Api
dotnet ef database update --project ../RaizesStore.Infrastructure --startup-project .
```

**Nota:** Para usar o comando `dotnet ef`, você precisa ter o Entity Framework Tools instalado:

```bash
dotnet tool install --global dotnet-ef
```

Se já tiver instalado, verifique a versão:
```bash
dotnet ef --version
```

## Opção 3: Criar Banco Manualmente no SQL Server

1. Abra o SQL Server Management Studio (SSMS)
2. Conecte ao seu servidor SQL Server
3. Clique com o botão direito em "Databases" e selecione "New Database"
4. Nomeie como `RaizesStore`
5. Clique em OK

Depois disso, execute a aplicação e as migrations serão aplicadas automaticamente.

## Verificar se o Banco foi Criado

Após executar a aplicação, você pode verificar se as tabelas foram criadas:

```sql
USE RaizesStore;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES;
```

Você deve ver as seguintes tabelas:
- Categorias
- Produtos
- Clientes
- EnderecosClientes
- Pedidos
- ItensPedido
