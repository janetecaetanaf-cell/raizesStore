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
[AdminAuthorize]
public class AdminController : ControllerBase
{
    private readonly RaizesStoreDbContext _context;

    public AdminController(RaizesStoreDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardDto>> GetDashboard()
    {
        var totalClientes = await _context.Clientes
            .Where(c => c.DeletedAt == null)
            .CountAsync();

        var pedidosPagos = await _context.Pedidos
            .Where(p => p.Status == StatusPedido.Pago && p.DeletedAt == null)
            .CountAsync();

        var pedidosAguardandoPagamento = await _context.Pedidos
            .Where(p => p.Status == StatusPedido.AguardandoPagamento && p.DeletedAt == null)
            .CountAsync();

        var valorTotalVendas = await _context.Pedidos
            .Where(p => p.Status == StatusPedido.Pago && p.DeletedAt == null)
            .SumAsync(p => p.ValorTotal);

        var pedidosEnviados = await _context.Pedidos
            .Where(p => p.Status == StatusPedido.Enviado && p.DeletedAt == null)
            .CountAsync();

        var pedidosEntregues = await _context.Pedidos
            .Where(p => p.Status == StatusPedido.Entregue && p.DeletedAt == null)
            .CountAsync();

        return new DashboardDto
        {
            TotalClientes = totalClientes,
            PedidosPagos = pedidosPagos,
            PedidosAguardandoPagamento = pedidosAguardandoPagamento,
            ValorTotalVendas = valorTotalVendas,
            PedidosEnviados = pedidosEnviados,
            PedidosEntregues = pedidosEntregues
        };
    }

    [HttpGet("clientes")]
    public async Task<ActionResult<IEnumerable<ClienteDto>>> GetClientes()
    {
        var clientes = await _context.Clientes
            .Where(c => c.DeletedAt == null)
            .Select(c => new ClienteDto
            {
                Id = c.Id,
                Nome = c.Nome,
                Email = c.Email,
                TelefoneCelular = c.TelefoneCelular,
                DataNascimento = c.DataNascimento,
                Cpf = c.Cpf,
                TotalPedidos = _context.Pedidos.Count(p => p.ClienteId == c.Id && p.DeletedAt == null)
            })
            .OrderBy(c => c.Nome)
            .ToListAsync();

        return clientes;
    }

    [HttpGet("pedidos")]
    public async Task<ActionResult<IEnumerable<PedidoResumoDto>>> GetPedidosResumo([FromQuery] StatusPedido? status)
    {
        var query = _context.Pedidos
            .Include(p => p.Cliente)
            .Where(p => p.DeletedAt == null);

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        var pedidos = await query
            .Select(p => new PedidoResumoDto
            {
                Id = p.Id,
                NumeroPedido = p.NumeroPedido,
                ClienteNome = p.Cliente != null ? p.Cliente.Nome : "",
                ClienteEmail = p.Cliente != null ? p.Cliente.Email : "",
                Status = p.Status,
                ValorTotal = p.ValorTotal,
                DataCriacao = p.CreatedAt,
                DataPagamento = p.DataPagamento,
                TotalItens = p.Itens.Count
            })
            .OrderByDescending(p => p.DataCriacao)
            .ToListAsync();

        return pedidos;
    }
}

public class DashboardDto
{
    public int TotalClientes { get; set; }
    public int PedidosPagos { get; set; }
    public int PedidosAguardandoPagamento { get; set; }
    public decimal ValorTotalVendas { get; set; }
    public int PedidosEnviados { get; set; }
    public int PedidosEntregues { get; set; }
}

public class ClienteDto
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TelefoneCelular { get; set; } = string.Empty;
    public DateTime DataNascimento { get; set; }
    public string? Cpf { get; set; }
    public int TotalPedidos { get; set; }
}

public class PedidoResumoDto
{
    public Guid Id { get; set; }
    public string NumeroPedido { get; set; } = string.Empty;
    public string ClienteNome { get; set; } = string.Empty;
    public string ClienteEmail { get; set; } = string.Empty;
    public StatusPedido Status { get; set; }
    public decimal ValorTotal { get; set; }
    public DateTimeOffset DataCriacao { get; set; }
    public DateTime? DataPagamento { get; set; }
    public int TotalItens { get; set; }
}
