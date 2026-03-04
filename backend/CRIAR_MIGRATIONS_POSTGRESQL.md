# Criar Migrations para PostgreSQL

Após configurar o PostgreSQL, você precisa criar novas migrations:

## Passos:

1. **Certifique-se de que o PostgreSQL está rodando**

2. **Edite o appsettings.json com sua senha do PostgreSQL:**
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=RaizesStore;Username=postgres;Password=SUA_SENHA"
     }
   }
   ```

3. **Crie o banco de dados no PostgreSQL** (via pgAdmin 4 ou linha de comando):
   ```sql
   CREATE DATABASE "RaizesStore";
   ```

4. **Crie as migrations:**
   ```bash
   cd D:\raizes-store\backend\RaizesStore.Api
   dotnet ef migrations add InitialCreate --project ../RaizesStore.Infrastructure --startup-project .
   ```

5. **Aplique as migrations:**
   ```bash
   dotnet ef database update --project ../RaizesStore.Infrastructure --startup-project .
   ```

6. **Ou simplesmente execute a aplicação** - as migrations serão aplicadas automaticamente:
   ```bash
   dotnet run
   ```

## Nota:

As migrations antigas do SQL Server foram removidas. As novas migrations serão criadas automaticamente para PostgreSQL quando você executar a aplicação pela primeira vez.
