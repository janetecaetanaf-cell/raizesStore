namespace RaizesStore.Api.Options;

public class PagSeguroOptions
{
    public const string SectionName = "PagSeguro";

    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string PublicKey { get; set; } = string.Empty;
    public bool Sandbox { get; set; } = true;
    public string FrontendUrl { get; set; } = "http://localhost:3000";
    public string? NotificationUrl { get; set; }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Email) && !string.IsNullOrWhiteSpace(Token);

    public bool IsCardConfigured => IsConfigured && !string.IsNullOrWhiteSpace(PublicKey);

    public string CheckoutSdkUrl { get; set; } =
        "https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js";

    public string ApiBaseUrl => Sandbox
        ? "https://ws.sandbox.pagseguro.uol.com.br"
        : "https://ws.pagseguro.uol.com.br";

    public string PaymentBaseUrl => Sandbox
        ? "https://sandbox.pagseguro.uol.com.br"
        : "https://pagseguro.uol.com.br";

    public string SdkBaseUrl => Sandbox
        ? "https://stc.sandbox.pagseguro.uol.com.br"
        : "https://stc.pagseguro.uol.com.br";

    public string DirectPaymentSdkUrl =>
        $"{SdkBaseUrl}/pagseguro/api/v2/checkout/pagseguro.directpayment.js";

    public string OrdersApiBaseUrl => Sandbox
        ? "https://sandbox.api.pagseguro.com"
        : "https://api.pagseguro.com";
}
