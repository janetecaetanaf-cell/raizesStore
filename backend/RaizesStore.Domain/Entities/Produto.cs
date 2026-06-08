using RaizesStore.Domain.Entities;

namespace RaizesStore.Domain.Entities;

public class Produto : Entity
{
    protected Produto() { }

    public Produto(string nome, string descricao, decimal preco, Guid categoriaId, TipoProduto tipoProduto, bool ativo = true)
    {
        Nome = nome;
        Descricao = descricao;
        Preco = preco;
        CategoriaId = categoriaId;
        TipoProduto = tipoProduto;
        Ativo = ativo;
        TamanhosDisponiveis = new List<TamanhoProduto>();
        CoresDisponiveis = new List<CorProduto>();
        Imagens = new List<string>();
    }

    public string Nome { get; protected set; } = string.Empty;
    public string Descricao { get; protected set; } = string.Empty;
    public decimal Preco { get; protected set; }
    public Guid CategoriaId { get; protected set; }
    public Categoria? Categoria { get; protected set; }
    public TipoProduto TipoProduto { get; protected set; }
    public bool Ativo { get; protected set; }
    public int Estoque { get; protected set; }
    public List<TamanhoProduto> TamanhosDisponiveis { get; protected set; } = new();
    public List<CorProduto> CoresDisponiveis { get; protected set; } = new();
    public List<string> Imagens { get; protected set; } = new();
    public Dictionary<CorProduto, string> ImagensPorCor { get; protected set; } = new();

    public void Atualizar(string nome, string descricao, decimal preco, Guid categoriaId, bool ativo, int estoque)
    {
        Nome = nome;
        Descricao = descricao;
        Preco = preco;
        CategoriaId = categoriaId;
        Ativo = ativo;
        Estoque = estoque;
        SetUpdateAt();
    }

    public void AdicionarTamanho(TamanhoProduto tamanho)
    {
        if (!TamanhosDisponiveis.Contains(tamanho))
        {
            TamanhosDisponiveis.Add(tamanho);
            SetUpdateAt();
        }
    }

    public void RemoverTamanho(TamanhoProduto tamanho)
    {
        TamanhosDisponiveis.Remove(tamanho);
        SetUpdateAt();
    }

    public void AdicionarCor(CorProduto cor)
    {
        if (!CoresDisponiveis.Contains(cor))
        {
            CoresDisponiveis.Add(cor);
            SetUpdateAt();
        }
    }

    public void RemoverCor(CorProduto cor)
    {
        CoresDisponiveis.Remove(cor);
        SetUpdateAt();
    }

    public void AdicionarImagem(string urlImagem)
    {
        if (!Imagens.Contains(urlImagem))
        {
            Imagens.Add(urlImagem);
            SetUpdateAt();
        }
    }

    public void RemoverImagem(string urlImagem)
    {
        Imagens.Remove(urlImagem);
        SetUpdateAt();
    }

    public void DefinirImagemCor(CorProduto cor, string urlImagem)
    {
        ImagensPorCor[cor] = urlImagem;
        SetUpdateAt();
    }

    public void LimparImagensPorCor()
    {
        ImagensPorCor.Clear();
        SetUpdateAt();
    }

    public void AtualizarEstoque(int quantidade)
    {
        Estoque = quantidade;
        SetUpdateAt();
    }

    public bool TemEstoque(int quantidade)
    {
        return Estoque >= quantidade;
    }
}

public enum TipoProduto
{
    Camiseta = 1,
    Caneca = 2,
    Outros = 3,
    Vela = 4,
    Defumador = 5,
    Guia = 6,
    ImagemQuadro = 7
}

public enum TamanhoProduto
{
    PP = 1,
    P = 2,
    M = 3,
    G = 4,
    GG = 5,
    XG = 6,
    XXG = 7
}

public enum CorProduto
{
    Branco = 1,
    Preto = 2,
    Azul = 3,
    Vermelho = 4,
    Verde = 5,
    Amarelo = 6,
    Rosa = 7,
    Cinza = 8,
    Marrom = 9,
    Laranja = 10,
    Roxo = 11,
    Bege = 12
}
