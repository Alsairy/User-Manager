namespace UserManager.Application.Interfaces;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
    Task SendTemplatedAsync(string to, string templateKey, object model, CancellationToken ct = default);
}
