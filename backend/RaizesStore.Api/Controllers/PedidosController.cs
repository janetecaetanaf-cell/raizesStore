using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using RaizesStore.Domain.Entities;
using RaizesStore.Infrastructure.Data;

namespace RaizesStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PedidosController : ControllerBase
{
    private readonly RaizesStoreDbContext _context;

    public PedidosController(RaizesStoreDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidos([FromQuery] StatusPedido? status)
    {
        var query = _context.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.EnderecoEntrega)
            .Include(p => p.Itens)
                .ThenInclude(i => i.Produto)
            .Where(p => p.DeletedAt == null);

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        return await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Pedido>> GetPedido(Guid id)
    {
        var pedido = await _context.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.EnderecoEntrega)
            .Include(p => p.Itens)
                .ThenInclude(i => i.Produto)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pedido == null || pedido.DeletedAt != null)
        {
            return NotFound();
        }

        return pedido;
    }

    [HttpPost]
    public async Task<ActionResult<Pedido>> CreatePedido(CreatePedidoDto dto)
    {
        if (dto.ClienteId == Guid.Empty)
        {
            return BadRequest("ClienteId é obrigatório");
        }
        if (dto.EnderecoEntregaId == Guid.Empty)
        {
            return BadRequest("EnderecoEntregaId é obrigatório");
        }
        if (dto.Itens == null || dto.Itens.Count == 0)
        {
            return BadRequest("O pedido deve conter pelo menos um item");
        }

        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c => c.Id == dto.ClienteId && c.DeletedAt == null);
        if (cliente == null)
        {
            return BadRequest("Cliente não encontrado");
        }

        var endereco = await _context.EnderecosClientes
            .FirstOrDefaultAsync(e => e.Id == dto.EnderecoEntregaId && e.DeletedAt == null);
        if (endereco == null)
        {
            return BadRequest("Endereço não encontrado");
        }

        // Carregar todos os produtos de uma vez
        var produtoIds = dto.Itens.Select(i => i.ProdutoId).Distinct().ToList();
        var produtos = await _context.Produtos
            .Where(p => produtoIds.Contains(p.Id) && p.DeletedAt == null)
            .ToListAsync();

        // Validar produtos e estoque antes de criar o pedido
        foreach (var itemDto in dto.Itens)
        {
            var produto = produtos.FirstOrDefault(p => p.Id == itemDto.ProdutoId);
            
            if (produto == null)
            {
                return BadRequest($"Produto {itemDto.ProdutoId} não encontrado");
            }

            if (!produto.TemEstoque(itemDto.Quantidade))
            {
                return BadRequest($"Produto {produto.Nome} não possui estoque suficiente. Disponível: {produto.Estoque}");
            }

            if (!produto.Ativo)
            {
                return BadRequest($"Produto {produto.Nome} está inativo");
            }
        }

        // Usar transação para garantir consistência
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Criar pedido após validações
            var pedido = new Pedido(dto.ClienteId, dto.EnderecoEntregaId);

            // Adicionar itens ao pedido
            foreach (var itemDto in dto.Itens)
            {
                var produto = produtos.FirstOrDefault(p => p.Id == itemDto.ProdutoId);
                
                if (produto != null)
                {
                    // Adicionar item ao pedido (valida estoque internamente)
                    pedido.AdicionarItem(produto, itemDto.Quantidade, itemDto.Tamanho, itemDto.Cor);
                }
            }
            
            // Atualizar estoque dos produtos após adicionar todos os itens
            foreach (var itemDto in dto.Itens)
            {
                var produto = produtos.FirstOrDefault(p => p.Id == itemDto.ProdutoId);
                if (produto != null)
                {
                    produto.AtualizarEstoque(produto.Estoque - itemDto.Quantidade);
                }
            }

            // Gerar código PIX (simulado - você deve integrar com um serviço real)
            var codigoPix = GerarCodigoPix(pedido.ValorTotal);
            var qrCodePix = GerarQrCodePix(codigoPix);
            pedido.DefinirDadosPix(codigoPix, qrCodePix);

            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Recarregar pedido com todas as relações
            var pedidoCompleto = await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.EnderecoEntrega)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .FirstOrDefaultAsync(p => p.Id == pedido.Id);

            return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, pedidoCompleto);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return BadRequest($"Erro ao criar pedido: {ex.Message}");
        }
    }

    [HttpPost("{id}/confirmar-pagamento")]
    public async Task<IActionResult> ConfirmarPagamento(Guid id)
    {
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null || pedido.DeletedAt != null)
        {
            return NotFound();
        }

        pedido.ConfirmarPagamento();
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/enviar")]
    public async Task<IActionResult> EnviarPedido(Guid id, EnviarPedidoDto dto)
    {
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null || pedido.DeletedAt != null)
        {
            return NotFound();
        }

        pedido.Enviar(dto.CodigoRastreamento);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/entregue")]
    public async Task<IActionResult> MarcarComoEntregue(Guid id)
    {
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null || pedido.DeletedAt != null)
        {
            return NotFound();
        }

        pedido.MarcarComoEntregue();
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private string GerarCodigoPix(decimal valor)
    {
        // Simulação - você deve integrar com um serviço real de PIX
        return $"00020126580014BR.GOV.BCB.PIX0136{Guid.NewGuid()}5204000053039865802BR5913RAIZES STORE6009SAO PAULO62070503***6304{new Random().Next(1000, 9999)}";
    }

    private string GerarQrCodePix(string codigoPix)
    {
        // Simulação - você deve gerar o QR Code real usando uma biblioteca
        return $"data:image/png;base64,QRCODE_BASE64_AQUI";
    }
}

public class CreatePedidoDto
{
    public Guid ClienteId { get; set; }
    public Guid EnderecoEntregaId { get; set; }
    public List<ItemPedidoDto> Itens { get; set; } = new();
}

public class ItemPedidoDto
{
    public Guid ProdutoId { get; set; }
    public int Quantidade { get; set; }
    public TamanhoProduto? Tamanho { get; set; }
    public CorProduto? Cor { get; set; }
}

// DTOs alternativos para aceitar camelCase também
public class CreatePedidoDtoCamelCase
{
    public Guid clienteId { get; set; }
    public Guid enderecoEntregaId { get; set; }
    public List<ItemPedidoDtoCamelCase> itens { get; set; } = new();
}

public class ItemPedidoDtoCamelCase
{
    public Guid produtoId { get; set; }
    public int quantidade { get; set; }
    public TamanhoProduto? tamanho { get; set; }
    public CorProduto? cor { get; set; }
}

public class EnviarPedidoDto
{
    public string CodigoRastreamento { get; set; } = string.Empty;
}
