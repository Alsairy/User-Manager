using System.Text.RegularExpressions;
using FluentValidation;
using UserManager.Api.Models.Users;

namespace UserManager.Api.Validation.Users;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    private static readonly Regex HasUpperCase = new(@"[A-Z]", RegexOptions.Compiled);
    private static readonly Regex HasLowerCase = new(@"[a-z]", RegexOptions.Compiled);
    private static readonly Regex HasDigit = new(@"\d", RegexOptions.Compiled);
    private static readonly Regex HasSpecialChar = new(@"[!@#$%^&*(),.?""':{}|<>_\-+=\[\]\\;/`~]", RegexOptions.Compiled);

    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(x => x.FullName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(12).WithMessage("Password must be at least 12 characters long")
            .MaximumLength(128)
            .Must(p => HasUpperCase.IsMatch(p ?? string.Empty)).WithMessage("Password must contain at least one uppercase letter")
            .Must(p => HasLowerCase.IsMatch(p ?? string.Empty)).WithMessage("Password must contain at least one lowercase letter")
            .Must(p => HasDigit.IsMatch(p ?? string.Empty)).WithMessage("Password must contain at least one digit")
            .Must(p => HasSpecialChar.IsMatch(p ?? string.Empty)).WithMessage("Password must contain at least one special character");
    }
}
