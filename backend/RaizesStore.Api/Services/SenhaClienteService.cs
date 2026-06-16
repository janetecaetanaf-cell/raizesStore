using System.Security.Cryptography;

namespace RaizesStore.Api.Services;

public static class SenhaClienteService
{
    private const int Iteracoes = 100_000;
    private const int TamanhoSalt = 16;
    private const int TamanhoHash = 32;

    public static string GerarHash(string senha)
    {
        var salt = RandomNumberGenerator.GetBytes(TamanhoSalt);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            senha,
            salt,
            Iteracoes,
            HashAlgorithmName.SHA256,
            TamanhoHash);

        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool Verificar(string senha, string? hashArmazenado)
    {
        if (string.IsNullOrWhiteSpace(hashArmazenado))
        {
            return false;
        }

        var partes = hashArmazenado.Split('.', 2);
        if (partes.Length != 2)
        {
            return false;
        }

        try
        {
            var salt = Convert.FromBase64String(partes[0]);
            var hash = Convert.FromBase64String(partes[1]);
            var calculado = Rfc2898DeriveBytes.Pbkdf2(
                senha,
                salt,
                Iteracoes,
                HashAlgorithmName.SHA256,
                TamanhoHash);

            return CryptographicOperations.FixedTimeEquals(hash, calculado);
        }
        catch
        {
            return false;
        }
    }
}
