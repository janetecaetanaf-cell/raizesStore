using RaizesStore.Domain.Entities;

namespace RaizesStore.Domain.Entities;

public class Categoria : Entity
{
    protected Categoria() { }

    public Categoria(string nome, string descricao, bool ativo = true)
    {
        Nome = nome;
        Descricao = descricao;
        Ativo = ativo;
    }

    public string Nome { get; protected set; } = string.Empty;
    public string Descricao { get; protected set; } = string.Empty;
    public bool Ativo { get; protected set; }
    public int Ordem { get; protected set; }

    public void Atualizar(string nome, string descricao, bool ativo)
    {
        Nome = nome;
        Descricao = descricao;
        Ativo = ativo;
        SetUpdateAt();
    }

    public void DefinirOrdem(int ordem)
    {
        Ordem = ordem;
        SetUpdateAt();
    }
}
