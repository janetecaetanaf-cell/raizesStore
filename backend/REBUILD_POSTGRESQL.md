# Rebuild Completo para PostgreSQL

O projeto ainda tinha referências ao SQL Server. Agora você precisa fazer um rebuild completo:

## Passos:

1. **Pare a aplicação** (Ctrl+C se estiver rodando)

2. **Limpe todos os arquivos de build:**
   ```bash
   cd D:\raizes-store\backend
   dotnet clean
   ```

3. **Remova as pastas bin e obj manualmente** (se necessário):
   ```powershell
   Remove-Item -Recurse -Force RaizesStore.Api\bin, RaizesStore.Api\obj
   Remove-Item -Recurse -Force RaizesStore.Infrastructure\bin, RaizesStore.Infrastructure\obj
   Remove-Item -Recurse -Force RaizesStore.Domain\bin, RaizesStore.Domain\obj
   ```

4. **Restaure os pacotes:**
   ```bash
   dotnet restore
   ```

5. **Compile novamente:**
   ```bash
   dotnet build
   ```

6. **Execute:**
   ```bash
   cd RaizesStore.Api
   dotnet run
   ```

Agora deve conectar ao PostgreSQL corretamente!

## Verificar se está usando PostgreSQL:

No console, você deve ver mensagens sobre PostgreSQL, não SQL Server. Se ainda aparecer erro de SQL Server, significa que há cache. Nesse caso:

1. Feche todos os terminais
2. Feche o Visual Studio/IDE se estiver aberto
3. Execute os passos acima novamente
