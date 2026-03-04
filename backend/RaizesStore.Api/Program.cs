using Microsoft.EntityFrameworkCore;
using RaizesStore.Infrastructure.Data;

// Configurar tratamento global de exceções não tratadas
AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
{
    Console.WriteLine($"Exceção não tratada: {e.ExceptionObject}");
    if (e.ExceptionObject is Exception ex)
    {
        Console.WriteLine($"Mensagem: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
    }
};

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database - PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Database=RaizesStore;Username=postgres;Password=postgres";

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
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<RaizesStoreDbContext>();
        var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
        var logger = loggerFactory.CreateLogger("Program");
        
        logger.LogInformation("Verificando migrations do banco de dados...");
        
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
        
        // Verificar se o banco pode ser acessado
        var canConnect = dbContext.Database.CanConnect();
        if (canConnect)
        {
            logger.LogInformation("Conexão com o banco de dados estabelecida com sucesso.");
        }
        else
        {
            logger.LogWarning("Não foi possível conectar ao banco de dados.");
        }
    }
}
catch (Exception ex)
{
    var loggerFactory = app.Services.GetRequiredService<ILoggerFactory>();
    var logger = loggerFactory.CreateLogger("Program");
    logger.LogError(ex, "Erro ao aplicar migrations do banco de dados: {Message}", ex.Message);
    logger.LogError("Stack trace: {StackTrace}", ex.StackTrace);
    // Não interrompe a execução da aplicação, apenas loga o erro
}

app.Run();
