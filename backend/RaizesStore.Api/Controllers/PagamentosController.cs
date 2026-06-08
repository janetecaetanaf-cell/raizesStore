using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RaizesStore.Api.Options;
using RaizesStore.Api.Services;
using RaizesStore.Infrastructure.Data;

namespace RaizesStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PagamentosController : ControllerBase
{
    private readonly IPagSeguroService _pagSeguroService;
    private readonly RaizesStoreDbContext _context;
    private readonly PagSeguroOptions _options;
    private readonly ILogger<PagamentosController> _logger;

    public PagamentosController(
        IPagSeguroService pagSeguroService,
        RaizesStoreDbContext context,
        IOptions<PagSeguroOptions> options,
        ILogger<PagamentosController> logger)
    {
        _pagSeguroService = pagSeguroService;
        _context = context;
        _options = options.Value;
        _logger = logger;
    }

    [HttpGet("config")]
    public ActionResult ObterConfig()
    {
        return Ok(new
        {
            configurado = _options.IsConfigured,
            cartaoConfigurado = _options.IsCardConfigured,
            sandbox = _options.Sandbox,
            gateway = "pagseguro",
            publicKey = _options.PublicKey,
            checkoutSdkUrl = _options.CheckoutSdkUrl,
            modo = "transparente",
        });
    }

    [HttpGet("sessao")]
    public async Task<IActionResult> ObterSessao([FromQuery] Guid? pedidoId)
    {
        if (!_options.IsConfigured)
        {
            return BadRequest(new { message = "PagSeguro não configurado no backend." });
        }

        if (pedidoId.HasValue)
        {
            var pedido = await ObterPedidoPagamentoAsync(pedidoId.Value);
            if (pedido == null)
            {
                return NotFound(new { message = "Pedido não encontrado." });
            }

            if (pedido.Status != Domain.Entities.StatusPedido.AguardandoPagamento)
            {
                return BadRequest(new { message = "Este pedido já foi pago ou cancelado." });
            }

            return Ok(new
            {
                publicKey = _options.PublicKey,
                checkoutSdkUrl = _options.CheckoutSdkUrl,
                cartaoConfigurado = _options.IsCardConfigured,
                sandbox = _options.Sandbox,
                valorTotal = pedido.Pedido.ValorTotal,
                numeroPedido = pedido.Pedido.NumeroPedido,
                qrCodePix = pedido.QrCodePix,
                codigoPix = pedido.CodigoPix,
            });
        }

        return Ok(new
        {
            publicKey = _options.PublicKey,
            checkoutSdkUrl = _options.CheckoutSdkUrl,
            cartaoConfigurado = _options.IsCardConfigured,
            sandbox = _options.Sandbox,
        });
    }

    [HttpGet("sessao/{pedidoId:guid}")]
    public Task<IActionResult> ObterSessaoPorPedido(Guid pedidoId) =>
        ObterSessao(pedidoId);

