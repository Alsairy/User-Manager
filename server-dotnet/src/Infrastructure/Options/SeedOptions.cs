namespace UserManager.Infrastructure.Options;

public class SeedOptions
{
    public const string SectionName = "Seed";

    public bool Enabled { get; set; } = false;
    public string AdminEmail { get; set; } = "admin@madares.sa";
    public string AdminPassword { get; set; } = "Admin123!";
    public string AdminName { get; set; } = "System Admin";
}
