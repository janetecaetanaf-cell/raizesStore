# Solução de Problemas Comuns

## Warnings de Value Comparer

Os warnings sobre `ValueComparer` foram corrigidos adicionando comparadores customizados para as propriedades de coleção (`TamanhosDisponiveis`, `CoresDisponiveis`, `Imagens`).

## Exceção não tratada ao iniciar a aplicação

### Possíveis causas:

1. **Banco de dados não existe ou não está acessível**
   - Verifique se o SQL Server está rodando
   - Verifique se a connection string está correta em `appsettings.json`
   - Tente criar o banco manualmente primeiro

2. **Problemas com migrations**
   - Se o banco já existe mas as migrations não foram aplicadas, pode haver conflito
   - Solução: Delete o banco e deixe a aplicação criar novamente, ou execute:
     ```bash
     dotnet ef database drop --project ../RaizesStore.Infrastructure --startup-project .
     dotnet ef database update --project ../RaizesStore.Infrastructure --startup-project .
     ```

3. **Permissões insuficientes**
   - Certifique-se de que o usuário do Windows tem permissão para criar bancos de dados
   - Ou use um usuário SQL Server com permissões adequadas

### Como debugar:

1. **Verifique os logs**
   - Os logs agora mostram informações detalhadas sobre o processo de migration
   - Procure por mensagens de erro específicas

2. **Teste a conexão manualmente**
   ```bash
   sqlcmd -S localhost -E
   ```
   Se conseguir conectar, o problema não é de conexão.

3. **Verifique se o banco existe**
   ```sql
   SELECT name FROM sys.databases WHERE name = 'RaizesStore';
   ```

4. **Execute as migrations manualmente**
   ```bash
   cd RaizesStore.Api
   dotnet ef database update --project ../RaizesStore.Infrastructure --startup-project . --verbose
   ```
   O flag `--verbose` mostra informações detalhadas sobre o processo.

### Solução rápida:

Se nada funcionar, tente criar o banco manualmente e depois executar a aplicação:

```sql
CREATE DATABASE RaizesStore;
GO
```

Depois execute a aplicação normalmente.

## Erro de compilação relacionado a ValueComparer

Se você receber erros de compilação relacionados ao `ValueComparer`, certifique-se de que:

1. O namespace `Microsoft.EntityFrameworkCore.ChangeTracking` está importado
2. O código está usando `HashCode.Combine` corretamente
3. As versões dos pacotes NuGet estão atualizadas

## Verificar se tudo está funcionando

Após corrigir os problemas, você deve ver no console:

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

E a aplicação deve iniciar normalmente sem crashes.
