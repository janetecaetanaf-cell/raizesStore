using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaizesStore.Domain.Entities;
using RaizesStore.Infrastructure.Data;

namespace RaizesStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly RaizesStoreDbContext _context;

    public ClientesController(RaizesStoreDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes()
    {
        return await _context.Clientes
            .Include(c => c.Enderecos)
            .Where(c => c.DeletedAt == null)
            .OrderBy(c => c.Nome)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Cliente>> GetCliente(Guid id)
    {
        var cliente = await _context.Clientes
            .Include(c => c.Enderecos)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cliente == null || cliente.DeletedAt != null)
        {
            return NotFound();
        }

        return cliente;
    }

    [HttpPost]
    public async Task<ActionResult<Cliente>> CreateCliente(CreateClienteDto dto)
    {
        // Validar campos obrigatórios
        if (string.IsNullOrWhiteSpace(dto.Nome))
        {
            return BadRequest("O nome é obrigatório");
        }
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest("O email é obrigatório");
        }
        if (string.IsNullOrWhiteSpace(dto.TelefoneCelular))
        {
            return BadRequest("O telefone celular é obrigatório");
        }
        if (dto.DataNascimento == default(DateTime))
        {
            return BadRequest("A data de nascimento é obrigatória");
        }

        // Limpar CPF se estiver vazio
        var cpf = string.IsNullOrWhiteSpace(dto.Cpf) ? null : dto.Cpf.Trim();

        var cliente = new Cliente(dto.Nome.Trim(), dto.Email.Trim(), dto.TelefoneCelular.Trim(), dto.DataNascimento, cpf);
        
        if (dto.Endereco != null)
        {
            var endereco = new EnderecoCliente(
                cliente.Id,
                dto.Endereco.Cep,
                dto.Endereco.Logradouro,
                dto.Endereco.Numero,
                dto.Endereco.Bairro,
                dto.Endereco.Cidade,
                dto.Endereco.Estado,
                dto.Endereco.Complemento,
                true
            );
            cliente.AdicionarEndereco(endereco);
        }

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        // Recarregar com endereços incluídos
        var clienteCompleto = await _context.Clientes
            .Include(c => c.Enderecos)
            .FirstOrDefaultAsync(c => c.Id == cliente.Id);

        return CreatedAtAction(nameof(GetCliente), new { id = cliente.Id }, clienteCompleto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCliente(Guid id, UpdateClienteDto dto)
    {
        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null);
        
        if (cliente == null)
        {
            return NotFound("Cliente não encontrado");
        }

        // Validar campos obrigatórios
        if (string.IsNullOrWhiteSpace(dto.Nome))
        {
            return BadRequest("O nome é obrigatório");
        }
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest("O email é obrigatório");
        }
        if (string.IsNullOrWhiteSpace(dto.TelefoneCelular))
        {
            return BadRequest("O telefone celular é obrigatório");
        }
        if (dto.DataNascimento == default(DateTime))
        {
            return BadRequest("A data de nascimento é obrigatória");
        }

        // Limpar CPF se estiver vazio
        var cpf = string.IsNullOrWhiteSpace(dto.Cpf) ? null : dto.Cpf.Trim();

        cliente.Atualizar(
            dto.Nome.Trim(), 
            dto.Email.Trim(), 
            dto.TelefoneCelular.Trim(), 
            dto.DataNascimento, 
            cpf
        );
        
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/enderecos")]
    public async Task<ActionResult<EnderecoCliente>> AdicionarEndereco(Guid id, EnderecoDto dto)
    {
        // Validar campos obrigatórios
        if (string.IsNullOrWhiteSpace(dto.Cep))
        {
            return BadRequest("O CEP é obrigatório");
        }
        if (string.IsNullOrWhiteSpace(dto.Logradouro))
        {
            return BadRequest("O logradouro é obrigatório");
        }
        if (string.IsNullOrWhiteSpace(dto.Numero))
        {
            return BadRequest("O número é obrigatório");
        }
        if (string.IsNullOrWhiteSpace(dto.Bairro))
        {
            return BadRequest("O bairro é obrigatório");
        }
        if (string.IsNullOrWhiteSpace(dto.Cidade))
        {
            return BadRequest("A cidade é obrigatória");
        }
        if (string.IsNullOrWhiteSpace(dto.Estado))
        {
            return BadRequest("O estado é obrigatório");
        }

        var cliente = await _context.Clientes
            .Include(c => c.Enderecos)
            .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null);

        if (cliente == null)
        {
            return NotFound("Cliente não encontrado");
        }

        // Se não há endereços, este será o principal
        var isPrincipal = cliente.Enderecos.Count == 0;

        var endereco = new EnderecoCliente(
            cliente.Id,
            dto.Cep.Trim(),
            dto.Logradouro.Trim(),
            dto.Numero.Trim(),
            dto.Bairro.Trim(),
            dto.Cidade.Trim(),
            dto.Estado.Trim().ToUpper(),
            string.IsNullOrWhiteSpace(dto.Complemento) ? null : dto.Complemento.Trim(),
            isPrincipal
        );

        cliente.AdicionarEndereco(endereco);
        await _context.SaveChangesAsync();

        // Retornar o endereço criado
        return Ok(endereco);
    }
}

public class CreateClienteDto
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TelefoneCelular { get; set; } = string.Empty;
    public DateTime DataNascimento { get; set; }
    public string? Cpf { get; set; }
    public EnderecoDto? Endereco { get; set; }
}

public class UpdateClienteDto
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TelefoneCelular { get; set; } = string.Empty;
    public DateTime DataNascimento { get; set; }
    public string? Cpf { get; set; }
}

public class EnderecoDto
{
    public string Cep { get; set; } = string.Empty;
    public string Logradouro { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string Bairro { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string? Complemento { get; set; }
}
