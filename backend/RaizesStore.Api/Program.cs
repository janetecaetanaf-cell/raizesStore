using Microsoft.EntityFrameworkCore;
using RaizesStore.Infrastructure.Data;

// Configurar tratamento global de exceções não tratadas
AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
{
    try
    {
        Console.WriteLine("=== EXCEÇÃO NÃO TRATADA ===");
        Console.WriteLine($"Tipo: {e.ExceptionObject?.GetType().FullName ?? "null"}");
        if (e.ExceptionObject is Exception ex)
        {
            Console.WriteLine($"Mensagem: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
        }
        else
        {
            Console.WriteLine($"Objeto: {e.ExceptionObject}");
        }
        Console.WriteLine("===========================");
    }
    catch (Exception logEx)
    {
        Console.WriteLine($"ERRO ao logar exceção: {logEx.Message}");
    }
};

try
{
    Console.WriteLine("=== INICIANDO APLICAÇÃO ===");
    Console.WriteLine($"DATABASE_URL presente: {!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL"))}");
    Console.WriteLine($"PORT presente: {!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PORT"))}");
    
    var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 20 * 1024 * 1024;
});

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 20 * 1024 * 1024;
});

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<RaizesStore.Api.Options.PagSeguroOptions>(
    builder.Configuration.GetSection(RaizesStore.Api.Options.PagSeguroOptions.SectionName));

builder.Services.PostConfigure<RaizesStore.Api.Options.PagSeguroOptions>(options =>
{
    options.Email = options.Email.Trim();
    options.Token = options.Token.Trim();
    options.PublicKey = options.PublicKey.Trim();

    var email = Environment.GetEnvironmentVariable("PAGSEGURO_EMAIL");
    if (!string.IsNullOrWhiteSpace(email))
    {
        options.Email = email.Trim();
    }

    var token = Environment.GetEnvironmentVariable("PAGSEGURO_TOKEN");
    if (!string.IsNullOrWhiteSpace(token))
    {
        options.Token = token.Trim();
    }

    var publicKey = Environment.GetEnvironmentVariable("PAGSEGURO_PUBLIC_KEY");
    if (!string.IsNullOrWhiteSpace(publicKey))
    {
        options.PublicKey = publicKey.Trim();
    }

    var sandbox = Environment.GetEnvironmentVariable("PAGSEGURO_SANDBOX");
    if (!string.IsNullOrWhiteSpace(sandbox) && bool.TryParse(sandbox, out var isSandbox))
    {
        options.Sandbox = isSandbox;
    }

    var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
    if (!string.IsNullOrWhiteSpace(frontendUrl))
    {
        options.FrontendUrl = frontendUrl;
    }

    var notificationUrl = Environment.GetEnvironmentVariable("PAGSEGURO_NOTIFICATION_URL");
    if (!string.IsNullOrWhiteSpace(notificationUrl))
    {
        options.NotificationUrl = notificationUrl;
    }
});

builder.Services.AddHttpClient<RaizesStore.Api.Services.IPagSeguroService, RaizesStore.Api.Services.PagSeguroService>();

    // Database - PostgreSQL
    // Tenta pegar do DATABASE_URL (Railway/Render) ou da ConnectionString
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    string connectionString;

    if (!string.IsNullOrEmpty(databaseUrl))
    {
        Console.WriteLine("Usando DATABASE_URL do ambiente");
        try
        {
            // Converte DATABASE_URL (postgresql://user:pass@host:port/db) para connection string Npgsql
            var uri = new Uri(databaseUrl);
            var dbName = uri.LocalPath.TrimStart('/');
            var userInfo = uri.UserInfo.Split(':', 2);
            var username = Uri.UnescapeDataString(userInfo[0]);
            var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
            var dbPort = uri.Port > 0 ? uri.Port : 5432;
            connectionString = $"Host={uri.Host};Port={dbPort};Database={dbName};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
            Console.WriteLine($"Conectando ao banco: {uri.Host}:{dbPort}/{dbName}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERRO ao processar DATABASE_URL: {ex.Message}");
            connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                ?? "Host=localhost;Database=RaizesStore;Username=postgres;Password=postgres";
        }
    }
    else
    {
        Console.WriteLine("Usando ConnectionString do appsettings.json");
        connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
            ?? "Host=localhost;Database=RaizesStore;Username=postgres;Password=postgres";
    }

    builder.Services.AddDbContext<RaizesStoreDbContext>(options =>
        options.UseNpgsql(connectionString));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Swagger (habilitado para facilitar testes locais)
