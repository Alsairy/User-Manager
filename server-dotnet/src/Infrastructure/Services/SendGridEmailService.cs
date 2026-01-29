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
            "AccountActivated" => BuildAccountActivatedEmail(model),
            "AccountDeactivated" => BuildAccountDeactivatedEmail(model),
            "AssetApproved" => BuildAssetApprovedEmail(model),
            "AssetRejected" => BuildAssetRejectedEmail(model),
            "AssetReturnedForChanges" => BuildAssetReturnedEmail(model),
            "ContractCreated" => BuildContractCreatedEmail(model),
            "ContractActivated" => BuildContractActivatedEmail(model),
            "ContractExpiring" => BuildContractExpiringEmail(model),
            "InstallmentOverdue" => BuildInstallmentOverdueEmail(model),
            "InstallmentReminder" => BuildInstallmentReminderEmail(model),
            "IsnadStageAdvanced" => BuildIsnadStageAdvancedEmail(model),
            "IsnadApproved" => BuildIsnadApprovedEmail(model),
            "IsnadRejected" => BuildIsnadRejectedEmail(model),
            "IsnadReturnedForChanges" => BuildIsnadReturnedEmail(model),
            "InvestorInterestApproved" => BuildInvestorInterestApprovedEmail(model),
            "GenericNotification" => BuildGenericNotificationEmail(model),
            _ => ("Notification from Madares", BuildGenericNotificationEmail(model).Body)
        };

        await SendAsync(to, subject, body, ct);
    }

    private static string WrapInTemplate(string title, string content)
    {
        return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>{title}</title>
    <style>
        body {{ font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px; text-align: center; }}
        .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }}
        .header img {{ max-width: 150px; margin-bottom: 15px; }}
        .content {{ padding: 40px 30px; }}
        .content h2 {{ color: #0d9488; margin-top: 0; font-size: 20px; }}
        .content p {{ margin: 15px 0; color: #555; }}
        .button {{ display: inline-block; background: #0d9488; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
        .button:hover {{ background: #0f766e; }}
        .info-box {{ background: #f0fdfa; border-left: 4px solid #0d9488; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
        .warning-box {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
        .error-box {{ background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
        .success-box {{ background: #dcfce7; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
        .footer {{ background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }}
        .footer p {{ margin: 5px 0; color: #6b7280; font-size: 13px; }}
        .footer a {{ color: #0d9488; text-decoration: none; }}
        .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
        .detail-label {{ color: #6b7280; font-weight: 500; }}
        .detail-value {{ color: #111; font-weight: 600; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Madares Business Platform</h1>
        </div>
        <div class='content'>
            {content}
        </div>
        <div class='footer'>
            <p>This is an automated message from Madares Business Platform.</p>
            <p>If you have questions, please contact <a href='mailto:support@madares.sa'>support@madares.sa</a></p>
            <p style='margin-top: 15px; color: #9ca3af;'>&copy; 2024 Madares Business. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
    }

    private static (string Subject, string Body) BuildUserInvitationEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>Welcome to Madares Business Platform!</h2>
            <p>Dear {m.FullName},</p>
            <p>You have been invited to join the Madares Business Platform. Your account has been created with the following details:</p>
            <div class='info-box'>
                <p><strong>Email:</strong> {m.Email}</p>
            </div>
            <p>To get started, please click the button below to activate your account and set your password:</p>
            <p style='text-align: center;'>
                <a href='{m.ActivationLink ?? "https://madares.sa/activate"}' class='button'>Activate Your Account</a>
            </p>
            <p>If you did not expect this invitation, please ignore this email.</p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Welcome to Madares Business Platform", WrapInTemplate("Account Invitation", content));
    }

    private static (string Subject, string Body) BuildPasswordResetEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password for your Madares account.</p>
            <p>Click the button below to set a new password:</p>
            <p style='text-align: center;'>
                <a href='{m.ResetLink}' class='button'>Reset Password</a>
            </p>
            <div class='warning-box'>
                <p><strong>Important:</strong> This link will expire in 24 hours.</p>
            </div>
            <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Password Reset Request", WrapInTemplate("Password Reset", content));
    }

    private static (string Subject, string Body) BuildAccountActivatedEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>Account Activated!</h2>
            <p>Dear {m.FullName},</p>
            <div class='success-box'>
                <p>Your account has been successfully activated. You now have full access to the Madares Business Platform.</p>
            </div>
            <p>You can now log in and start using all the features available to you.</p>
            <p style='text-align: center;'>
                <a href='https://madares.sa/login' class='button'>Log In Now</a>
            </p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Account Activated", WrapInTemplate("Account Activated", content));
    }

    private static (string Subject, string Body) BuildAccountDeactivatedEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>Account Deactivated</h2>
            <p>Dear {m.FullName},</p>
            <div class='warning-box'>
                <p>Your account on the Madares Business Platform has been deactivated.</p>
            </div>
            <p>If you believe this was done in error, please contact your administrator or our support team.</p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Account Deactivated", WrapInTemplate("Account Deactivated", content));
    }

    private static (string Subject, string Body) BuildAssetApprovedEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>Asset Approved</h2>
            <p>Great news! Your asset registration has been approved.</p>
            <div class='success-box'>
                <p><strong>Asset Code:</strong> {m.AssetCode}</p>
                <p><strong>Asset Name:</strong> {m.AssetName ?? "N/A"}</p>
            </div>
            <p>Your asset is now visible to investors and available for contract creation.</p>
            <p style='text-align: center;'>
                <a href='https://madares.sa/assets/{m.AssetId}' class='button'>View Asset Details</a>
            </p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Asset Approved - " + m.AssetCode, WrapInTemplate("Asset Approved", content));
    }

    private static (string Subject, string Body) BuildAssetRejectedEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>Asset Registration Rejected</h2>
            <p>We regret to inform you that your asset registration has been rejected.</p>
            <div class='error-box'>
                <p><strong>Asset Code:</strong> {m.AssetCode}</p>
                <p><strong>Reason:</strong> {m.Reason ?? "No reason provided"}</p>
            </div>
            <p>If you have questions about this decision, please contact your administrator.</p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Asset Rejected - " + m.AssetCode, WrapInTemplate("Asset Rejected", content));
    }

    private static (string Subject, string Body) BuildAssetReturnedEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>Asset Returned for Changes</h2>
            <p>Your asset registration requires changes before it can be approved.</p>
            <div class='warning-box'>
                <p><strong>Asset Code:</strong> {m.AssetCode}</p>
                <p><strong>Feedback:</strong> {m.Reason ?? "Please review and update the submission"}</p>
            </div>
            <p>Please review the feedback and resubmit your asset for approval.</p>
            <p style='text-align: center;'>
                <a href='https://madares.sa/assets/{m.AssetId}/edit' class='button'>Edit Asset</a>
            </p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Action Required: Asset Changes Needed - " + m.AssetCode, WrapInTemplate("Asset Changes Required", content));
    }

    private static (string Subject, string Body) BuildContractCreatedEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>New Contract Created</h2>
            <p>A new contract has been created for your investment.</p>
            <div class='info-box'>
                <p><strong>Contract Code:</strong> {m.ContractCode}</p>
                <p><strong>Asset:</strong> {m.AssetName ?? "N/A"}</p>
                <p><strong>Total Amount:</strong> {m.TotalAmount ?? "N/A"} SAR</p>
            </div>
            <p style='text-align: center;'>
                <a href='https://madares.sa/contracts/{m.ContractId}' class='button'>View Contract</a>
            </p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("New Contract Created - " + m.ContractCode, WrapInTemplate("Contract Created", content));
    }

    private static (string Subject, string Body) BuildContractActivatedEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>Contract Activated</h2>
            <p>Your contract has been activated and is now in force.</p>
            <div class='success-box'>
                <p><strong>Contract Code:</strong> {m.ContractCode}</p>
                <p><strong>Start Date:</strong> {m.StartDate ?? "N/A"}</p>
                <p><strong>End Date:</strong> {m.EndDate ?? "N/A"}</p>
            </div>
            <p>Installment payments will begin according to the agreed schedule.</p>
            <p style='text-align: center;'>
                <a href='https://madares.sa/contracts/{m.ContractId}' class='button'>View Contract Details</a>
            </p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Contract Activated - " + m.ContractCode, WrapInTemplate("Contract Activated", content));
    }

    private static (string Subject, string Body) BuildContractExpiringEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>Contract Expiring Soon</h2>
            <p>This is a reminder that your contract is approaching its end date.</p>
            <div class='warning-box'>
                <p><strong>Contract Code:</strong> {m.ContractCode}</p>
                <p><strong>End Date:</strong> {m.EndDate ?? "N/A"}</p>
            </div>
            <p>Please contact us if you wish to discuss renewal options.</p>
            <p style='text-align: center;'>
                <a href='https://madares.sa/contracts/{m.ContractId}' class='button'>View Contract</a>
            </p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Contract Expiring Soon - " + m.ContractCode, WrapInTemplate("Contract Expiring", content));
    }

    private static (string Subject, string Body) BuildInstallmentOverdueEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>Payment Overdue</h2>
            <p>An installment payment is overdue. Please make your payment as soon as possible.</p>
            <div class='error-box'>
                <p><strong>Contract:</strong> {m.ContractCode}</p>
                <p><strong>Installment #:</strong> {m.InstallmentNumber}</p>
                <p><strong>Amount Due:</strong> {m.Amount} SAR</p>
                <p><strong>Due Date:</strong> {m.DueDate ?? "N/A"}</p>
            </div>
            <p>Please make your payment promptly to avoid any late fees or penalties.</p>
            <p style='text-align: center;'>
                <a href='https://madares.sa/contracts/{m.ContractId}' class='button'>View Payment Details</a>
            </p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Payment Overdue - Installment #" + m.InstallmentNumber, WrapInTemplate("Payment Overdue", content));
    }

    private static (string Subject, string Body) BuildInstallmentReminderEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>Payment Reminder</h2>
            <p>This is a friendly reminder that an installment payment is due soon.</p>
            <div class='info-box'>
                <p><strong>Contract:</strong> {m.ContractCode}</p>
                <p><strong>Installment #:</strong> {m.InstallmentNumber}</p>
                <p><strong>Amount Due:</strong> {m.Amount} SAR</p>
                <p><strong>Due Date:</strong> {m.DueDate ?? "N/A"}</p>
            </div>
            <p style='text-align: center;'>
                <a href='https://madares.sa/contracts/{m.ContractId}' class='button'>View Payment Details</a>
            </p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Payment Reminder - Due " + m.DueDate, WrapInTemplate("Payment Reminder", content));
    }

    private static (string Subject, string Body) BuildIsnadStageAdvancedEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>ISNAD Form Status Update</h2>
            <p>Your ISNAD form has progressed to a new stage.</p>
            <div class='info-box'>
                <p><strong>Reference Number:</strong> {m.ReferenceNumber}</p>
                <p><strong>New Stage:</strong> {m.NewStage}</p>
            </div>
            <p>Your form is progressing through the approval process. You will be notified of any further updates.</p>
            <p style='text-align: center;'>
                <a href='https://madares.sa/isnad-forms/{m.FormId}' class='button'>View ISNAD Form</a>
            </p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("ISNAD Update - " + m.ReferenceNumber, WrapInTemplate("ISNAD Status Update", content));
    }

    private static (string Subject, string Body) BuildIsnadApprovedEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>ISNAD Form Approved!</h2>
            <p>Congratulations! Your ISNAD form has been fully approved.</p>
            <div class='success-box'>
                <p><strong>Reference Number:</strong> {m.ReferenceNumber}</p>
                <p><strong>Approval Date:</strong> {m.ApprovalDate ?? DateTime.UtcNow.ToString("d")}</p>
            </div>
            <p>You may now proceed with the contract creation process.</p>
            <p style='text-align: center;'>
                <a href='https://madares.sa/isnad-forms/{m.FormId}' class='button'>View Approved Form</a>
            </p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("ISNAD Approved - " + m.ReferenceNumber, WrapInTemplate("ISNAD Approved", content));
    }

    private static (string Subject, string Body) BuildIsnadRejectedEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>ISNAD Form Rejected</h2>
            <p>We regret to inform you that your ISNAD form has been rejected.</p>
            <div class='error-box'>
                <p><strong>Reference Number:</strong> {m.ReferenceNumber}</p>
                <p><strong>Reason:</strong> {m.Reason ?? "No reason provided"}</p>
            </div>
            <p>If you have questions about this decision, please contact your administrator.</p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("ISNAD Rejected - " + m.ReferenceNumber, WrapInTemplate("ISNAD Rejected", content));
    }

    private static (string Subject, string Body) BuildIsnadReturnedEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>ISNAD Form Returned for Changes</h2>
            <p>Your ISNAD form requires modifications before it can proceed.</p>
            <div class='warning-box'>
                <p><strong>Reference Number:</strong> {m.ReferenceNumber}</p>
                <p><strong>Feedback:</strong> {m.Reason ?? "Please review and update the submission"}</p>
            </div>
            <p>Please address the feedback and resubmit your form.</p>
            <p style='text-align: center;'>
                <a href='https://madares.sa/isnad-forms/{m.FormId}/edit' class='button'>Edit ISNAD Form</a>
            </p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Action Required: ISNAD Changes Needed - " + m.ReferenceNumber, WrapInTemplate("ISNAD Changes Required", content));
    }

    private static (string Subject, string Body) BuildInvestorInterestApprovedEmail(object model)
    {
        dynamic m = model;
        var content = $@"
            <h2>Investment Interest Approved!</h2>
            <p>Great news! Your investment interest has been approved.</p>
            <div class='success-box'>
                <p><strong>Asset:</strong> {m.AssetName ?? "N/A"}</p>
            </div>
            <p>Our investment team will contact you shortly to discuss the next steps and proceed with the contract process.</p>
            <p>Best regards,<br/>The Madares Team</p>";

        return ("Investment Interest Approved", WrapInTemplate("Interest Approved", content));
    }

    private static (string Subject, string Body) BuildGenericNotificationEmail(object model)
    {
        dynamic m = model;
        var title = m.Title ?? "Notification";
        var message = m.Message ?? "You have a new notification.";
        var content = $@"
            <h2>{title}</h2>
            <p>{message}</p>
            <p>Best regards,<br/>The Madares Team</p>";

        return (title, WrapInTemplate(title, content));
    }
}
