namespace UserManager.Infrastructure.Options;

public class EmailOptions
{
    public const string SectionName = "Email";
    public string SendGridApiKey { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "noreply@madares.sa";
    public string FromName { get; set; } = "User Manager";
    public bool Enabled { get; set; }
}
