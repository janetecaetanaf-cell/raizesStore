using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaizesStore.Domain.Entities;
using RaizesStore.Infrastructure.Data;

namespace RaizesStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProdutosController : ControllerBase
{
    private readonly RaizesStoreDbContext _context;

    public ProdutosController(RaizesStoreDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Produto>>> GetProdutos([FromQuery] Guid? categoriaId, [FromQuery] TipoProduto? tipoProduto)
    {
        var query = _context.Produtos
            .Include(p => p.Categoria)
            .Where(p => p.Ativo && p.DeletedAt == null);

        if (categoriaId.HasValue)
        {
            query = query.Where(p => p.CategoriaId == categoriaId.Value);
        }

        if (tipoProduto.HasValue)
        {
            query = query.Where(p => p.TipoProduto == tipoProduto.Value);
        }

        return await query.OrderBy(p => p.Nome).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Produto>> GetProduto(Guid id)
    {
        var produto = await _context.Produtos
            .Include(p => p.Categoria)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (produto == null || produto.DeletedAt != null)
        {
            return NotFound();
        }

        return produto;
    }

    [HttpPost]
    public async Task<ActionResult<Produto>> CreateProduto(CreateProdutoDto dto)
    {
        var categoria = await _context.Categorias.FindAsync(dto.CategoriaId);
        if (categoria == null)
        {
            return BadRequest("Categoria não encontrada");
        }

        var produto = new Produto(dto.Nome, dto.Descricao, dto.Preco, dto.CategoriaId, dto.TipoProduto, dto.Ativo);
        produto.AtualizarEstoque(dto.Estoque);

        foreach (var tamanho in dto.TamanhosDisponiveis ?? new List<TamanhoProduto>())
        {
            produto.AdicionarTamanho(tamanho);
        }

        foreach (var cor in dto.CoresDisponiveis ?? new List<CorProduto>())
        {
            produto.AdicionarCor(cor);
        }

        foreach (var imagem in dto.Imagens ?? new List<string>())
        {
            produto.AdicionarImagem(imagem);
        }

        _context.Produtos.Add(produto);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProduto), new { id = produto.Id }, produto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduto(Guid id, UpdateProdutoDto dto)
    {
        var produto = await _context.Produtos.FindAsync(id);
        if (produto == null || produto.DeletedAt != null)
        {
            return NotFound();
        }

        produto.Atualizar(dto.Nome, dto.Descricao, dto.Preco, dto.CategoriaId, dto.Ativo, dto.Estoque);

        // Atualizar tamanhos
        produto.TamanhosDisponiveis.Clear();
        foreach (var tamanho in dto.TamanhosDisponiveis ?? new List<TamanhoProduto>())
        {
            produto.AdicionarTamanho(tamanho);
        }

        // Atualizar cores
        produto.CoresDisponiveis.Clear();
        foreach (var cor in dto.CoresDisponiveis ?? new List<CorProduto>())
        {
            produto.AdicionarCor(cor);
        }

        // Atualizar imagens
        produto.Imagens.Clear();
        foreach (var imagem in dto.Imagens ?? new List<string>())
        {
            produto.AdicionarImagem(imagem);
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduto(Guid id)
    {
        var produto = await _context.Produtos.FindAsync(id);
        if (produto == null || produto.DeletedAt != null)
        {
            return NotFound();
        }

        produto.Delete();
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateProdutoDto
{
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public decimal Preco { get; set; }
    public Guid CategoriaId { get; set; }
    public TipoProduto TipoProduto { get; set; }
    public bool Ativo { get; set; } = true;
    public int Estoque { get; set; }
    public List<TamanhoProduto>? TamanhosDisponiveis { get; set; }
    public List<CorProduto>? CoresDisponiveis { get; set; }
    public List<string>? Imagens { get; set; }
}

public class UpdateProdutoDto
{
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public decimal Preco { get; set; }
    public Guid CategoriaId { get; set; }
    public bool Ativo { get; set; }
    public int Estoque { get; set; }
    public List<TamanhoProduto>? TamanhosDisponiveis { get; set; }
    public List<CorProduto>? CoresDisponiveis { get; set; }
    public List<string>? Imagens { get; set; }
}
