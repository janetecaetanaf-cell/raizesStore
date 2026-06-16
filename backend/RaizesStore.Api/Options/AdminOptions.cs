namespace RaizesStore.Api.Options;

public class AdminOptions
{
    public const string SectionName = "Admin";

    public List<string> Emails { get; set; } = new();

    public bool IsAdmin(string? email)
    {
        if (string.IsNullOrWhiteSpace(email) || Emails.Count == 0)
        {
            return false;
        }

        var normalizado = email.Trim().ToLowerInvariant();
        return Emails.Any(e => e.Trim().ToLowerInvariant() == normalizado);
    }
}
