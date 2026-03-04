using RaizesStore.Domain.Entities;

namespace RaizesStore.Domain.Entities;

public class Cliente : Entity
{
    protected Cliente() { }

    public Cliente(string nome, string email, string telefoneCelular, DateTime dataNascimento, string? cpf = null)
    {
        Nome = nome;
        Email = email;
        TelefoneCelular = telefoneCelular;
        DataNascimento = dataNascimento;
        Cpf = cpf;
        Enderecos = new List<EnderecoCliente>();
    }

    public string Nome { get; protected set; } = string.Empty;
    public string Email { get; protected set; } = string.Empty;
    public string TelefoneCelular { get; protected set; } = string.Empty;
    public DateTime DataNascimento { get; protected set; }
    public string? Cpf { get; protected set; }
    public List<EnderecoCliente> Enderecos { get; protected set; } = new();

    public void Atualizar(string nome, string email, string telefoneCelular, DateTime dataNascimento, string? cpf = null)
    {
        Nome = nome;
        Email = email;
        TelefoneCelular = telefoneCelular;
        DataNascimento = dataNascimento;
        Cpf = cpf;
        SetUpdateAt();
    }

    public void AdicionarEndereco(EnderecoCliente endereco)
    {
        if (endereco.Principal)
        {
            foreach (var e in Enderecos.Where(e => e.Principal))
            {
                e.Atualizar(e.Cep, e.Logradouro, e.Numero, e.Bairro, e.Cidade, e.Estado, e.Complemento, false);
            }
        }
        Enderecos.Add(endereco);
        SetUpdateAt();
    }

    public void RemoverEndereco(Guid enderecoId)
    {
        var endereco = Enderecos.FirstOrDefault(e => e.Id == enderecoId);
        if (endereco != null)
        {
            Enderecos.Remove(endereco);
            SetUpdateAt();
        }
    }
}

public class EnderecoCliente : Entity
{
    protected EnderecoCliente() { }

    public EnderecoCliente(Guid clienteId, string cep, string logradouro, string numero, string bairro, string cidade, string estado, string? complemento = null, bool principal = false)
    {
        ClienteId = clienteId;
        Cep = cep;
        Logradouro = logradouro;
        Numero = numero;
        Bairro = bairro;
        Cidade = cidade;
        Estado = estado;
        Complemento = complemento;
        Principal = principal;
    }

    public Guid ClienteId { get; protected set; }
    public string Cep { get; protected set; } = string.Empty;
    public string Logradouro { get; protected set; } = string.Empty;
    public string Numero { get; protected set; } = string.Empty;
    public string Bairro { get; protected set; } = string.Empty;
    public string Cidade { get; protected set; } = string.Empty;
    public string Estado { get; protected set; } = string.Empty;
    public string? Complemento { get; protected set; }
    public bool Principal { get; protected set; }

    public void Atualizar(string cep, string logradouro, string numero, string bairro, string cidade, string estado, string? complemento = null, bool principal = false)
    {
        Cep = cep;
        Logradouro = logradouro;
        Numero = numero;
        Bairro = bairro;
        Cidade = cidade;
        Estado = estado;
        Complemento = complemento;
        Principal = principal;
        SetUpdateAt();
    }
}
