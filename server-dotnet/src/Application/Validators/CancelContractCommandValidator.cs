using FluentValidation;
using UserManager.Application.Commands;

namespace UserManager.Application.Validators;

public class CancelContractCommandValidator : AbstractValidator<CancelContractCommand>
{
    public CancelContractCommandValidator()
    {
        RuleFor(x => x.ContractId).NotEmpty();
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.CancelledBy).NotEmpty();
    }
}
