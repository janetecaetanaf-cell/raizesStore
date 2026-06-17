using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RaizesStore.Api.Filters;
using RaizesStore.Api.Options;
using RaizesStore.Domain.Entities;
using RaizesStore.Infrastructure.Data;

namespace RaizesStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProdutosController : ControllerBase
{
    private readonly RaizesStoreDbContext _context;
    private readonly AdminOptions _adminOptions;

    public ProdutosController(RaizesStoreDbContext context, IOptions<AdminOptions> adminOptions)
    {
        _context = context;
        _adminOptions = adminOptions.Value;
    }

    [HttpGet]
    public async Task<IActionResult> GetProdutos(
        [FromQuery] Guid? categoriaId,
        [FromQuery] Guid? categoriaPaiId,
        [FromQuery] TipoProduto? tipoProduto,
        [FromQuery] bool incluirInativos = false,
        [FromQuery] bool recentes = false,
        [FromQuery] bool aleatorios = false,
        [FromQuery] bool somenteCapa = false,
        [FromQuery] int? limite = null)
    {
        if (incluirInativos && !_adminOptions.IsAdmin(Request.Headers["X-User-Email"].FirstOrDefault()))
        {
            return Unauthorized(new { message = "Acesso restrito ao administrador da loja." });
        }

        var query = _context.Produtos
            .Include(p => p.Categoria)
            .Where(p => p.DeletedAt == null);

        if (!incluirInativos)
        {
            query = query.Where(p => p.Ativo);
        }

        if (categoriaId.HasValue)
        {
            query = query.Where(p => p.CategoriaId == categoriaId.Value);
        }
        else if (categoriaPaiId.HasValue)
        {
            var subcategoriasIds = await _context.Categorias
                .Where(c => c.CategoriaPaiId == categoriaPaiId && c.DeletedAt == null)
                .Select(c => c.Id)
                .ToListAsync();

            query = query.Where(p => subcategoriasIds.Contains(p.CategoriaId));
        }

        if (tipoProduto.HasValue)
        {
            query = query.Where(p => p.TipoProduto == tipoProduto.Value);
        }

        if (aleatorios && limite.HasValue)
        {
            var pool = await query.ToListAsync();
            var destaques = SelecionarDestaquesAleatorios(pool, Math.Clamp(limite.Value, 1, 50));
            return Ok(somenteCapa ? destaques.Select(ProdutoResumoHelper.ParaListagem) : destaques);
        }

        query = recentes || limite.HasValue
            ? query.OrderByDescending(p => p.CreatedAt)
            : query.OrderBy(p => p.Nome);

        if (limite.HasValue)
        {
            query = query.Take(Math.Clamp(limite.Value, 1, 50));
        }

        var resultado = await query.ToListAsync();
        return Ok(somenteCapa ? resultado.Select(ProdutoResumoHelper.ParaListagem) : resultado);
    }

