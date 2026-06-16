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

        var novaCategoria = new Categoria(dto.Nome, dto.Descricao ?? string.Empty, dto.Ativo);
        if (dto.Ordem > 0)
        {
            novaCategoria.DefinirOrdem(dto.Ordem);
        }
        
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

        categoriaExistente.Atualizar(dto.Nome, dto.Descricao ?? string.Empty, dto.Ativo);
        
        // Atualizar ordem se fornecida
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

        categoria.Delete();
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateCategoriaDto
{
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public bool Ativo { get; set; } = true;
    public int Ordem { get; set; }
}

public class UpdateCategoriaDto
{
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public bool Ativo { get; set; }
    public int Ordem { get; set; }
}
