using RaizesStore.Domain.Entities;

namespace RaizesStore.Api.Services;

public class PedidoCheckoutData
{
    public Guid Id { get; init; }
    public string NumeroPedido { get; init; } = string.Empty;
    public decimal ValorTotal { get; init; }
    public IReadOnlyList<PedidoItemCheckoutData> Itens { get; init; } = Array.Empty<PedidoItemCheckoutData>();
}

public class PedidoItemCheckoutData
{
    public string NomeProduto { get; init; } = string.Empty;
    public int Quantidade { get; init; }
    public decimal PrecoUnitario { get; init; }
}

public class PagamentoCartaoRequest
{
    public string EncryptedCard { get; set; } = string.Empty;
    public string HolderName { get; set; } = string.Empty;
    public string HolderCpf { get; set; } = string.Empty;
    public int InstallmentQuantity { get; set; } = 1;
}

public class PagamentoPixRequest
{
}

public class ResultadoPagamentoPagSeguro
{
    public string TransactionCode { get; set; } = string.Empty;
    public int Status { get; set; }
    public bool Pago { get; set; }
    public string? Mensagem { get; set; }
    public string? QrCodeImagem { get; set; }
    public string? CodigoPixCopiaCola { get; set; }
}

public interface IPagSeguroService
{
    Task<ResultadoPagamentoPagSeguro> PagarComCartaoAsync(
        PedidoCheckoutData pedido, Cliente cliente, PagamentoCartaoRequest request);
    Task<ResultadoPagamentoPagSeguro> PagarComPixAsync(
        PedidoCheckoutData pedido, Cliente cliente, PagamentoPixRequest request);
    Task<CheckoutPagSeguroResult> CriarCheckoutAsync(PedidoCheckoutData pedido, Cliente cliente);
    Task<bool> ProcessarNotificacaoAsync(string notificationCode);
    Task<bool> SincronizarPedidoAsync(Guid pedidoId);
}

public class CheckoutPagSeguroResult
{
    public string CheckoutCode { get; set; } = string.Empty;
    public string PaymentUrl { get; set; } = string.Empty;
}
