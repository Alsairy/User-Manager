using FluentValidation;
using UserManager.Application.Commands;

namespace UserManager.Application.Validators;

public class CreateContractCommandValidator : AbstractValidator<CreateContractCommand>
{
    public CreateContractCommandValidator()
    {
        RuleFor(x => x.ContractCode).NotEmpty().MaximumLength(64);
        RuleFor(x => x.LandCode).NotEmpty().MaximumLength(64);
        RuleFor(x => x.AssetId).NotEmpty();
        RuleFor(x => x.InvestorId).NotEmpty();
        RuleFor(x => x.AnnualRentalAmount).GreaterThan(0);
        RuleFor(x => x.VatRate).InclusiveBetween(0, 100);
        RuleFor(x => x.ContractDuration).GreaterThan(0);
        RuleFor(x => x.StartDate).LessThan(x => x.EndDate).WithMessage("Start date must be before end date.");
    }
}
