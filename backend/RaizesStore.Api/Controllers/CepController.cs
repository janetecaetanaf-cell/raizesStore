using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace RaizesStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CepController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<CepController> _logger;

    public CepController(IHttpClientFactory httpClientFactory, ILogger<CepController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    [HttpGet("{cep}")]
    public async Task<IActionResult> Buscar(string cep)
    {
        var digits = new string(cep.Where(char.IsDigit).ToArray());
        if (digits.Length != 8)
        {
            return BadRequest(new { message = "CEP inválido. Informe 8 dígitos." });
        }

        var endereco = await BuscarViaCepAsync(digits);
        if (endereco != null)
        {
            return Ok(endereco);
        }

        endereco = await BuscarBrasilApiAsync(digits);
        if (endereco != null)
        {
            return Ok(endereco);
        }

        return NotFound(new { message = "CEP não encontrado." });
    }

    private async Task<CepResponseDto?> BuscarViaCepAsync(string digits)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            using var response = await client.GetAsync($"https://viacep.com.br/ws/{digits}/json/");
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.TryGetProperty("erro", out var erro) && erro.GetBoolean())
            {
                return null;
            }

            return new CepResponseDto
            {
                Logradouro = root.TryGetProperty("logradouro", out var log) ? log.GetString() ?? "" : "",
                Bairro = root.TryGetProperty("bairro", out var bairro) ? bairro.GetString() ?? "" : "",
                Cidade = root.TryGetProperty("localidade", out var cidade) ? cidade.GetString() ?? "" : "",
                Estado = root.TryGetProperty("uf", out var uf) ? uf.GetString() ?? "" : "",
                Complemento = root.TryGetProperty("complemento", out var comp) ? comp.GetString() ?? "" : "",
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao consultar ViaCEP para {Cep}", digits);
            return null;
        }
    }

    private async Task<CepResponseDto?> BuscarBrasilApiAsync(string digits)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            using var response = await client.GetAsync($"https://brasilapi.com.br/api/cep/v1/{digits}");
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            return new CepResponseDto
            {
                Logradouro = root.TryGetProperty("street", out var street) ? street.GetString() ?? "" : "",
                Bairro = root.TryGetProperty("neighborhood", out var neighborhood) ? neighborhood.GetString() ?? "" : "",
                Cidade = root.TryGetProperty("city", out var city) ? city.GetString() ?? "" : "",
                Estado = root.TryGetProperty("state", out var state) ? state.GetString() ?? "" : "",
                Complemento = "",
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao consultar BrasilAPI para {Cep}", digits);
            return null;
        }
    }
}

public class CepResponseDto
{
    public string Logradouro { get; set; } = string.Empty;
    public string Bairro { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string Complemento { get; set; } = string.Empty;
}
