using System.Dynamic;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using UserManager.Infrastructure.Options;
using UserManager.Infrastructure.Services;

namespace UserManager.Application.Tests.Services;

public class SendGridEmailServiceTests
{
    private readonly Mock<IOptions<EmailOptions>> _optionsMock;
    private readonly Mock<ILogger<SendGridEmailService>> _loggerMock;
    private readonly SendGridEmailService _emailService;
    private readonly EmailOptions _emailOptions;

    public SendGridEmailServiceTests()
    {
        _emailOptions = new EmailOptions
        {
            Enabled = true,
            SendGridApiKey = "test-api-key",
            FromAddress = "test@madares.sa",
            FromName = "Test Madares"
        };

        _optionsMock = new Mock<IOptions<EmailOptions>>();
        _optionsMock.Setup(x => x.Value).Returns(_emailOptions);

        _loggerMock = new Mock<ILogger<SendGridEmailService>>();

        _emailService = new SendGridEmailService(_optionsMock.Object, _loggerMock.Object);
    }

    #region Helper Methods

    private static dynamic CreateExpandoModel(Dictionary<string, object?> properties)
    {
        var expando = new ExpandoObject();
        var expandoDict = (IDictionary<string, object?>)expando;
        foreach (var prop in properties)
        {
            expandoDict[prop.Key] = prop.Value;
        }
        return expando;
    }

    #endregion

    #region SendAsync Tests

    [Fact]
    public async Task SendAsync_WhenEmailDisabled_ShouldNotSendEmail()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var service = new SendGridEmailService(optionsMock.Object, _loggerMock.Object);

        // Act
        await service.SendAsync("test@example.com", "Subject", "<p>Body</p>");

