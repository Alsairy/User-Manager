using UserManager.Application.Validation;

namespace UserManager.Application.Tests.Validators;

public class PasswordComplexityValidatorTests
{
    private readonly PasswordComplexityValidator _validator = new();

    [Theory]
    [InlineData("Password123!")]
    [InlineData("MySecure@Pass1")]
    [InlineData("Complex#Pass99")]
    [InlineData("V3ryS3cur3P@ss!")]
    public void Validate_ValidPassword_ShouldPass(string password)
    {
        var result = _validator.Validate(password);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("short")]
    [InlineData("12345678901")]
    public void Validate_TooShortPassword_ShouldFail(string password)
    {
        var result = _validator.Validate(password);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Password must be at least 12 characters long");
    }

    [Theory]
    [InlineData("lowercase1234!")]
    [InlineData("nouppercase123!")]
    public void Validate_NoUppercase_ShouldFail(string password)
    {
        var result = _validator.Validate(password);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Password must contain at least one uppercase letter");
    }

    [Theory]
    [InlineData("UPPERCASE1234!")]
    [InlineData("NOLOWERCASE123!")]
    public void Validate_NoLowercase_ShouldFail(string password)
    {
        var result = _validator.Validate(password);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Password must contain at least one lowercase letter");
    }

    [Theory]
    [InlineData("NoDigitsHere!!")]
    [InlineData("PasswordNoNums!")]
    public void Validate_NoDigit_ShouldFail(string password)
    {
        var result = _validator.Validate(password);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Password must contain at least one digit");
    }

    [Theory]
    [InlineData("NoSpecialChar123")]
    [InlineData("Password12345678")]
    public void Validate_NoSpecialChar_ShouldFail(string password)
    {
        var result = _validator.Validate(password);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Password must contain at least one special character");
    }

    [Fact]
    public void Validate_EmptyPassword_ShouldFail()
    {
        var result = _validator.Validate(string.Empty);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_NullPassword_ShouldThrowOrFail()
    {
        // FluentValidation may throw on null or return invalid result
        var action = () => _validator.Validate((string)null!);

        // Either throws or returns invalid result
        try
        {
            var result = action();
            result.IsValid.Should().BeFalse();
        }
        catch (ArgumentNullException)
        {
            // This is also acceptable behavior
        }
    }
}
