using FluentValidation.TestHelper;
using UserManager.Application.Commands;
using UserManager.Application.Validators;

namespace UserManager.Application.Tests.Validators;

public class CreateUserCommandValidatorTests
{
    private readonly CreateUserCommandValidator _validator = new();

    [Fact]
    public void Validate_ValidCommand_ShouldPass()
    {
        var command = new CreateUserCommand("test@example.com", "Test User", "password123", "Admin");
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("invalid-email")]
    public void Validate_InvalidEmail_ShouldFail(string email)
    {
        var command = new CreateUserCommand(email, "Test User", "password123", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_EmptyFullName_ShouldFail(string fullName)
    {
        var command = new CreateUserCommand("test@example.com", fullName, "password123", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.FullName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("short")]
    public void Validate_InvalidPassword_ShouldFail(string password)
    {
        var command = new CreateUserCommand("test@example.com", "Test User", password, null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }
}
