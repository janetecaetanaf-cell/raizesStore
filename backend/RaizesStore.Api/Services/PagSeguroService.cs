using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RaizesStore.Api.Options;
using RaizesStore.Domain.Entities;
using RaizesStore.Infrastructure.Data;

namespace RaizesStore.Api.Services;

public class PagSeguroService : IPagSeguroService
{
    private readonly HttpClient _httpClient;
    private readonly RaizesStoreDbContext _context;
    private readonly PagSeguroOptions _options;
    private readonly ILogger<PagSeguroService> _logger;

    private static readonly HashSet<int> StatusPagos = new() { 3, 4 };

    public PagSeguroService(
        HttpClient httpClient,
        RaizesStoreDbContext context,
        IOptions<PagSeguroOptions> options,
        ILogger<PagSeguroService> logger)
    {
        _httpClient = httpClient;
        _context = context;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<CheckoutPagSeguroResult> CriarCheckoutAsync(PedidoCheckoutData pedido, Cliente cliente)
    {
        if (!_options.IsConfigured)
        {
            throw new InvalidOperationException(
                "PagSeguro não configurado. Defina PagSeguro:Email e PagSeguro:Token no appsettings.");
        }

        if (!string.IsNullOrWhiteSpace(pedido.NumeroPedido))
        {
            var pedidoExistente = await _context.Pedidos
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == pedido.Id && p.DeletedAt == null);

            if (!string.IsNullOrWhiteSpace(pedidoExistente?.PagSeguroCheckoutCode))
            {
                return new CheckoutPagSeguroResult
                {
                    CheckoutCode = pedidoExistente.PagSeguroCheckoutCode,
                    PaymentUrl = $"{_options.PaymentBaseUrl}/v2/checkout/payment.html?code={pedidoExistente.PagSeguroCheckoutCode}",
                };
            }
        }

        var frontend = _options.FrontendUrl.TrimEnd('/');
        var parametros = new Dictionary<string, string>
        {
            ["email"] = _options.Email,
            ["token"] = _options.Token,
            ["currency"] = "BRL",
            ["reference"] = pedido.Id.ToString(),
            ["senderName"] = cliente.Nome,
            ["senderEmail"] = cliente.Email,
            ["redirectURL"] = $"{frontend}/pagamento/sucesso?pedido={pedido.Id}",
        };

        var notificationUrl = ObterNotificationUrl();
        if (!string.IsNullOrWhiteSpace(notificationUrl))
        {
            parametros["notificationURL"] = notificationUrl;
        }

        var indice = 1;
        foreach (var item in pedido.Itens)
        {
            parametros[$"itemId{indice}"] = indice.ToString(CultureInfo.InvariantCulture);
            parametros[$"itemDescription{indice}"] = item.NomeProduto;
            parametros[$"itemAmount{indice}"] = item.PrecoUnitario.ToString("F2", CultureInfo.InvariantCulture);
            parametros[$"itemQuantity{indice}"] = item.Quantidade.ToString(CultureInfo.InvariantCulture);
            indice++;
        }

        var body = string.Join("&", parametros.Select(p =>
            $"{Encode(p.Key)}={Encode(p.Value)}"));

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.ApiBaseUrl}/v2/checkout")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/x-www-form-urlencoded"),
        };

        using var response = await _httpClient.SendAsync(request);
        var xml = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Erro ao criar checkout PagSeguro: {Status} {Body}", response.StatusCode, xml);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                throw new InvalidOperationException(
                    _options.Sandbox
                        ? "Credenciais inválidas para o sandbox. Crie conta em sandbox.pagseguro.uol.com.br e gere um token lá."
                        : "E-mail ou token do PagSeguro incorretos. Verifique em Preferências → Integrações.");
            }

            throw new InvalidOperationException(TraduzirErroPagSeguro(xml) ?? "Não foi possível iniciar o pagamento no PagSeguro.");
        }

        var checkoutCode = LerCodigoCheckout(xml);
        if (string.IsNullOrWhiteSpace(checkoutCode))
        {
            throw new InvalidOperationException(TraduzirErroPagSeguro(xml) ?? "PagSeguro não retornou código de checkout.");
        }

        await SalvarCheckoutCodeAsync(pedido.Id, checkoutCode);

        return new CheckoutPagSeguroResult
        {
            CheckoutCode = checkoutCode,
            PaymentUrl = $"{_options.PaymentBaseUrl}/v2/checkout/payment.html?code={checkoutCode}",
        };
    }

    public Task<ResultadoPagamentoPagSeguro> PagarComCartaoAsync(
        PedidoCheckoutData pedido,
        Cliente cliente,
        PagamentoCartaoRequest request)
    {
        ValidarConfiguracao();

        if (!_options.IsCardConfigured)
        {
            throw new InvalidOperationException(
                "Chave pública do PagBank não configurada. Defina PagSeguro:PublicKey no appsettings " +
                "ou a variável PAGSEGURO_PUBLIC_KEY (Painel PagBank → Integrações → Chaves públicas).");
        }

        if (string.IsNullOrWhiteSpace(request.EncryptedCard))
        {
            throw new InvalidOperationException("Dados do cartão incompletos.");
        }

        if (string.IsNullOrWhiteSpace(request.HolderName) || string.IsNullOrWhiteSpace(request.HolderCpf))
        {
            throw new InvalidOperationException("Nome e CPF do titular são obrigatórios.");
        }

        return CriarCartaoViaOrdersApiAsync(pedido, cliente, request);
    }

    public async Task<ResultadoPagamentoPagSeguro> PagarComPixAsync(
        PedidoCheckoutData pedido,
        Cliente cliente,
        PagamentoPixRequest request)
    {
        ValidarConfiguracao();
        return await CriarPixViaOrdersApiAsync(pedido, cliente);
    }

    public async Task<bool> ProcessarNotificacaoAsync(string notificationCode)
    {
        var transacao = await ConsultarNotificacaoAsync(notificationCode);
        if (transacao == null) return false;

        return await AtualizarPedidoPorTransacaoAsync(transacao);
    }

    public async Task<bool> SincronizarPedidoAsync(Guid pedidoId)
    {
        var pedido = await _context.Pedidos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pedidoId && p.DeletedAt == null);

        if (pedido == null) return false;
        if (pedido.Status == StatusPedido.Pago) return true;

        if (!string.IsNullOrWhiteSpace(pedido.PagSeguroTransactionCode))
        {
            var ordersStatus = await ConsultarPedidoOrdersAsync(pedido.PagSeguroTransactionCode);
            if (ordersStatus != null)
            {
                return await AtualizarPedidoPorOrdersAsync(pedidoId, ordersStatus);
            }

            var transacao = await ConsultarTransacaoAsync(pedido.PagSeguroTransactionCode);
            if (transacao != null)
            {
                return await AtualizarPedidoPorTransacaoAsync(transacao);
            }
        }

        var transacaoPorReferencia = await BuscarTransacaoPorReferenciaAsync(pedidoId);
        if (transacaoPorReferencia != null)
        {
            return await AtualizarPedidoPorTransacaoAsync(transacaoPorReferencia);
        }

        return false;
    }

    private async Task SalvarCheckoutCodeAsync(Guid pedidoId, string checkoutCode)
    {
        var linhas = await _context.Pedidos
            .Where(p => p.Id == pedidoId && p.DeletedAt == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(p => p.PagSeguroCheckoutCode, checkoutCode)
                .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));

        if (linhas == 0)
        {
            throw new InvalidOperationException("Pedido não encontrado para registrar o checkout PagSeguro.");
        }
    }

    private async Task<TransacaoPagSeguro?> BuscarTransacaoPorReferenciaAsync(Guid pedidoId)
    {
        var url =
            $"{_options.ApiBaseUrl}/v2/transactions?email={Encode(_options.Email)}" +
            $"&token={Encode(_options.Token)}&reference={Encode(pedidoId.ToString())}";

        using var response = await _httpClient.GetAsync(url);
        var xml = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Erro ao buscar transação por referência: {Body}", xml);
            return null;
        }

        return LerTransacao(xml);
    }

    private static string Encode(string value) => Uri.EscapeDataString(value);

    private async Task<bool> AtualizarPedidoPorTransacaoAsync(TransacaoPagSeguro transacao)
    {
        if (!Guid.TryParse(transacao.Reference, out var pedidoId))
        {
            return false;
        }

        var pedido = await _context.Pedidos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pedidoId && p.DeletedAt == null);

        if (pedido == null) return false;

        if (!string.IsNullOrWhiteSpace(transacao.Code))
        {
            await _context.Pedidos
                .Where(p => p.Id == pedidoId && p.DeletedAt == null)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.PagSeguroTransactionCode, transacao.Code)
                    .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));
        }

        if (StatusPagos.Contains(transacao.Status) && pedido.Status == StatusPedido.AguardandoPagamento)
        {
            var linhas = await _context.Pedidos
                .Where(p => p.Id == pedidoId && p.DeletedAt == null && p.Status == StatusPedido.AguardandoPagamento)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.Status, StatusPedido.Pago)
                    .SetProperty(p => p.DataPagamento, DateTime.UtcNow)
                    .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));

            if (linhas > 0)
            {
                _logger.LogInformation("Pagamento PagSeguro confirmado para pedido {PedidoId}", pedidoId);
            }

            return linhas > 0;
        }

        return StatusPagos.Contains(transacao.Status);
    }

    private async Task<TransacaoPagSeguro?> ConsultarNotificacaoAsync(string notificationCode)
    {
        var url =
            $"{_options.ApiBaseUrl}/v3/transactions/notifications/{Encode(notificationCode)}" +
            $"?email={Encode(_options.Email)}&token={Encode(_options.Token)}";

        using var response = await _httpClient.GetAsync(url);
        var xml = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Erro ao consultar notificação PagSeguro: {Body}", xml);
            return null;
        }

        return LerTransacao(xml);
    }

    private async Task<TransacaoPagSeguro?> ConsultarTransacaoAsync(string transactionCode)
    {
        var url =
            $"{_options.ApiBaseUrl}/v3/transactions/{Encode(transactionCode)}" +
            $"?email={Encode(_options.Email)}&token={Encode(_options.Token)}";

        using var response = await _httpClient.GetAsync(url);
        var xml = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Erro ao consultar transação PagSeguro: {Body}", xml);
            return null;
        }

        return LerTransacao(xml);
    }

    private static string? LerCodigoCheckout(string xml)
    {
        var doc = XDocument.Parse(xml);
        return doc.Root?.Name.LocalName == "checkout"
            ? doc.Root.Element("code")?.Value
            : null;
    }

    private static string? LerErroPagSeguro(string xml)
    {
        try
        {
            var doc = XDocument.Parse(xml);
            var error = doc.Descendants("error").FirstOrDefault();
            return error?.Element("message")?.Value;
        }
        catch
        {
            return null;
        }
    }

    private static string? LerCodigoErroPagSeguro(string xml)
    {
        try
        {
            var doc = XDocument.Parse(xml);
            return doc.Descendants("error").FirstOrDefault()?.Element("code")?.Value;
        }
        catch
        {
            return null;
        }
    }

    private static string? TraduzirErroPagSeguro(string xml)
    {
        var codigo = LerCodigoErroPagSeguro(xml);
        var mensagem = LerErroPagSeguro(xml);

        return codigo switch
        {
            "11192" =>
                "O checkout do PagSeguro está desativado na sua conta. Acesse pagseguro.uol.com.br → Integrações ou fale com o suporte PagBank para liberar, ou use uma conta sandbox para testes.",
            _ => mensagem,
        };
    }

    private static TransacaoPagSeguro? LerTransacao(string xml)
    {
        try
        {
            var doc = XDocument.Parse(xml);
            var transaction = doc.Descendants("transaction").FirstOrDefault();
            if (transaction == null) return null;

            var statusRaw = transaction.Element("status")?.Value;
            if (!int.TryParse(statusRaw, out var status))
            {
                return null;
            }

            return new TransacaoPagSeguro
            {
                Code = transaction.Element("code")?.Value,
                Reference = transaction.Element("reference")?.Value,
                Status = status,
            };
        }
        catch
        {
            return null;
        }
    }

    private async Task<ResultadoPagamentoPagSeguro> CriarCartaoViaOrdersApiAsync(
        PedidoCheckoutData pedido,
        Cliente cliente,
        PagamentoCartaoRequest request)
    {
        var endereco = await ObterEnderecoEntregaAsync(pedido.Id);
        var valorCentavos = ObterValorCentavos(pedido.ValorTotal);
        var cpfCliente = ObterCpfCliente(cliente);
        var cpfTitular = SomenteDigitos(request.HolderCpf);
        var parcelas = Math.Max(request.InstallmentQuantity, 1);

        var payload = new
        {
            reference_id = pedido.Id.ToString(),
            customer = MontarClienteOrders(cliente, cpfCliente),
            items = MontarItensOrders(pedido),
            shipping = MontarShippingOrders(endereco),
            charges = new[]
            {
                new
                {
                    reference_id = pedido.Id.ToString(),
                    description = $"Pedido {pedido.NumeroPedido}",
                    amount = new { value = valorCentavos, currency = "BRL" },
                    payment_method = new
                    {
                        type = "CREDIT_CARD",
                        installments = parcelas,
                        capture = true,
                        soft_descriptor = "Raizes Estampas",
                        card = new
                        {
                            encrypted = request.EncryptedCard.Trim(),
                            store = false,
                        },
                        holder = new
                        {
                            name = request.HolderName.Trim(),
                            tax_id = cpfTitular,
                        },
                    },
                },
            },
        };

        var json = await EnviarPedidoOrdersAsync(payload);
        var resultado = ExtrairResultadoOrdersCartao(json);

        if (!string.IsNullOrWhiteSpace(resultado.TransactionCode))
        {
            await _context.Pedidos
                .Where(p => p.Id == pedido.Id && p.DeletedAt == null)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.PagSeguroTransactionCode, resultado.TransactionCode)
                    .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));
        }

        if (resultado.Pago)
        {
            await _context.Pedidos
                .Where(p => p.Id == pedido.Id && p.DeletedAt == null && p.Status == StatusPedido.AguardandoPagamento)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.Status, StatusPedido.Pago)
                    .SetProperty(p => p.DataPagamento, DateTime.UtcNow)
                    .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));
        }
        else if (resultado.Status == 7)
        {
            throw new InvalidOperationException(resultado.Mensagem ?? "Pagamento recusado pelo emissor do cartão.");
        }

        return resultado;
    }

    private async Task<ResultadoPagamentoPagSeguro> CriarPixViaOrdersApiAsync(
        PedidoCheckoutData pedido,
        Cliente cliente)
    {
        var endereco = await ObterEnderecoEntregaAsync(pedido.Id);
        var valorCentavos = ObterValorCentavos(pedido.ValorTotal);
        var cpfCliente = ObterCpfCliente(cliente);

        var payload = new
        {
            reference_id = pedido.Id.ToString(),
            customer = MontarClienteOrders(cliente, cpfCliente),
            items = MontarItensOrders(pedido),
            qr_codes = new[]
            {
                new
                {
                    amount = new { value = valorCentavos },
                    expiration_date = DateTimeOffset.UtcNow.AddHours(24).ToString("yyyy-MM-dd'T'HH:mm:sszzz"),
                },
            },
            shipping = MontarShippingOrders(endereco),
        };

        var json = await EnviarPedidoOrdersAsync(payload);
        var (textoPix, imagemQr) = await ObterDadosPixOrdersAsync(json);
        var orderId = JsonDocument.Parse(json).RootElement.TryGetProperty("id", out var idEl)
            ? idEl.GetString()
            : null;

        if (!string.IsNullOrWhiteSpace(orderId))
        {
            await _context.Pedidos
                .Where(p => p.Id == pedido.Id && p.DeletedAt == null)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.PagSeguroTransactionCode, orderId)
                    .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));
        }

        if (!string.IsNullOrWhiteSpace(textoPix) || !string.IsNullOrWhiteSpace(imagemQr))
        {
            await _context.Pedidos
                .Where(p => p.Id == pedido.Id && p.DeletedAt == null)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.CodigoPix, textoPix)
                    .SetProperty(p => p.QrCodePix, imagemQr)
                    .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));
        }

        if (!EhCodigoPixValido(textoPix) && string.IsNullOrWhiteSpace(imagemQr))
        {
            throw new InvalidOperationException("PagBank não retornou um código Pix válido.");
        }

        return new ResultadoPagamentoPagSeguro
        {
            TransactionCode = orderId ?? string.Empty,
            Status = 1,
            Pago = false,
            CodigoPixCopiaCola = textoPix,
            QrCodeImagem = imagemQr,
        };
    }

    private async Task<EnderecoCliente> ObterEnderecoEntregaAsync(Guid pedidoId)
    {
        var endereco = await _context.Pedidos
            .AsNoTracking()
            .Where(p => p.Id == pedidoId && p.DeletedAt == null)
            .Select(p => p.EnderecoEntrega)
            .FirstOrDefaultAsync();

        return endereco
            ?? throw new InvalidOperationException("Endereço de entrega não encontrado para o pedido.");
    }

    private static int ObterValorCentavos(decimal valorTotal)
    {
        var valorCentavos = (int)Math.Round(valorTotal * 100, MidpointRounding.AwayFromZero);
        if (valorCentavos <= 0)
        {
            throw new InvalidOperationException("Valor do pedido inválido.");
        }

        return valorCentavos;
    }

    private static string ObterCpfCliente(Cliente cliente)
    {
        var cpf = SomenteDigitos(cliente.Cpf ?? string.Empty);
        return string.IsNullOrWhiteSpace(cpf) ? "00000000000" : cpf;
    }

    private static object MontarClienteOrders(Cliente cliente, string cpf)
    {
        var telefone = ExtrairTelefone(cliente.TelefoneCelular);
        return new
        {
            name = cliente.Nome,
            email = cliente.Email,
            tax_id = cpf,
            phones = telefone == null
                ? Array.Empty<object>()
                : new[]
                {
                    new
                    {
                        country = "55",
                        area = telefone.Value.area,
                        number = telefone.Value.numero,
                        type = "MOBILE",
                    },
                },
        };
    }

    private static IEnumerable<object> MontarItensOrders(PedidoCheckoutData pedido) =>
        pedido.Itens.Select((item, index) => new
        {
            reference_id = (index + 1).ToString(CultureInfo.InvariantCulture),
            name = item.NomeProduto,
            quantity = item.Quantidade,
            unit_amount = (int)Math.Round(item.PrecoUnitario * 100, MidpointRounding.AwayFromZero),
        });

    private static object MontarShippingOrders(EnderecoCliente endereco) => new
    {
        address = new
        {
            street = endereco.Logradouro,
            number = endereco.Numero,
            complement = endereco.Complemento ?? string.Empty,
            locality = endereco.Bairro,
            city = endereco.Cidade,
            region_code = endereco.Estado,
            country = "BRA",
            postal_code = SomenteDigitos(endereco.Cep),
        },
    };

    private async Task<string> EnviarPedidoOrdersAsync(object payload)
    {
        var notificationUrl = ObterNotificationUrl();
        var bodyDict = JsonSerializer.SerializeToNode(payload)!.AsObject();
        if (!string.IsNullOrWhiteSpace(notificationUrl))
        {
            bodyDict["notification_urls"] = JsonSerializer.SerializeToNode(new[] { notificationUrl });
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.OrdersApiBaseUrl}/orders")
        {
            Content = new StringContent(bodyDict.ToJsonString(), Encoding.UTF8, "application/json"),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.Token);

        using var response = await _httpClient.SendAsync(request);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Erro ao criar pedido PagBank Orders: {Status} {Body}", response.StatusCode, json);
            throw new InvalidOperationException(LerErroOrdersApi(json) ?? "Não foi possível processar o pagamento no PagBank.");
        }

        return json;
    }

    private static ResultadoPagamentoPagSeguro ExtrairResultadoOrdersCartao(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var orderId = root.TryGetProperty("id", out var idEl) ? idEl.GetString() ?? string.Empty : string.Empty;
        var orderStatus = root.TryGetProperty("status", out var orderStatusEl) ? orderStatusEl.GetString() : null;

        string? chargeStatus = null;
        string? mensagem = null;

        if (root.TryGetProperty("charges", out var charges))
        {
            var charge = charges.EnumerateArray().FirstOrDefault();
            if (charge.ValueKind != JsonValueKind.Undefined)
            {
                chargeStatus = charge.TryGetProperty("status", out var statusEl) ? statusEl.GetString() : null;

                if (charge.TryGetProperty("payment_response", out var paymentResponse))
                {
                    mensagem = paymentResponse.TryGetProperty("message", out var msgEl)
                        ? msgEl.GetString()
                        : null;
                }
            }
        }

        var pago = chargeStatus is "PAID" or "AUTHORIZED" || orderStatus is "PAID";
        var status = chargeStatus switch
        {
            "PAID" or "AUTHORIZED" => 3,
            "DECLINED" or "CANCELED" => 7,
            "IN_ANALYSIS" => 2,
            _ => orderStatus is "PAID" ? 3 : 1,
        };

        return new ResultadoPagamentoPagSeguro
        {
            TransactionCode = orderId,
            Status = status,
            Pago = pago,
            Mensagem = mensagem,
        };
    }

    private async Task<PedidoOrdersStatus?> ConsultarPedidoOrdersAsync(string orderId)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"{_options.OrdersApiBaseUrl}/orders/{Uri.EscapeDataString(orderId)}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.Token);

        using var response = await _httpClient.SendAsync(request);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }

        var json = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Erro ao consultar pedido PagBank Orders {OrderId}: {Body}", orderId, json);
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var referenceId = root.TryGetProperty("reference_id", out var refEl) ? refEl.GetString() : null;
            var orderStatus = root.TryGetProperty("status", out var orderStatusEl) ? orderStatusEl.GetString() : null;

            string? chargeStatus = null;
            if (root.TryGetProperty("charges", out var charges))
            {
                chargeStatus = charges.EnumerateArray()
                    .Select(c => c.TryGetProperty("status", out var s) ? s.GetString() : null)
                    .FirstOrDefault(s => !string.IsNullOrWhiteSpace(s));
            }

            var pago = chargeStatus is "PAID" or "AUTHORIZED" || orderStatus is "PAID";

            return new PedidoOrdersStatus
            {
                ReferenceId = referenceId,
                OrderId = orderId,
                Pago = pago,
            };
        }
        catch
        {
            return null;
        }
    }

    private async Task<bool> AtualizarPedidoPorOrdersAsync(Guid pedidoId, PedidoOrdersStatus ordersStatus)
    {
        if (!ordersStatus.Pago)
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(ordersStatus.OrderId))
        {
            await _context.Pedidos
                .Where(p => p.Id == pedidoId && p.DeletedAt == null)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.PagSeguroTransactionCode, ordersStatus.OrderId)
                    .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));
        }

        var linhas = await _context.Pedidos
            .Where(p => p.Id == pedidoId && p.DeletedAt == null && p.Status == StatusPedido.AguardandoPagamento)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(p => p.Status, StatusPedido.Pago)
                .SetProperty(p => p.DataPagamento, DateTime.UtcNow)
                .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));

        if (linhas > 0)
        {
            _logger.LogInformation("Pagamento PagBank Orders confirmado para pedido {PedidoId}", pedidoId);
        }

        return linhas > 0 || ordersStatus.Pago;
    }

    private static string? LerErroOrdersApi(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("error_messages", out var errors))
            {
                foreach (var error in errors.EnumerateArray())
                {
                    var code = error.TryGetProperty("code", out var codeEl) ? codeEl.GetString() : null;
                    var desc = error.TryGetProperty("description", out var d) ? d.GetString() : null;

                    if (code is "UNAUTHORIZED" or "ACCESS_DENIED"
                        || desc?.Contains("Invalid credential", StringComparison.OrdinalIgnoreCase) == true
                        || desc?.Contains("whitelist", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        if (code == "ACCESS_DENIED" || desc?.Contains("whitelist", StringComparison.OrdinalIgnoreCase) == true)
                        {
                            return "Sua conta PagBank ainda não tem acesso à API de Pedidos (lista de permissão). " +
                                   "Entre em contato com o PagBank para liberar a API de Pedidos na sua conta.";
                        }

                        return "Token do PagBank inválido ou expirado. Gere um novo token em " +
                               "PagBank → Venda online → Integrações → Gerar token, " +
                               "atualize PagSeguro:Token no appsettings.Development.json (ou PAGSEGURO_TOKEN) " +
                               "e reinicie a API. Não use a chave pública no lugar do token.";
                    }

                    if (!string.IsNullOrWhiteSpace(desc)) return desc;
                }
            }

            if (doc.RootElement.TryGetProperty("message", out var message))
            {
                return message.GetString();
            }
        }
        catch
        {
            // ignora parse
        }

        return null;
    }

    private async Task<(string? texto, string? imagem)> ObterDadosPixOrdersAsync(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("qr_codes", out var qrCodes)) return (null, null);

            var qr = qrCodes.EnumerateArray().FirstOrDefault();
            if (qr.ValueKind == JsonValueKind.Undefined) return (null, null);

            var texto = qr.TryGetProperty("text", out var textEl) ? textEl.GetString() : null;
            if (!EhCodigoPixValido(texto))
            {
                texto = null;
            }

            string? imagem = null;
            string? linkTexto = null;
            string? linkImagem = null;

            if (qr.TryGetProperty("links", out var links))
            {
                foreach (var link in links.EnumerateArray())
                {
                    var media = link.TryGetProperty("media", out var mediaEl) ? mediaEl.GetString() : null;
                    var href = link.TryGetProperty("href", out var hrefEl) ? hrefEl.GetString() : null;
                    if (string.IsNullOrWhiteSpace(href)) continue;

                    var rel = link.TryGetProperty("rel", out var relEl) ? relEl.GetString() : null;

                    if (rel is "QRCODE.BASE64" or "QRCODE.TEXT" || media == "text/plain")
                    {
                        linkTexto ??= href;
                    }

                    if (rel is "QRCODE.PNG" or "QR_CODE" || media == "image/png")
                    {
                        linkImagem ??= href;
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(texto) && !string.IsNullOrWhiteSpace(linkTexto))
            {
                texto = await BuscarTextoPixDoLinkAsync(linkTexto);
            }

            if (string.IsNullOrWhiteSpace(imagem) && !string.IsNullOrWhiteSpace(linkImagem))
            {
                imagem = await BuscarImagemQrComoDataUrlAsync(linkImagem);
            }

            return (texto, imagem);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao extrair dados Pix da resposta PagBank");
            return (null, null);
        }
    }

    private async Task<string?> BuscarTextoPixDoLinkAsync(string url)
    {
        var conteudo = await BuscarConteudoAutenticadoAsync(url);
        if (string.IsNullOrWhiteSpace(conteudo)) return null;

        conteudo = conteudo.Trim();
        if (EhCodigoPixValido(conteudo))
        {
            return conteudo;
        }

        try
        {
            var decodificado = Encoding.UTF8.GetString(Convert.FromBase64String(conteudo));
            if (EhCodigoPixValido(decodificado))
            {
                return decodificado.Trim();
            }
        }
        catch
        {
            // conteúdo não era base64 do Pix
        }

        return null;
    }

    private async Task<string?> BuscarImagemQrComoDataUrlAsync(string url)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.Token);

        using var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Falha ao baixar QR Code Pix: {Status}", response.StatusCode);
            return null;
        }

        var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/png";
        var bytes = await response.Content.ReadAsByteArrayAsync();
        if (bytes.Length == 0) return null;

        return $"data:{contentType};base64,{Convert.ToBase64String(bytes)}";
    }

    private async Task<string?> BuscarConteudoAutenticadoAsync(string url)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.Token);

        using var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Falha ao buscar link PagBank: {Status} {Url}", response.StatusCode, url);
            return null;
        }

        return await response.Content.ReadAsStringAsync();
    }

    private static bool EhCodigoPixValido(string? valor) =>
        !string.IsNullOrWhiteSpace(valor)
        && valor.TrimStart().StartsWith("000201", StringComparison.Ordinal);

    private void ValidarConfiguracao()
    {
        if (!_options.IsConfigured)
        {
            throw new InvalidOperationException(
                "PagSeguro não configurado. Defina PagSeguro:Email e PagSeguro:Token no appsettings.");
        }
    }

    private Dictionary<string, string> MontarParametrosBaseTransacao(PedidoCheckoutData pedido, Cliente cliente)
    {
        var parametros = new Dictionary<string, string>
        {
            ["email"] = _options.Email,
            ["token"] = _options.Token,
            ["paymentMode"] = "default",
            ["currency"] = "BRL",
            ["reference"] = pedido.Id.ToString(),
            ["receiverEmail"] = _options.Email,
            ["senderName"] = cliente.Nome,
            ["senderEmail"] = cliente.Email,
        };

        var notificationUrl = ObterNotificationUrl();
        if (!string.IsNullOrWhiteSpace(notificationUrl))
        {
            parametros["notificationURL"] = notificationUrl;
        }

        var telefone = ExtrairTelefone(cliente.TelefoneCelular);
        if (telefone != null)
        {
            parametros["senderAreaCode"] = telefone.Value.area;
            parametros["senderPhone"] = telefone.Value.numero;
        }

        if (!string.IsNullOrWhiteSpace(cliente.Cpf))
        {
            parametros["senderCPF"] = SomenteDigitos(cliente.Cpf);
        }

        var indice = 1;
        foreach (var item in pedido.Itens)
        {
            parametros[$"itemId{indice}"] = indice.ToString(CultureInfo.InvariantCulture);
            parametros[$"itemDescription{indice}"] = item.NomeProduto;
            parametros[$"itemAmount{indice}"] = item.PrecoUnitario.ToString("F2", CultureInfo.InvariantCulture);
            parametros[$"itemQuantity{indice}"] = item.Quantidade.ToString(CultureInfo.InvariantCulture);
            indice++;
        }

        return parametros;
    }

    private async Task<ResultadoPagamentoPagSeguro> EnviarTransacaoAsync(
        Guid pedidoId,
        Dictionary<string, string> parametros,
        bool salvarPix = false)
    {
        var body = string.Join("&", parametros.Select(p => $"{Encode(p.Key)}={Encode(p.Value)}"));

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.ApiBaseUrl}/v2/transactions")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/x-www-form-urlencoded"),
        };

        using var response = await _httpClient.SendAsync(request);
        var xml = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Erro na transação PagSeguro: {Status} {Body}", response.StatusCode, xml);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                throw new InvalidOperationException(
                    "E-mail ou token do PagSeguro incorretos. Verifique em Preferências → Integrações.");
            }

            throw new InvalidOperationException(
                TraduzirErroPagSeguro(xml) ?? "Não foi possível processar o pagamento no PagSeguro.");
        }

        var resultado = LerResultadoPagamento(xml)
            ?? throw new InvalidOperationException("PagSeguro não retornou dados da transação.");

        if (!string.IsNullOrWhiteSpace(resultado.TransactionCode))
        {
            await _context.Pedidos
                .Where(p => p.Id == pedidoId && p.DeletedAt == null)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.PagSeguroTransactionCode, resultado.TransactionCode)
                    .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));
        }

        if (salvarPix && (!string.IsNullOrWhiteSpace(resultado.CodigoPixCopiaCola) || !string.IsNullOrWhiteSpace(resultado.QrCodeImagem)))
        {
            await _context.Pedidos
                .Where(p => p.Id == pedidoId && p.DeletedAt == null)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.CodigoPix, resultado.CodigoPixCopiaCola)
                    .SetProperty(p => p.QrCodePix, resultado.QrCodeImagem)
                    .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));
        }

        if (resultado.Pago)
        {
            await _context.Pedidos
                .Where(p => p.Id == pedidoId && p.DeletedAt == null && p.Status == StatusPedido.AguardandoPagamento)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.Status, StatusPedido.Pago)
                    .SetProperty(p => p.DataPagamento, DateTime.UtcNow)
                    .SetProperty(p => p.UpdatedAt, DateTimeOffset.UtcNow));
        }

        return resultado;
    }

    private static ResultadoPagamentoPagSeguro? LerResultadoPagamento(string xml)
    {
        try
        {
            var doc = XDocument.Parse(xml);
            var transaction = doc.Descendants("transaction").FirstOrDefault();
            if (transaction == null) return null;

            var statusRaw = transaction.Element("status")?.Value;
            if (!int.TryParse(statusRaw, out var status))
            {
                return null;
            }

            var qrCode = transaction.Element("qrCode")?.Value
                ?? transaction.Descendants("qrCode").FirstOrDefault()?.Value;
            var paymentLink = transaction.Element("paymentLink")?.Value
                ?? transaction.Descendants("paymentLink").FirstOrDefault()?.Value;

            return new ResultadoPagamentoPagSeguro
            {
                TransactionCode = transaction.Element("code")?.Value ?? string.Empty,
                Status = status,
                Pago = StatusPagos.Contains(status),
                QrCodeImagem = qrCode,
                CodigoPixCopiaCola = paymentLink,
            };
        }
        catch
        {
            return null;
        }
    }

    private static string SomenteDigitos(string valor) =>
        new string(valor.Where(char.IsDigit).ToArray());

    private static (string area, string numero)? ExtrairTelefone(string telefone)
    {
        var digitos = SomenteDigitos(telefone);
        if (digitos.Length is >= 10 and <= 11)
        {
            return (digitos[..2], digitos[2..]);
        }

        return null;
    }

    private string? ObterNotificationUrl()
    {
        if (!string.IsNullOrWhiteSpace(_options.NotificationUrl))
        {
            return _options.NotificationUrl;
        }

        var backendUrl = Environment.GetEnvironmentVariable("BACKEND_URL");
        if (string.IsNullOrWhiteSpace(backendUrl))
        {
            return null;
        }

        return $"{backendUrl.TrimEnd('/')}/api/pagamentos/webhook";
    }

    private sealed class PedidoOrdersStatus
    {
        public string? ReferenceId { get; init; }
        public string OrderId { get; init; } = string.Empty;
        public bool Pago { get; init; }
    }

    private sealed class TransacaoPagSeguro
    {
        public string? Code { get; init; }
        public string? Reference { get; init; }
        public int Status { get; init; }
    }
}
