using FluentValidation;
using UserManager.Application.Commands;

namespace UserManager.Application.Validators;

public class AdvanceIsnadStageCommandValidator : AbstractValidator<AdvanceIsnadStageCommand>
{
    private static readonly HashSet<string> ValidStages = new(StringComparer.OrdinalIgnoreCase)
    {
        "school_planning", "pending_verification", "verification_due",
        "verified_filled", "investment_agency", "in_package",
        "pending_ceo", "pending_minister", "approved"
    };

    public AdvanceIsnadStageCommandValidator()
    {
        RuleFor(x => x.FormId).NotEmpty();
        RuleFor(x => x.NewStage).NotEmpty()
            .Must(stage => ValidStages.Contains(stage))
            .WithMessage("Invalid ISNAD stage.");
    }
}
