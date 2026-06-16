using RaizesStore.Domain.Entities;

namespace RaizesStore.Domain.Entities;

public class Pedido : Entity
{
    protected Pedido() { }

    public Pedido(Guid clienteId, Guid enderecoEntregaId)
    {
        ClienteId = clienteId;
        EnderecoEntregaId = enderecoEntregaId;
        Status = StatusPedido.AguardandoPagamento;
        Itens = new List<ItemPedido>();
        NumeroPedido = GerarNumeroPedido();
        ValorTotal = 0;
    }

    public string NumeroPedido { get; protected set; } = string.Empty;
    public Guid ClienteId { get; protected set; }
    public Cliente? Cliente { get; protected set; }
    public Guid EnderecoEntregaId { get; protected set; }
    public EnderecoCliente? EnderecoEntrega { get; protected set; }
    public StatusPedido Status { get; protected set; }
    public List<ItemPedido> Itens { get; protected set; } = new();
    public decimal ValorTotal { get; protected set; }
    public string? CodigoPix { get; protected set; }
    public string? QrCodePix { get; protected set; }
    public DateTime? DataPagamento { get; protected set; }
    public DateTime? DataEnvio { get; protected set; }
    public DateTime? DataEntrega { get; protected set; }
    public string? CodigoRastreamento { get; protected set; }
    public string? PagSeguroCheckoutCode { get; protected set; }
    public string? PagSeguroTransactionCode { get; protected set; }

    public void AdicionarItem(Produto produto, int quantidade, TamanhoProduto? tamanho, CorProduto? cor)
    {
        AdicionarItem(produto.Id, produto.Nome, quantidade, tamanho, cor, produto.Preco, produto.Estoque);
    }

    public void AdicionarItem(
        Guid produtoId,
        string nomeProduto,
        int quantidade,
        TamanhoProduto? tamanho,
        CorProduto? cor,
        decimal precoUnitario,
        int? estoqueDisponivel = null)
    {
        if (estoqueDisponivel.HasValue && estoqueDisponivel.Value < quantidade)
        {
            throw new InvalidOperationException($"Produto {nomeProduto} não possui estoque suficiente.");
        }

        var item = new ItemPedido(produtoId, quantidade, tamanho, cor, precoUnitario);
        Itens.Add(item);
        CalcularValorTotal();
        SetUpdateAt();
    }

    public void RemoverItem(Guid itemId)
    {
        var item = Itens.FirstOrDefault(i => i.Id == itemId);
        if (item != null)
        {
            Itens.Remove(item);
            CalcularValorTotal();
            SetUpdateAt();
        }
    }

    public void AtualizarQuantidadeItem(Guid itemId, int quantidade, Produto produto)
    {
        var item = Itens.FirstOrDefault(i => i.Id == itemId);
        if (item != null)
        {
            if (!produto.TemEstoque(quantidade))
            {
                throw new InvalidOperationException($"Produto {produto.Nome} não possui estoque suficiente.");
            }
            item.AtualizarQuantidade(quantidade);
            CalcularValorTotal();
            SetUpdateAt();
        }
    }

    public void DefinirDadosPix(string codigoPix, string qrCodePix)
    {
        CodigoPix = codigoPix;
        QrCodePix = qrCodePix;
        SetUpdateAt();
    }

    public void DefinirCheckoutPagSeguro(string checkoutCode)
    {
        PagSeguroCheckoutCode = checkoutCode;
        SetUpdateAt();
    }

    public void DefinirTransacaoPagSeguro(string transactionCode)
    {
        PagSeguroTransactionCode = transactionCode;
        SetUpdateAt();
    }

    public void ConfirmarPagamento()
    {
        if (Status != StatusPedido.AguardandoPagamento)
        {
            throw new InvalidOperationException("Apenas pedidos aguardando pagamento podem ser confirmados.");
        }

        Status = StatusPedido.Pago;
        DataPagamento = DateTime.UtcNow;
        SetUpdateAt();
    }

    public void Enviar(string codigoRastreamento)
    {
        if (Status != StatusPedido.Pago)
        {
            throw new InvalidOperationException("Apenas pedidos pagos podem ser enviados.");
        }

        Status = StatusPedido.Enviado;
        DataEnvio = DateTime.UtcNow;
        CodigoRastreamento = codigoRastreamento;
        SetUpdateAt();
    }

    public void MarcarComoEntregue()
    {
        if (Status != StatusPedido.Enviado)
        {
            throw new InvalidOperationException("Apenas pedidos enviados podem ser marcados como entregues.");
        }

        Status = StatusPedido.Entregue;
        DataEntrega = DateTime.UtcNow;
        SetUpdateAt();
    }

    public void Cancelar()
    {
        if (Status == StatusPedido.Entregue || Status == StatusPedido.Cancelado)
        {
            throw new InvalidOperationException("Não é possível cancelar este pedido.");
        }

        Status = StatusPedido.Cancelado;
        SetUpdateAt();
    }

    private void CalcularValorTotal()
    {
        ValorTotal = Itens.Sum(i => i.ValorTotal);
    }

    private string GerarNumeroPedido()
    {
        return $"PED{DateTimeOffset.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(1000, 9999)}";
    }
}

public enum StatusPedido
{
    AguardandoPagamento = 1,
    Pago = 2,
    Enviado = 3,
    Entregue = 4,
    Cancelado = 5
}
