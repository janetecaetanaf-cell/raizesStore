using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using RaizesStore.Domain.Entities;

namespace RaizesStore.Infrastructure.Data;

public class RaizesStoreDbContext : DbContext
{
    public RaizesStoreDbContext(DbContextOptions<RaizesStoreDbContext> options) : base(options)
    {
    }

    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<EnderecoCliente> EnderecosClientes => Set<EnderecoCliente>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<ItemPedido> ItensPedido => Set<ItemPedido>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Categoria
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.ToTable("Categorias");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Descricao).HasMaxLength(1000);
            entity.Property(e => e.Ativo).HasDefaultValue(true);
            entity.HasIndex(e => e.Nome);
        });

        // Produto
        modelBuilder.Entity<Produto>(entity =>
        {
            entity.ToTable("Produtos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.Preco).HasColumnType("numeric(18,2)").IsRequired();
            entity.Property(e => e.TipoProduto).HasConversion<int>();
            entity.Property(e => e.Ativo).HasDefaultValue(true);
            entity.Property(e => e.Estoque).HasDefaultValue(0);
            
            // Converter listas para JSON ou string separada por vírgula
            var tamanhosComparer = new ValueComparer<List<TamanhoProduto>>(
                (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
                c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                c => c.ToList());

            var coresComparer = new ValueComparer<List<CorProduto>>(
                (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
                c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                c => c.ToList());

            var imagensComparer = new ValueComparer<List<string>>(
                (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
                c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v != null ? v.GetHashCode() : 0)),
                c => c.ToList());

            var tamanhosProperty = entity.Property(e => e.TamanhosDisponiveis)
                .HasConversion(
                    v => string.Join(",", v.Select(e => ((int)e).ToString())),
                    v => v != null && !string.IsNullOrEmpty(v)
                        ? v.Split(",", StringSplitOptions.RemoveEmptyEntries)
                            .Select(e => (TamanhoProduto)int.Parse(e))
                            .ToList()
                        : new List<TamanhoProduto>())
                .HasColumnType("text");
            tamanhosProperty.Metadata.SetValueComparer(tamanhosComparer);

            var coresProperty = entity.Property(e => e.CoresDisponiveis)
                .HasConversion(
                    v => string.Join(",", v.Select(e => ((int)e).ToString())),
                    v => v != null && !string.IsNullOrEmpty(v)
                        ? v.Split(",", StringSplitOptions.RemoveEmptyEntries)
                            .Select(e => (CorProduto)int.Parse(e))
                            .ToList()
                        : new List<CorProduto>())
                .HasColumnType("text");
            coresProperty.Metadata.SetValueComparer(coresComparer);

            var imagensProperty = entity.Property(e => e.Imagens)
                .HasConversion(
                    v => SerializarListaImagens(v),
                    v => DesserializarListaImagens(v))
                .HasColumnType("text");
            imagensProperty.Metadata.SetValueComparer(imagensComparer);

            var imagensPorCorComparer = new ValueComparer<Dictionary<CorProduto, string>>(
                (c1, c2) => c1 != null && c2 != null && c1.Count == c2.Count && !c1.Except(c2).Any(),
                c => c.Aggregate(0, (a, kv) => HashCode.Combine(a, kv.Key.GetHashCode(), kv.Value != null ? kv.Value.GetHashCode() : 0)),
                c => c.ToDictionary(kv => kv.Key, kv => kv.Value));

            var imagensPorCorProperty = entity.Property(e => e.ImagensPorCor)
                .HasConversion(
                    v => SerializarImagensPorCor(v),
                    v => DesserializarImagensPorCor(v))
                .HasColumnType("text");
            imagensPorCorProperty.Metadata.SetValueComparer(imagensPorCorComparer);

            entity.HasOne(e => e.Categoria)
                .WithMany()
                .HasForeignKey(e => e.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Nome);
            entity.HasIndex(e => e.CategoriaId);
        });

        // Cliente
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.ToTable("Clientes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.Property(e => e.TelefoneCelular).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Cpf).HasMaxLength(14);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Cpf);
        });

        // EnderecoCliente
        modelBuilder.Entity<EnderecoCliente>(entity =>
        {
            entity.ToTable("EnderecosClientes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Cep).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Logradouro).IsRequired().HasMaxLength(300);
            entity.Property(e => e.Numero).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Bairro).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Cidade).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Estado).IsRequired().HasMaxLength(2);
            entity.Property(e => e.Complemento).HasMaxLength(200);
            entity.Property(e => e.Principal).HasDefaultValue(false);
            entity.HasIndex(e => e.ClienteId);
        });

        // Pedido
        modelBuilder.Entity<Pedido>(entity =>
        {
            entity.ToTable("Pedidos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NumeroPedido).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.ValorTotal).HasColumnType("numeric(18,2)").IsRequired();
            entity.Property(e => e.CodigoPix).HasMaxLength(500);
            entity.Property(e => e.QrCodePix).HasColumnType("text");
            entity.Property(e => e.CodigoRastreamento).HasMaxLength(100);
            entity.Property(e => e.PagSeguroCheckoutCode).HasMaxLength(100);
            entity.Property(e => e.PagSeguroTransactionCode).HasMaxLength(100);

            entity.HasOne(e => e.Cliente)
                .WithMany()
                .HasForeignKey(e => e.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.EnderecoEntrega)
                .WithMany()
                .HasForeignKey(e => e.EnderecoEntregaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Itens)
                .WithOne()
                .HasForeignKey(i => i.PedidoId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.NumeroPedido).IsUnique();
            entity.HasIndex(e => e.ClienteId);
            entity.HasIndex(e => e.Status);
        });

        // ItemPedido
        modelBuilder.Entity<ItemPedido>(entity =>
        {
            entity.ToTable("ItensPedido");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Tamanho).HasConversion<int>();
            entity.Property(e => e.Cor).HasConversion<int>();
            entity.Property(e => e.PrecoUnitario).HasColumnType("numeric(18,2)").IsRequired();
            entity.Property(e => e.ValorTotal).HasColumnType("numeric(18,2)").IsRequired();

            entity.HasOne(e => e.Produto)
                .WithMany()
                .HasForeignKey(e => e.ProdutoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PedidoId);
            entity.HasIndex(e => e.ProdutoId);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries().Where(e => e.Entity is Entity))
        {
            var entity = entry.Entity as Entity;
            if (entity is not null && entry.State == EntityState.Modified)
            {
                entity.SetUpdateAt();
            }

            if (entity is not null && entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entity.Delete();
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    private static string SerializarListaImagens(List<string> value)
    {
        return JsonSerializer.Serialize(value ?? new List<string>());
    }

    private static List<string> DesserializarListaImagens(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return new List<string>();

        var trimmed = value.Trim();
        if (trimmed.StartsWith("[", StringComparison.Ordinal))
        {
            return JsonSerializer.Deserialize<List<string>>(trimmed) ?? new List<string>();
        }

        return trimmed.Split('|', StringSplitOptions.RemoveEmptyEntries).ToList();
    }

    private static string SerializarImagensPorCor(Dictionary<CorProduto, string> value)
    {
        var dict = (value ?? new Dictionary<CorProduto, string>())
            .ToDictionary(kv => ((int)kv.Key).ToString(), kv => kv.Value);
        return JsonSerializer.Serialize(dict);
    }

    private static Dictionary<CorProduto, string> DesserializarImagensPorCor(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return new Dictionary<CorProduto, string>();

        var trimmed = value.Trim();

        if (trimmed.StartsWith("{", StringComparison.Ordinal))
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(trimmed)
                ?? new Dictionary<string, string>();
            var result = new Dictionary<CorProduto, string>();
            foreach (var kv in dict)
            {
                if (int.TryParse(kv.Key, out var corInt) && !string.IsNullOrWhiteSpace(kv.Value))
                    result[(CorProduto)corInt] = kv.Value;
            }
            return result;
        }

        var legado = new Dictionary<CorProduto, string>();
        foreach (var part in trimmed.Split('|', StringSplitOptions.RemoveEmptyEntries))
        {
            var sep = part.IndexOf(':');
            if (sep <= 0) continue;
            if (!int.TryParse(part.Substring(0, sep), out var corInt)) continue;
            var url = part.Substring(sep + 1);
            if (!string.IsNullOrWhiteSpace(url))
                legado[(CorProduto)corInt] = url;
        }

        return legado;
    }
}
