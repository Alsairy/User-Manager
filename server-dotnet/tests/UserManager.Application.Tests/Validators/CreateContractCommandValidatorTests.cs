using FluentValidation.TestHelper;
using UserManager.Application.Commands;
using UserManager.Application.Validators;

namespace UserManager.Application.Tests.Validators;

public class CreateContractCommandValidatorTests
{
    private readonly CreateContractCommandValidator _validator = new();

    [Fact]
    public void Validate_ValidCommand_ShouldPass()
    {
        var command = new CreateContractCommand(
            "CTR-001",
            "LAND-001",
            Guid.NewGuid(),
            Guid.NewGuid(),
            100000,
            15,
            5,
            DateOnly.FromDateTime(DateTime.Today),
            DateOnly.FromDateTime(DateTime.Today),
            DateOnly.FromDateTime(DateTime.Today.AddYears(5)));

        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_EmptyContractCode_ShouldFail()
    {
        var command = new CreateContractCommand(
            "",
            "LAND-001",
            Guid.NewGuid(),
            Guid.NewGuid(),
            100000,
            15,
            5,
            DateOnly.FromDateTime(DateTime.Today),
            DateOnly.FromDateTime(DateTime.Today),
            DateOnly.FromDateTime(DateTime.Today.AddYears(5)));

        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.ContractCode);
    }

    [Fact]
    public void Validate_NegativeAmount_ShouldFail()
    {
        var command = new CreateContractCommand(
            "CTR-001",
            "LAND-001",
            Guid.NewGuid(),
            Guid.NewGuid(),
            -100,
            15,
            5,
            DateOnly.FromDateTime(DateTime.Today),
            DateOnly.FromDateTime(DateTime.Today),
            DateOnly.FromDateTime(DateTime.Today.AddYears(5)));

        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.AnnualRentalAmount);
    }

    [Fact]
    public void Validate_EndDateBeforeStartDate_ShouldFail()
    {
        var command = new CreateContractCommand(
            "CTR-001",
            "LAND-001",
            Guid.NewGuid(),
            Guid.NewGuid(),
            100000,
            15,
            5,
            DateOnly.FromDateTime(DateTime.Today),
            DateOnly.FromDateTime(DateTime.Today.AddYears(1)),
            DateOnly.FromDateTime(DateTime.Today));

        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.StartDate);
    }
}
