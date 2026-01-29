using FluentValidation;
using UserManager.Application.Models.Auth;

namespace UserManager.Application.Validation;

public class RefreshRequestValidator : AbstractValidator<RefreshRequest>
{
    public RefreshRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}
