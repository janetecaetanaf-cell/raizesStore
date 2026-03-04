using RaizesStore.Domain.Entities;

namespace RaizesStore.Domain.Entities;

public class ItemPedido : Entity
{
    protected ItemPedido() { }

    public ItemPedido(Guid produtoId, int quantidade, TamanhoProduto? tamanho, CorProduto? cor, decimal precoUnitario)
    {
        ProdutoId = produtoId;
        Quantidade = quantidade;
        Tamanho = tamanho;
        Cor = cor;
        PrecoUnitario = precoUnitario;
        ValorTotal = precoUnitario * quantidade;
    }

    public Guid PedidoId { get; protected set; }
    public Guid ProdutoId { get; protected set; }
    public Produto? Produto { get; protected set; }
    public int Quantidade { get; protected set; }
    public TamanhoProduto? Tamanho { get; protected set; }
    public CorProduto? Cor { get; protected set; }
    public decimal PrecoUnitario { get; protected set; }
    public decimal ValorTotal { get; protected set; }

    public void AtualizarQuantidade(int quantidade)
    {
        Quantidade = quantidade;
        ValorTotal = PrecoUnitario * quantidade;
    }
}
