namespace UserManager.Domain.Entities;

public class AssetVerifier
{
    public string Department { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? Date { get; set; }
}
