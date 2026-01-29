using FluentValidation;
using UserManager.Application.Commands;
using UserManager.Domain.Enums;

namespace UserManager.Application.Validators;

public class UpdateAssetStatusCommandValidator : AbstractValidator<UpdateAssetStatusCommand>
{
    public UpdateAssetStatusCommandValidator()
    {
        RuleFor(x => x.AssetId).NotEmpty();
        RuleFor(x => x.NewStatus).NotEmpty()
            .Must(status => Enum.TryParse<AssetStatus>(status, true, out _))
            .WithMessage("Invalid asset status.");
        RuleFor(x => x.UpdatedBy).NotEmpty();
    }
}
