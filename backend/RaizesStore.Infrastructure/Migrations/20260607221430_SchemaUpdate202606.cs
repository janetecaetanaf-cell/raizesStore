using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RaizesStore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SchemaUpdate202606 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Produtos" ADD COLUMN IF NOT EXISTS "ImagensPorCor" text NOT NULL DEFAULT '';
                ALTER TABLE "Pedidos" ADD COLUMN IF NOT EXISTS "PagSeguroCheckoutCode" character varying(100);
                ALTER TABLE "Pedidos" ADD COLUMN IF NOT EXISTS "PagSeguroTransactionCode" character varying(100);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagensPorCor",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "PagSeguroCheckoutCode",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "PagSeguroTransactionCode",
                table: "Pedidos");
        }
    }
}