app.UseSwagger();
app.UseSwaggerUI();

// Middleware de tratamento de exceções
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        
        if (exception != null)
        {
            logger.LogError(exception, "Erro não tratado: {Message}", exception.Message);
        }
        
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var errorMessage = exception != null 
            ? $"{{\"error\":\"Ocorreu um erro interno do servidor\",\"message\":\"{exception.Message}\"}}"
            : "{\"error\":\"Ocorreu um erro interno do servidor\"}";
        await context.Response.WriteAsync(errorMessage);
    });
});

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Rotas básicas (para não dar 404 na raiz)
app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

    // Apply migrations
    try
    {
        Console.WriteLine("Verificando conexão com banco de dados...");
        using (var scope = app.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<RaizesStoreDbContext>();
            var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
            var logger = loggerFactory.CreateLogger("Program");
            
            logger.LogInformation("Verificando migrations do banco de dados...");
            
            // Tentar conectar
            var connected = false;
            try
            {
                connected = dbContext.Database.CanConnect();
                if (connected)
                {
                    logger.LogInformation("Conexão com o banco de dados estabelecida com sucesso.");
                }
            }
            catch (Exception connectEx)
            {
                logger.LogWarning($"Não foi possível conectar ao banco de dados: {connectEx.Message}");
            }
            
            if (connected)
            {
                if (dbContext.Database.GetPendingMigrations().Any())
                {
                    logger.LogInformation("Aplicando migrations pendentes...");
                    dbContext.Database.Migrate();
                    logger.LogInformation("Migrations aplicadas com sucesso!");
                }
                else
                {
                    logger.LogInformation("Banco de dados está atualizado.");
                }

                await DbSeeder.SeedAsync(dbContext);
                logger.LogInformation("Seed de dados verificado.");
            }
            else
            {
                logger.LogWarning("Não foi possível conectar ao banco de dados após várias tentativas. A aplicação continuará sem banco.");
            }
        }
    }
    catch (Exception ex)
    {
        var loggerFactory = app.Services.GetRequiredService<ILoggerFactory>();
        var logger = loggerFactory.CreateLogger("Program");
        logger.LogError(ex, "Erro ao aplicar migrations do banco de dados: {Message}", ex.Message);
        logger.LogError("Stack trace: {StackTrace}", ex.StackTrace);
        Console.WriteLine($"ERRO ao aplicar migrations: {ex.Message}");
        // Não interrompe a execução da aplicação, apenas loga o erro
    }

    // Configurar porta para produção (Railway/Render)
    var port = Environment.GetEnvironmentVariable("PORT");
    if (!string.IsNullOrEmpty(port))
    {
        Console.WriteLine($"Configurando porta: {port}");
        app.Urls.Clear();
        app.Urls.Add($"http://0.0.0.0:{port}");
    }
    else
    {
        Console.WriteLine("Porta não configurada, usando padrão");
    }

    Console.WriteLine("=== APLICAÇÃO INICIADA COM SUCESSO ===");
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"=== ERRO FATAL AO INICIAR APLICAÇÃO ===");
    Console.WriteLine($"Tipo: {ex.GetType().FullName}");
    Console.WriteLine($"Mensagem: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
    }
    Console.WriteLine("=======================================");
    throw; // Re-lança para que o Railway veja o erro
}