    [HttpPost("cartao/{pedidoId:guid}")]
    public async Task<IActionResult> PagarComCartao(Guid pedidoId, PagamentoCartaoRequest request)
    {
        var pedido = await ObterPedidoPagamentoAsync(pedidoId);
        if (pedido == null) return NotFound(new { message = "Pedido não encontrado." });
        if (pedido.Status != Domain.Entities.StatusPedido.AguardandoPagamento)
            return BadRequest(new { message = "Este pedido já foi pago ou cancelado." });
        if (pedido.Cliente == null)
            return BadRequest(new { message = "Cliente do pedido não encontrado." });

        try
        {
            var resultado = await _pagSeguroService.PagarComCartaoAsync(pedido.Pedido, pedido.Cliente, request);
            return Ok(new
            {
                pago = resultado.Pago,
                status = resultado.Status,
                transactionCode = resultado.TransactionCode,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao pagar com cartão pedido {PedidoId}", pedidoId);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("pix/{pedidoId:guid}")]
    public async Task<IActionResult> PagarComPix(Guid pedidoId, PagamentoPixRequest request)
    {
        var pedido = await ObterPedidoPagamentoAsync(pedidoId);
        if (pedido == null) return NotFound(new { message = "Pedido não encontrado." });
        if (pedido.Status != Domain.Entities.StatusPedido.AguardandoPagamento)
            return BadRequest(new { message = "Este pedido já foi pago ou cancelado." });
        if (pedido.Cliente == null)
            return BadRequest(new { message = "Cliente do pedido não encontrado." });

        try
        {
            var resultado = await _pagSeguroService.PagarComPixAsync(pedido.Pedido, pedido.Cliente, request);
            return Ok(new
            {
                pago = resultado.Pago,
                status = resultado.Status,
                transactionCode = resultado.TransactionCode,
                qrCodeImagem = resultado.QrCodeImagem,
                codigoPixCopiaCola = resultado.CodigoPixCopiaCola,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao pagar com Pix pedido {PedidoId}", pedidoId);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("checkout/{pedidoId:guid}")]
    public async Task<IActionResult> CriarCheckout(Guid pedidoId)
    {
        if (!_options.IsConfigured)
        {
            return BadRequest(new
            {
                message = "PagSeguro não configurado. Adicione e-mail e token no backend.",
            });
        }

        var pedido = await _context.Pedidos
            .AsNoTracking()
            .Where(p => p.Id == pedidoId && p.DeletedAt == null)
            .Select(p => new
            {
                Pedido = new PedidoCheckoutData
                {
                    Id = p.Id,
                    NumeroPedido = p.NumeroPedido,
                    ValorTotal = p.ValorTotal,
                    Itens = p.Itens.Select(i => new PedidoItemCheckoutData
                    {
                        NomeProduto = i.Produto != null ? i.Produto.Nome : "Produto Raízes Estampas",
                        Quantidade = i.Quantidade,
                        PrecoUnitario = i.PrecoUnitario,
                    }).ToList(),
                },
                Cliente = p.Cliente,
                Status = p.Status,
            })
            .FirstOrDefaultAsync();

        if (pedido == null)
        {
            return NotFound();
        }

        if (pedido.Status != Domain.Entities.StatusPedido.AguardandoPagamento)
        {
            return BadRequest(new { message = "Este pedido já foi pago ou cancelado." });
        }

        if (pedido.Cliente == null)
        {
            return BadRequest(new { message = "Cliente do pedido não encontrado." });
        }

        try
        {
            var checkout = await _pagSeguroService.CriarCheckoutAsync(pedido.Pedido, pedido.Cliente);
            return Ok(new
            {
                checkoutCode = checkout.CheckoutCode,
                paymentUrl = checkout.PaymentUrl,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar checkout PagSeguro para pedido {PedidoId}", pedidoId);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("sincronizar/{pedidoId:guid}")]
    public async Task<IActionResult> SincronizarPagamento(Guid pedidoId)
    {
        var pedido = await _context.Pedidos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pedidoId && p.DeletedAt == null);

        if (pedido == null)
        {
            return NotFound();
        }

        var pago = _options.IsConfigured && await _pagSeguroService.SincronizarPedidoAsync(pedidoId);

        var pedidoAtualizado = await _context.Pedidos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pedidoId);

        return Ok(new
        {
            pago,
            status = pedidoAtualizado?.Status,
            numeroPedido = pedidoAtualizado?.NumeroPedido,
        });
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook([FromForm] string? notificationCode, [FromQuery] string? notificationCodeQuery)
    {
        var codigo = notificationCode ?? notificationCodeQuery;
        if (string.IsNullOrWhiteSpace(codigo))
        {
            return Ok();
        }

        try
        {
            await _pagSeguroService.ProcessarNotificacaoAsync(codigo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar webhook PagSeguro: {Code}", codigo);
        }

        return Ok();
    }

    private async Task<PedidoPagamentoContexto?> ObterPedidoPagamentoAsync(Guid pedidoId)
    {
        return await _context.Pedidos
            .AsNoTracking()
            .Where(p => p.Id == pedidoId && p.DeletedAt == null)
            .Select(p => new PedidoPagamentoContexto
            {
                Pedido = new PedidoCheckoutData
                {
                    Id = p.Id,
                    NumeroPedido = p.NumeroPedido,
                    ValorTotal = p.ValorTotal,
                    Itens = p.Itens.Select(i => new PedidoItemCheckoutData
                    {
                        NomeProduto = i.Produto != null ? i.Produto.Nome : "Produto Raízes Estampas",
                        Quantidade = i.Quantidade,
                        PrecoUnitario = i.PrecoUnitario,
                    }).ToList(),
                },
                Cliente = p.Cliente,
                Status = p.Status,
                QrCodePix = p.QrCodePix,
                CodigoPix = p.CodigoPix,
            })
            .FirstOrDefaultAsync();
    }
}

sealed class PedidoPagamentoContexto
{
    public PedidoCheckoutData Pedido { get; init; } = null!;
    public Domain.Entities.Cliente? Cliente { get; init; }
    public Domain.Entities.StatusPedido Status { get; init; }
    public string? QrCodePix { get; init; }
    public string? CodigoPix { get; init; }
}
