using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RaizesStore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CategoriaPaiId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CategoriaPaiId",
                table: "Categorias",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Categorias_CategoriaPaiId",
                table: "Categorias",
                column: "CategoriaPaiId");

            migrationBuilder.AddForeignKey(
                name: "FK_Categorias_Categorias_CategoriaPaiId",
                table: "Categorias",
                column: "CategoriaPaiId",
                principalTable: "Categorias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Categorias_Categorias_CategoriaPaiId",
                table: "Categorias");

            migrationBuilder.DropIndex(
                name: "IX_Categorias_CategoriaPaiId",
                table: "Categorias");

            migrationBuilder.DropColumn(
                name: "CategoriaPaiId",
                table: "Categorias");
        }
    }
}