    private static List<Produto> SelecionarDestaquesAleatorios(IReadOnlyList<Produto> pool, int limite)
    {
        if (pool.Count <= limite)
        {
            return pool.OrderBy(_ => Random.Shared.Next()).ToList();
        }

        var selecionados = new List<Produto>();
        var usados = new HashSet<Guid>();

        void Tirar(IEnumerable<Produto> fonte, int quantidade)
        {
            foreach (var produto in fonte.OrderBy(_ => Random.Shared.Next()))
            {
                if (selecionados.Count >= limite || quantidade <= 0)
                {
                    break;
                }

                if (!usados.Add(produto.Id))
                {
                    continue;
                }

                selecionados.Add(produto);
                quantidade--;
            }
        }

        var camisetas = pool.Where(p => p.TipoProduto == TipoProduto.Camiseta).ToList();
        var canecas = pool.Where(p => p.TipoProduto == TipoProduto.Caneca).ToList();

        var metaCamiseta = Math.Min(camisetas.Count, Math.Max(1, limite / 2));
        var metaCaneca = Math.Min(canecas.Count, Math.Max(1, limite / 2));

        if (camisetas.Count == 0)
        {
            metaCamiseta = 0;
            metaCaneca = Math.Min(canecas.Count, limite);
        }
        else if (canecas.Count == 0)
        {
            metaCaneca = 0;
            metaCamiseta = Math.Min(camisetas.Count, limite);
        }

        while (metaCamiseta + metaCaneca > limite)
        {
            if (metaCamiseta >= metaCaneca && metaCamiseta > 0)
            {
                metaCamiseta--;
            }
            else if (metaCaneca > 0)
            {
                metaCaneca--;
            }
        }

        Tirar(camisetas, metaCamiseta);
        Tirar(canecas, metaCaneca);

        var restante = pool.Where(p => !usados.Contains(p.Id));
        Tirar(restante, limite - selecionados.Count);

        return selecionados.OrderBy(_ => Random.Shared.Next()).ToList();
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
    [AdminAuthorize]
    public async Task<ActionResult<Produto>> CreateProduto(CreateProdutoDto dto)
    {
        var categoria = await _context.Categorias.FindAsync(dto.CategoriaId);
        if (categoria == null)
        {
            return BadRequest("Categoria não encontrada");
        }

        var categoriaTemSubcategorias = await _context.Categorias
            .AnyAsync(c => c.CategoriaPaiId == dto.CategoriaId && c.DeletedAt == null);
        if (categoriaTemSubcategorias)
        {
            return BadRequest("Cadastre o produto em uma subcategoria (ex.: Kardecismo › Camisetas).");
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

        produto.LimparImagensPorCor();
        foreach (var item in dto.ImagensPorCor ?? new List<ImagemPorCorDto>())
        {
            if (!string.IsNullOrWhiteSpace(item.Url))
                produto.DefinirImagemCor(item.Cor, item.Url.Trim());
        }

        _context.Produtos.Add(produto);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProduto), new { id = produto.Id }, produto);
    }

    [HttpPut("{id}")]
    [AdminAuthorize]
    public async Task<IActionResult> UpdateProduto(Guid id, UpdateProdutoDto dto)
    {
        var produto = await _context.Produtos.FindAsync(id);
        if (produto == null || produto.DeletedAt != null)
        {
            return NotFound();
        }

        var categoria = await _context.Categorias.FindAsync(dto.CategoriaId);
        if (categoria == null)
        {
            return BadRequest("Categoria não encontrada");
        }

        var categoriaTemSubcategorias = await _context.Categorias
            .AnyAsync(c => c.CategoriaPaiId == dto.CategoriaId && c.DeletedAt == null);
        if (categoriaTemSubcategorias)
        {
            return BadRequest("Cadastre o produto em uma subcategoria (ex.: Kardecismo › Camisetas).");
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

        produto.LimparImagensPorCor();
        foreach (var item in dto.ImagensPorCor ?? new List<ImagemPorCorDto>())
        {
            if (!string.IsNullOrWhiteSpace(item.Url))
                produto.DefinirImagemCor(item.Cor, item.Url.Trim());
        }

        _context.Entry(produto).Property(p => p.Imagens).IsModified = true;
        _context.Entry(produto).Property(p => p.ImagensPorCor).IsModified = true;
        _context.Entry(produto).Property(p => p.TamanhosDisponiveis).IsModified = true;
        _context.Entry(produto).Property(p => p.CoresDisponiveis).IsModified = true;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    [AdminAuthorize]
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
    public List<ImagemPorCorDto>? ImagensPorCor { get; set; }
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
    public List<ImagemPorCorDto>? ImagensPorCor { get; set; }
}

public class ImagemPorCorDto
{
    public CorProduto Cor { get; set; }
    public string Url { get; set; } = string.Empty;
}

internal static class ProdutoResumoHelper
{
    public static object ParaListagem(Produto produto)
    {
        var capa = produto.Imagens
            .FirstOrDefault(i =>
                !string.IsNullOrWhiteSpace(i) &&
                !i.StartsWith("data:", StringComparison.OrdinalIgnoreCase));

        return new
        {
            produto.Id,
            produto.Nome,
            produto.Descricao,
            produto.Preco,
            produto.CategoriaId,
            produto.Categoria,
            produto.TipoProduto,
            produto.Ativo,
            produto.Estoque,
            produto.TamanhosDisponiveis,
            produto.CoresDisponiveis,
            Imagens = capa != null ? new List<string> { capa } : new List<string>(),
            ImagensPorCor = new Dictionary<CorProduto, string>(),
            produto.CreatedAt,
            produto.UpdatedAt,
        };
    }
}
