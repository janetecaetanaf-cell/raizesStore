# Como Parar a Aplicação

## Solução Rápida

1. **No terminal onde a aplicação está rodando:**
   - Pressione `Ctrl + C` para parar a aplicação
   - Aguarde alguns segundos para o processo finalizar completamente

2. **Se não funcionar, feche o terminal completamente**

3. **Se ainda estiver bloqueado, use o PowerShell para matar o processo:**
   ```powershell
   Stop-Process -Id 19588 -Force
   ```
   (Substitua 19588 pelo PID correto se necessário)

## Verificar se o processo ainda está rodando

```powershell
Get-Process | Where-Object {$_.ProcessName -like "*RaizesStore*"}
```

## Matar todos os processos relacionados

```powershell
Get-Process | Where-Object {$_.ProcessName -like "*RaizesStore*"} | Stop-Process -Force
```

Ou mais específico:

```powershell
Get-Process | Where-Object {$_.Path -like "*raizes-store*"} | Stop-Process -Force
```

## Depois de parar, compile novamente

```bash
cd D:\raizes-store\backend\RaizesStore.Api
dotnet build
dotnet run
```
