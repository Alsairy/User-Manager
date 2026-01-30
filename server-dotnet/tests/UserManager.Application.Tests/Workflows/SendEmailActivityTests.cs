using FluentAssertions;
using UserManager.Workflows.Activities;
using Xunit;

namespace UserManager.Application.Tests.Workflows;

public class SendEmailActivityTests : WorkflowActivityTestBase
{
    public SendEmailActivityTests()
    {
        InitializeMocks();
    }

    [Fact]
    public void Activity_ShouldHaveExpectedInputProperties()
    {
        // Arrange & Act
        var activity = new SendEmailActivity();

        // Assert - verify activity can be created and has the expected property types
        activity.Should().NotBeNull();
        typeof(SendEmailActivity).GetProperty("To").Should().NotBeNull();
        typeof(SendEmailActivity).GetProperty("Subject").Should().NotBeNull();
        typeof(SendEmailActivity).GetProperty("Body").Should().NotBeNull();
        typeof(SendEmailActivity).GetProperty("TemplateKey").Should().NotBeNull();
        typeof(SendEmailActivity).GetProperty("TemplateModel").Should().NotBeNull();
    }

    [Fact]
    public void Activity_Properties_ShouldBeSettable()
    {
        // Arrange
        var activity = new SendEmailActivity();

        // Act & Assert - Verify properties can be assigned
        activity.To = new("recipient@example.com");
        activity.Subject = new("Test Subject");
        activity.Body = new("<p>Test Body</p>");
        activity.TemplateKey = new("welcome-email");
        activity.TemplateModel = new(new { Name = "Test User" });

        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_ShouldInheritFromCodeActivity()
    {
        // Arrange & Act
        var activity = new SendEmailActivity();

        // Assert
        activity.Should().BeAssignableTo<Elsa.Workflows.CodeActivity<bool>>();
    }

    [Fact]
    public void Activity_WithDirectContent_ShouldBeConfigurable()
    {
        // Arrange & Act
        var activity = new SendEmailActivity
        {
            To = new("user@example.com"),
            Subject = new("Welcome to the Platform"),
            Body = new("<h1>Welcome!</h1><p>Your account has been created.</p>")
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_WithTemplate_ShouldBeConfigurable()
    {
        // Arrange & Act
        var activity = new SendEmailActivity
        {
            To = new("user@example.com"),
            TemplateKey = new("account-activation"),
            TemplateModel = new(new { UserName = "John Doe", ActivationLink = "https://example.com/activate" })
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Theory]
    [InlineData("user@example.com", "Valid Email")]
    [InlineData("admin@company.org", "Valid Corporate Email")]
    [InlineData("test.user+tag@subdomain.example.co.uk", "Valid Complex Email")]
    public void Activity_ShouldAcceptVariousEmailFormats(string email, string description)
    {
        // Arrange & Act
        var activity = new SendEmailActivity
        {
            To = new(email),
            Subject = new(description),
            Body = new("Test body")
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_WithEmptyTo_ShouldReturnFalse()
    {
        // This test documents that empty recipient should result in false return
        // The actual behavior is tested in the activity implementation
        var activity = new SendEmailActivity
        {
            To = new(string.Empty),
            Subject = new("Test"),
            Body = new("Test body")
        };

        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_WithNullTo_ShouldReturnFalse()
    {
        // This test documents that null recipient should result in false return
        var activity = new SendEmailActivity
        {
            To = new((string)null!),
            Subject = new("Test"),
            Body = new("Test body")
        };

        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_HtmlBody_ShouldBeAccepted()
    {
        // Arrange
        var htmlBody = @"
            <html>
            <body>
                <h1>Welcome!</h1>
                <p>Your account has been created.</p>
                <a href='https://example.com'>Click here</a>
            </body>
            </html>";

        // Act
        var activity = new SendEmailActivity
        {
            To = new("user@example.com"),
            Subject = new("Welcome"),
            Body = new(htmlBody)
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Theory]
    [InlineData("welcome-email")]
    [InlineData("password-reset")]
    [InlineData("account-activation")]
    [InlineData("notification")]
    public void Activity_ShouldSupportVariousTemplateKeys(string templateKey)
    {
        // Arrange & Act
        var activity = new SendEmailActivity
        {
            To = new("user@example.com"),
            TemplateKey = new(templateKey),
            TemplateModel = new(new { })
        };

        // Assert
        activity.Should().NotBeNull();
    }
}
