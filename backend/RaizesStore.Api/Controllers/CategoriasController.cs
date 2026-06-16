using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaizesStore.Api.Filters;
using RaizesStore.Domain.Entities;
using RaizesStore.Infrastructure.Data;

namespace RaizesStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriasController : ControllerBase
{
    private readonly RaizesStoreDbContext _context;

    public CategoriasController(RaizesStoreDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Categoria>>> GetCategorias()
    {
        return await _context.Categorias
            .Where(c => c.DeletedAt == null)
            .OrderBy(c => c.Ordem)
            .ThenBy(c => c.Nome)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Categoria>> GetCategoria(Guid id)
    {
        var categoria = await _context.Categorias.FindAsync(id);

        if (categoria == null || categoria.DeletedAt != null)
        {
            return NotFound();
        }

        return categoria;
    }

    [HttpPost]
    [AdminAuthorize]
    public async Task<ActionResult<Categoria>> CreateCategoria(CreateCategoriaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nome))
        {
            return BadRequest("O nome da categoria é obrigatório");
        }

        var erroPai = await ValidarCategoriaPaiAsync(dto.CategoriaPaiId);
        if (erroPai != null)
        {
            return BadRequest(erroPai);
        }

        var novaCategoria = new Categoria(dto.Nome, dto.Descricao ?? string.Empty, dto.Ativo);
        if (dto.Ordem > 0)
        {
            novaCategoria.DefinirOrdem(dto.Ordem);
        }

        novaCategoria.DefinirCategoriaPai(dto.CategoriaPaiId);

        _context.Categorias.Add(novaCategoria);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCategoria), new { id = novaCategoria.Id }, novaCategoria);
    }

    [HttpPut("{id}")]
    [AdminAuthorize]
    public async Task<IActionResult> UpdateCategoria(Guid id, UpdateCategoriaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nome))
        {
            return BadRequest("O nome da categoria é obrigatório");
        }

        var categoriaExistente = await _context.Categorias.FindAsync(id);
        if (categoriaExistente == null || categoriaExistente.DeletedAt != null)
        {
            return NotFound();
        }

        if (dto.CategoriaPaiId == id)
        {
            return BadRequest("Uma categoria não pode ser pai de si mesma.");
        }

        var erroPai = await ValidarCategoriaPaiAsync(dto.CategoriaPaiId, id);
        if (erroPai != null)
        {
            return BadRequest(erroPai);
        }

        categoriaExistente.Atualizar(dto.Nome, dto.Descricao ?? string.Empty, dto.Ativo);
        categoriaExistente.DefinirCategoriaPai(dto.CategoriaPaiId);

        if (dto.Ordem != categoriaExistente.Ordem)
        {
            categoriaExistente.DefinirOrdem(dto.Ordem);
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    [AdminAuthorize]
    public async Task<IActionResult> DeleteCategoria(Guid id)
    {
        var categoria = await _context.Categorias.FindAsync(id);
        if (categoria == null || categoria.DeletedAt != null)
        {
            return NotFound();
        }

        var temSubcategorias = await _context.Categorias
            .AnyAsync(c => c.CategoriaPaiId == id && c.DeletedAt == null);
        if (temSubcategorias)
        {
            return BadRequest("Remova ou mova as subcategorias antes de excluir esta categoria.");
        }

        var temProdutos = await _context.Produtos
            .AnyAsync(p => p.CategoriaId == id && p.DeletedAt == null);
        if (temProdutos)
        {
            return BadRequest("Existem produtos nesta categoria. Mova-os antes de excluir.");
        }

        categoria.Delete();
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<string?> ValidarCategoriaPaiAsync(Guid? categoriaPaiId, Guid? categoriaAtualId = null)
    {
        if (!categoriaPaiId.HasValue)
        {
            return null;
        }

        var pai = await _context.Categorias
            .FirstOrDefaultAsync(c => c.Id == categoriaPaiId.Value && c.DeletedAt == null);
        if (pai == null)
        {
            return "Categoria pai não encontrada.";
        }

        if (pai.CategoriaPaiId.HasValue)
        {
            return "Use apenas categorias principais como pai (um nível de subcategoria).";
        }

        if (categoriaAtualId.HasValue)
        {
            var temFilhos = await _context.Categorias
                .AnyAsync(c => c.CategoriaPaiId == categoriaAtualId && c.DeletedAt == null);
            if (temFilhos && categoriaPaiId.HasValue)
            {
                return "Categorias com subcategorias não podem virar subcategoria.";
            }
        }

        return null;
    }
}

public class CreateCategoriaDto
{
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public bool Ativo { get; set; } = true;
    public int Ordem { get; set; }
    public Guid? CategoriaPaiId { get; set; }
}

public class UpdateCategoriaDto
{
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public bool Ativo { get; set; }
    public int Ordem { get; set; }
    public Guid? CategoriaPaiId { get; set; }
}
