FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src

COPY RaizesStore.Api/RaizesStore.Api.csproj RaizesStore.Api/
COPY RaizesStore.Domain/RaizesStore.Domain.csproj RaizesStore.Domain/
COPY RaizesStore.Infrastructure/RaizesStore.Infrastructure.csproj RaizesStore.Infrastructure/

RUN dotnet restore RaizesStore.Api/RaizesStore.Api.csproj

COPY . .
RUN dotnet publish RaizesStore.Api/RaizesStore.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS final
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "RaizesStore.Api.dll"]
