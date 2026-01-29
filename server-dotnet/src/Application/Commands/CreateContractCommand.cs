using MediatR;

namespace UserManager.Application.Commands;

public record CreateContractCommand(
    string ContractCode,
    string LandCode,
    Guid AssetId,
    Guid InvestorId,
    decimal AnnualRentalAmount,
    int VatRate,
    int ContractDuration,
    DateOnly SigningDate,
    DateOnly StartDate,
    DateOnly EndDate) : IRequest<Guid>;