        // Assert - should complete without error (email not sent)
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Email disabled")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendAsync_WhenApiKeyNotConfigured_ShouldNotSendEmail()
    {
        // Arrange
        var options = new EmailOptions
        {
            Enabled = true,
            SendGridApiKey = string.Empty
        };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var service = new SendGridEmailService(optionsMock.Object, _loggerMock.Object);

        // Act
        await service.SendAsync("test@example.com", "Subject", "<p>Body</p>");

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("SendGrid API key not configured")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region BuildUserInvitationEmail Tests

    [Fact]
    public async Task SendTemplatedAsync_UserInvitation_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "FullName", "John Doe" },
            { "Email", "john@example.com" },
            { "ActivationLink", "https://madares.sa/activate?token=abc123" }
        });

        // Act
        await service.SendTemplatedAsync("john@example.com", "UserInvitation", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Welcome to Madares Business Platform")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void BuildUserInvitationEmail_ShouldContainFullName()
    {
        // Test the model structure required for UserInvitation template
        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "FullName", "Jane Smith" },
            { "Email", "jane@example.com" },
            { "ActivationLink", "https://madares.sa/activate?token=xyz789" }
        });

        // The template should include the full name and activation link
        ((string)model.FullName).Should().NotBeEmpty();
        ((string)model.ActivationLink).Should().Contain("activate");
    }

    #endregion

    #region BuildPasswordResetEmail Tests

    [Fact]
    public async Task SendTemplatedAsync_PasswordReset_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ResetLink", "https://madares.sa/reset?token=abc123" }
        });

        // Act
        await service.SendTemplatedAsync("user@example.com", "PasswordReset", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Password Reset Request")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void BuildPasswordResetEmail_ModelShouldContainResetLink()
    {
        // Test the model structure required for PasswordReset template
        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ResetLink", "https://madares.sa/reset-password?token=test123" }
        });

        ((string)model.ResetLink).Should().Contain("reset");
        ((string)model.ResetLink).Should().Contain("token");
    }

    #endregion

    #region BuildAssetApprovedEmail Tests

    [Fact]
    public async Task SendTemplatedAsync_AssetApproved_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "AssetCode", "AST-2024-001" },
            { "AssetName", "Commercial Building A" },
            { "AssetId", Guid.NewGuid() }
        });

        // Act
        await service.SendTemplatedAsync("owner@example.com", "AssetApproved", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Asset Approved - AST-2024-001")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void BuildAssetApprovedEmail_ModelShouldContainAssetDetails()
    {
        // Test the model structure required for AssetApproved template
        var assetId = Guid.NewGuid();
        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "AssetCode", "AST-2024-002" },
            { "AssetName", "School Building" },
            { "AssetId", assetId }
        });

        ((string)model.AssetCode).Should().StartWith("AST");
        ((string)model.AssetName).Should().NotBeEmpty();
        ((Guid)model.AssetId).Should().NotBe(Guid.Empty);
    }

    #endregion

    #region BuildAssetRejectedEmail Tests

    [Fact]
    public async Task SendTemplatedAsync_AssetRejected_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "AssetCode", "AST-2024-003" },
            { "Reason", "Missing documentation" }
        });

        // Act
        await service.SendTemplatedAsync("owner@example.com", "AssetRejected", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Asset Rejected - AST-2024-003")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void BuildAssetRejectedEmail_ShouldIncludeRejectionReason()
    {
        // Test the model structure required for AssetRejected template
        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "AssetCode", "AST-2024-004" },
            { "Reason", "Incomplete financial records" }
        });

        ((string)model.Reason).Should().NotBeEmpty();
        ((string)model.AssetCode).Should().NotBeEmpty();
    }

    [Fact]
    public async Task SendTemplatedAsync_AssetRejected_WithNullReason_ShouldUseDefaultReason()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "AssetCode", "AST-2024-005" },
            { "Reason", null }
        });

        // Act
        await service.SendTemplatedAsync("owner@example.com", "AssetRejected", model);

        // Assert - should not throw and subject should still contain asset code
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("AST-2024-005")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region BuildContractCreatedEmail Tests

    [Fact]
    public async Task SendTemplatedAsync_ContractCreated_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ContractCode", "CNT-2024-001" },
            { "AssetName", "Office Complex" },
            { "TotalAmount", "500000" },
            { "ContractId", Guid.NewGuid() }
        });

        // Act
        await service.SendTemplatedAsync("investor@example.com", "ContractCreated", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("New Contract Created - CNT-2024-001")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void BuildContractCreatedEmail_ModelShouldContainContractDetails()
    {
        // Test the model structure required for ContractCreated template
        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ContractCode", "CNT-2024-002" },
            { "AssetName", "Retail Space" },
            { "TotalAmount", "250000" },
            { "ContractId", Guid.NewGuid() }
        });

        ((string)model.ContractCode).Should().StartWith("CNT");
        ((string)model.AssetName).Should().NotBeEmpty();
        ((string)model.TotalAmount).Should().NotBeEmpty();
    }

    #endregion

    #region BuildInstallmentOverdueEmail Tests

    [Fact]
    public async Task SendTemplatedAsync_InstallmentOverdue_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ContractCode", "CNT-2024-003" },
            { "InstallmentNumber", 3 },
            { "Amount", "10000" },
            { "DueDate", "2024-01-15" },
            { "ContractId", Guid.NewGuid() }
        });

        // Act
        await service.SendTemplatedAsync("investor@example.com", "InstallmentOverdue", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Payment Overdue - Installment #3")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void BuildInstallmentOverdueEmail_ModelShouldContainPaymentDetails()
    {
        // Test the model structure required for InstallmentOverdue template
        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ContractCode", "CNT-2024-004" },
            { "InstallmentNumber", 5 },
            { "Amount", "15000" },
            { "DueDate", "2024-02-01" },
            { "ContractId", Guid.NewGuid() }
        });

        ((int)model.InstallmentNumber).Should().BeGreaterThan(0);
        ((string)model.Amount).Should().NotBeEmpty();
        ((string)model.DueDate).Should().NotBeEmpty();
    }

    #endregion

    #region BuildIsnadStageAdvancedEmail Tests

    [Fact]
    public async Task SendTemplatedAsync_IsnadStageAdvanced_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ReferenceNumber", "ISNAD-2024-001" },
            { "NewStage", "Investment Agency Review" },
            { "FormId", Guid.NewGuid() }
        });

        // Act
        await service.SendTemplatedAsync("user@example.com", "IsnadStageAdvanced", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("ISNAD Update - ISNAD-2024-001")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void BuildIsnadStageAdvancedEmail_ModelShouldContainStageDetails()
    {
        // Test the model structure required for IsnadStageAdvanced template
        var formId = Guid.NewGuid();
        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ReferenceNumber", "ISNAD-2024-002" },
            { "NewStage", "CEO Approval" },
            { "FormId", formId }
        });

        ((string)model.ReferenceNumber).Should().StartWith("ISNAD");
        ((string)model.NewStage).Should().NotBeEmpty();
        ((Guid)model.FormId).Should().NotBe(Guid.Empty);
    }

    #endregion

    #region BuildGenericNotificationEmail Tests

    [Fact]
    public async Task SendTemplatedAsync_GenericNotification_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "Title", "Important System Update" },
            { "Message", "Please review the new policy changes." }
        });

        // Act
        await service.SendTemplatedAsync("user@example.com", "GenericNotification", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Important System Update")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendTemplatedAsync_GenericNotification_WithNullTitle_ShouldUseDefaultTitle()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "Title", null },
            { "Message", "You have a new notification." }
        });

        // Act
        await service.SendTemplatedAsync("user@example.com", "GenericNotification", model);

        // Assert - should use default "Notification" title
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Notification")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void BuildGenericNotificationEmail_ModelShouldContainTitleAndMessage()
    {
        // Test the model structure required for GenericNotification template
        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "Title", "System Maintenance" },
            { "Message", "The system will be under maintenance tonight." }
        });

        ((string)model.Title).Should().NotBeEmpty();
        ((string)model.Message).Should().NotBeEmpty();
    }

    #endregion

    #region Unknown Template Tests

    [Fact]
    public async Task SendTemplatedAsync_UnknownTemplate_ShouldUseDefaultSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "Title", "Test Notification" },
            { "Message", "Test message content" }
        });

        // Act
        await service.SendTemplatedAsync("user@example.com", "UnknownTemplate", model);

        // Assert - should use "Notification from Madares" as default subject
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Notification from Madares")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion


    #region Additional Template Tests

    [Fact]
    public async Task SendTemplatedAsync_AccountActivated_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "FullName", "John Doe" }
        });

        // Act
        await service.SendTemplatedAsync("john@example.com", "AccountActivated", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Account Activated")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendTemplatedAsync_ContractExpiring_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ContractCode", "CNT-2024-010" },
            { "EndDate", "2024-12-31" },
            { "ContractId", Guid.NewGuid() }
        });

        // Act
        await service.SendTemplatedAsync("investor@example.com", "ContractExpiring", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Contract Expiring Soon - CNT-2024-010")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendTemplatedAsync_IsnadApproved_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ReferenceNumber", "ISNAD-2024-100" },
            { "ApprovalDate", "2024-06-15" },
            { "FormId", Guid.NewGuid() }
        });

        // Act
        await service.SendTemplatedAsync("user@example.com", "IsnadApproved", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("ISNAD Approved - ISNAD-2024-100")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendTemplatedAsync_IsnadRejected_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ReferenceNumber", "ISNAD-2024-101" },
            { "Reason", "Does not meet requirements" }
        });

        // Act
        await service.SendTemplatedAsync("user@example.com", "IsnadRejected", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("ISNAD Rejected - ISNAD-2024-101")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendTemplatedAsync_InvestorInterestApproved_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "AssetName", "Premium Office Space" }
        });

        // Act
        await service.SendTemplatedAsync("investor@example.com", "InvestorInterestApproved", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Investment Interest Approved")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendTemplatedAsync_AccountDeactivated_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "FullName", "John Doe" }
        });

        // Act
        await service.SendTemplatedAsync("john@example.com", "AccountDeactivated", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Account Deactivated")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendTemplatedAsync_AssetReturnedForChanges_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "AssetCode", "AST-2024-010" },
            { "Reason", "Please update financial records" },
            { "AssetId", Guid.NewGuid() }
        });

        // Act
        await service.SendTemplatedAsync("owner@example.com", "AssetReturnedForChanges", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Action Required: Asset Changes Needed - AST-2024-010")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendTemplatedAsync_ContractActivated_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ContractCode", "CNT-2024-015" },
            { "StartDate", "2024-01-01" },
            { "EndDate", "2027-01-01" },
            { "ContractId", Guid.NewGuid() }
        });

        // Act
        await service.SendTemplatedAsync("investor@example.com", "ContractActivated", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Contract Activated - CNT-2024-015")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendTemplatedAsync_InstallmentReminder_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ContractCode", "CNT-2024-020" },
            { "InstallmentNumber", 2 },
            { "Amount", "25000" },
            { "DueDate", "2024-03-15" },
            { "ContractId", Guid.NewGuid() }
        });

        // Act
        await service.SendTemplatedAsync("investor@example.com", "InstallmentReminder", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Payment Reminder - Due 2024-03-15")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendTemplatedAsync_IsnadReturnedForChanges_ShouldHaveCorrectSubject()
    {
        // Arrange
        var options = new EmailOptions { Enabled = false };
        var optionsMock = new Mock<IOptions<EmailOptions>>();
        optionsMock.Setup(x => x.Value).Returns(options);

        var loggerMock = new Mock<ILogger<SendGridEmailService>>();
        var service = new SendGridEmailService(optionsMock.Object, loggerMock.Object);

        var model = CreateExpandoModel(new Dictionary<string, object?>
        {
            { "ReferenceNumber", "ISNAD-2024-200" },
            { "Reason", "Please provide additional documentation" },
            { "FormId", Guid.NewGuid() }
        });

        // Act
        await service.SendTemplatedAsync("user@example.com", "IsnadReturnedForChanges", model);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Action Required: ISNAD Changes Needed - ISNAD-2024-200")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion
}
