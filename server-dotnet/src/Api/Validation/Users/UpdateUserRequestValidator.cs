using FluentValidation;
using UserManager.Api.Models.Users;
using UserManager.Domain.Enums;

namespace UserManager.Api.Validation.Users;

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.FullName)
            .MaximumLength(200)
            .When(x => !string.IsNullOrWhiteSpace(x.FullName));

        RuleFor(x => x.Status)
            .Must(status => string.IsNullOrWhiteSpace(status) || Enum.TryParse<UserStatus>(status, true, out _))
            .WithMessage("Status must be a valid user status value.");
    }
}
