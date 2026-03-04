# Script para limpar e rebuild completo do projeto

Write-Host "Limpando pastas bin e obj..." -ForegroundColor Yellow

# Remover pastas bin e obj
$folders = @(
    "RaizesStore.Api\bin",
    "RaizesStore.Api\obj",
    "RaizesStore.Infrastructure\bin",
    "RaizesStore.Infrastructure\obj",
    "RaizesStore.Domain\bin",
    "RaizesStore.Domain\obj"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Remove-Item -Recurse -Force $folder
        Write-Host "Removido: $folder" -ForegroundColor Green
    }
}

Write-Host "`nRestaurando pacotes NuGet..." -ForegroundColor Yellow
dotnet restore

Write-Host "`nCompilando projeto..." -ForegroundColor Yellow
dotnet build

Write-Host "`nConcluído! Agora execute: cd RaizesStore.Api && dotnet run" -ForegroundColor Green
