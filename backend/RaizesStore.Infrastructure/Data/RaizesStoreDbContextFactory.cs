using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace RaizesStore.Infrastructure.Data;

public class RaizesStoreDbContextFactory : IDesignTimeDbContextFactory<RaizesStoreDbContext>
{
    public RaizesStoreDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<RaizesStoreDbContext>();
        
        // PostgreSQL connection string para design-time (migrations)
        var connectionString = "Host=localhost;Database=RaizesStore;Username=postgres;Password=postgres";
        optionsBuilder.UseNpgsql(connectionString);

        return new RaizesStoreDbContext(optionsBuilder.Options);
    }
}
