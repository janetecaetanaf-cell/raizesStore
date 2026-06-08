using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using RaizesStore.Domain.Entities;
using RaizesStore.Infrastructure.Data;

namespace RaizesStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CheckoutController : ControllerBase
{
    private readonly RaizesStoreDbContext _context;
    private readonly ILogger<CheckoutController> _logger;

    public CheckoutController(
        RaizesStoreDbContext context,
        ILogger<CheckoutController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("finalizar")]
    public async Task<IActionResult> Finalizar(FinalizarCheckoutDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { message = "E-mail é obrigatório" });
        if (string.IsNullOrWhiteSpace(dto.Nome))
            return BadRequest(new { message = "Nome é obrigatório" });
        if (string.IsNullOrWhiteSpace(dto.TelefoneCelular))
            return BadRequest(new { message = "Telefone é obrigatório" });
        if (dto.DataNascimento == default)
            return BadRequest(new { message = "Data de nascimento é obrigatória" });
        if (dto.Itens == null || dto.Itens.Count == 0)
            return BadRequest(new { message = "O pedido deve conter pelo menos um item" });
        if (string.IsNullOrWhiteSpace(dto.Cep) || string.IsNullOrWhiteSpace(dto.Logradouro)
            || string.IsNullOrWhiteSpace(dto.Numero) || string.IsNullOrWhiteSpace(dto.Bairro)
            || string.IsNullOrWhiteSpace(dto.Cidade) || string.IsNullOrWhiteSpace(dto.Estado))
            return BadRequest(new { message = "Preencha todos os campos do endereço" });

        var produtoIds = dto.Itens.Select(i => i.ProdutoId).Distinct().ToList();
        var produtos = await _context.Produtos
            .AsNoTracking()
            .Where(p => produtoIds.Contains(p.Id) && p.DeletedAt == null && p.Ativo)
            .ToListAsync();

        foreach (var grupo in dto.Itens.GroupBy(i => i.ProdutoId))
        {
            var produto = produtos.FirstOrDefault(p => p.Id == grupo.Key);
            if (produto == null)
                return BadRequest(new { message = $"Produto não encontrado ou inativo" });

            var qtd = grupo.Sum(i => i.Quantidade);
            if (!produto.TemEstoque(qtd))
                return BadRequest(new { message = $"Produto {produto.Nome} sem estoque suficiente" });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var email = dto.Email.Trim().ToLower();
            var cpf = string.IsNullOrWhiteSpace(dto.Cpf) ? null : dto.Cpf.Trim();

            var clienteId = await _context.Clientes
                .AsNoTracking()
                .Where(c => c.Email.ToLower() == email && c.DeletedAt == null)
                .Select(c => (Guid?)c.Id)
                .FirstOrDefaultAsync();

            if (clienteId.HasValue)
            {
                var atualizados = await _context.Clientes
                    .Where(c => c.Id == clienteId.Value && c.DeletedAt == null)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(c => c.Nome, dto.Nome.Trim())
                        .SetProperty(c => c.Email, dto.Email.Trim())
                        .SetProperty(c => c.TelefoneCelular, dto.TelefoneCelular.Trim())
                        .SetProperty(c => c.DataNascimento, dto.DataNascimento)
                        .SetProperty(c => c.Cpf, cpf)
                        .SetProperty(c => c.UpdatedAt, DateTimeOffset.UtcNow));

                if (atualizados == 0)
                    return BadRequest(new { message = "Cliente não encontrado para atualização" });
            }
            else
            {
                var cliente = new Cliente(
                    dto.Nome.Trim(),
                    dto.Email.Trim(),
                    dto.TelefoneCelular.Trim(),
                    dto.DataNascimento,
                    cpf);
                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();
                clienteId = cliente.Id;
            }

            var temEndereco = await _context.EnderecosClientes
                .AnyAsync(e => e.ClienteId == clienteId.Value && e.DeletedAt == null);

            var endereco = new EnderecoCliente(
                clienteId.Value,
                dto.Cep.Trim(),
                dto.Logradouro.Trim(),
                dto.Numero.Trim(),
                dto.Bairro.Trim(),
                dto.Cidade.Trim(),
                dto.Estado.Trim().ToUpper(),
                string.IsNullOrWhiteSpace(dto.Complemento) ? null : dto.Complemento.Trim(),
                !temEndereco);

            _context.EnderecosClientes.Add(endereco);
            await _context.SaveChangesAsync();

            foreach (var grupo in dto.Itens.GroupBy(i => i.ProdutoId))
            {
                var qtd = grupo.Sum(i => i.Quantidade);
                var linhas = await _context.Produtos
                    .Where(p => p.Id == grupo.Key && p.DeletedAt == null && p.Estoque >= qtd)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(p => p.Estoque, p => p.Estoque - qtd)
                        .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));

                if (linhas == 0)
                {
                    await transaction.RollbackAsync();
                    var nome = produtos.First(p => p.Id == grupo.Key).Nome;
                    return BadRequest(new { message = $"Produto {nome} sem estoque suficiente" });
                }
            }

            var pedido = new Pedido(clienteId.Value, endereco.Id);
            foreach (var item in dto.Itens)
            {
                var produto = produtos.First(p => p.Id == item.ProdutoId);
                pedido.AdicionarItem(
                    produto.Id,
                    produto.Nome,
                    item.Quantidade,
                    item.Tamanho,
                    item.Cor,
                    produto.Preco);
            }

            _context.ChangeTracker.Clear();
            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                pedidoId = pedido.Id,
                numeroPedido = pedido.NumeroPedido,
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Erro ao finalizar checkout");
            return BadRequest(new { message = $"Erro ao finalizar compra: {ex.Message}" });
        }
    }
}

public class FinalizarCheckoutDto
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TelefoneCelular { get; set; } = string.Empty;
    public DateTime DataNascimento { get; set; }
    public string? Cpf { get; set; }
    public string Cep { get; set; } = string.Empty;
    public string Logradouro { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string Bairro { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string? Complemento { get; set; }
    public List<ItemCheckoutDto> Itens { get; set; } = new();
}

public class ItemCheckoutDto
{
    public Guid ProdutoId { get; set; }
    public int Quantidade { get; set; }
    public TamanhoProduto? Tamanho { get; set; }
    public CorProduto? Cor { get; set; }
}
