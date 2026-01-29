using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;
using UserManager.Application.Interfaces;
using UserManager.Infrastructure.Options;

namespace UserManager.Infrastructure.Services;

public class SendGridEmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly ILogger<SendGridEmailService> _logger;

    public SendGridEmailService(IOptions<EmailOptions> options, ILogger<SendGridEmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Email disabled. Would send to {To}: {Subject}", to, subject);
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.SendGridApiKey))
        {
            _logger.LogWarning("SendGrid API key not configured. Email not sent to {To}", to);
            return;
        }

        var client = new SendGridClient(_options.SendGridApiKey);
        var from = new EmailAddress(_options.FromAddress, _options.FromName);
        var toAddress = new EmailAddress(to);
        var msg = MailHelper.CreateSingleEmail(from, toAddress, subject, null, htmlBody);

        var response = await client.SendEmailAsync(msg, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Body.ReadAsStringAsync(ct);
            _logger.LogError("SendGrid failed: {StatusCode} - {Body}", response.StatusCode, body);
        }
        else
        {
            _logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
        }
    }

    public async Task SendTemplatedAsync(string to, string templateKey, object model, CancellationToken ct = default)
    {
        var (subject, body) = templateKey switch
        {
            "UserInvitation" => BuildUserInvitationEmail(model),
            "PasswordReset" => BuildPasswordResetEmail(model),
            "AssetApproved" => BuildAssetApprovedEmail(model),
            "AssetRejected" => BuildAssetRejectedEmail(model),
            "ContractCreated" => BuildContractCreatedEmail(model),
            "InstallmentOverdue" => BuildInstallmentOverdueEmail(model),
            "IsnadStageAdvanced" => BuildIsnadStageAdvancedEmail(model),
            _ => ("Notification", $"<p>You have a new notification.</p>")
        };

        await SendAsync(to, subject, body, ct);
    }

    private static (string Subject, string Body) BuildUserInvitationEmail(object model)
    {
        dynamic m = model;
        return ("Welcome to User Manager", $@"
            <h1>Welcome, {m.FullName}!</h1>
            <p>You have been invited to join User Manager.</p>
            <p>Your email: {m.Email}</p>
            <p>Please log in to activate your account.</p>");
    }

    private static (string Subject, string Body) BuildPasswordResetEmail(object model)
    {
        dynamic m = model;
        return ("Password Reset Request", $@"
            <h1>Password Reset</h1>
            <p>Click the link below to reset your password:</p>
            <p><a href='{m.ResetLink}'>Reset Password</a></p>");
    }

    private static (string Subject, string Body) BuildAssetApprovedEmail(object model)
    {
        dynamic m = model;
        return ("Asset Approved", $@"
            <h1>Asset Approved</h1>
            <p>Your asset <strong>{m.AssetCode}</strong> has been approved.</p>");
    }

    private static (string Subject, string Body) BuildAssetRejectedEmail(object model)
    {
        dynamic m = model;
        return ("Asset Rejected", $@"
            <h1>Asset Rejected</h1>
            <p>Your asset <strong>{m.AssetCode}</strong> has been rejected.</p>
            <p>Reason: {m.Reason}</p>");
    }

    private static (string Subject, string Body) BuildContractCreatedEmail(object model)
    {
        dynamic m = model;
        return ("New Contract Created", $@"
            <h1>Contract Created</h1>
            <p>A new contract <strong>{m.ContractCode}</strong> has been created.</p>");
    }

    private static (string Subject, string Body) BuildInstallmentOverdueEmail(object model)
    {
        dynamic m = model;
        return ("Installment Overdue", $@"
            <h1>Installment Payment Overdue</h1>
            <p>Installment #{m.InstallmentNumber} for contract <strong>{m.ContractCode}</strong> is overdue.</p>
            <p>Amount: {m.Amount}</p>");
    }

    private static (string Subject, string Body) BuildIsnadStageAdvancedEmail(object model)
    {
        dynamic m = model;
        return ("ISNAD Stage Update", $@"
            <h1>ISNAD Form Stage Updated</h1>
            <p>ISNAD form <strong>{m.ReferenceNumber}</strong> has advanced to stage: {m.NewStage}</p>");
    }
}
