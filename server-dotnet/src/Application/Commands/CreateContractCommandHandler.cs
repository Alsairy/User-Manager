using MediatR;
using Microsoft.EntityFrameworkCore;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;
using UserManager.Domain.Events;

namespace UserManager.Application.Commands;

public class CreateContractCommandHandler : IRequestHandler<CreateContractCommand, Guid>
{
    private readonly IAppDbContext _dbContext;

    public CreateContractCommandHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Guid> Handle(CreateContractCommand request, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == request.AssetId, cancellationToken)
            ?? throw new InvalidOperationException("Asset not found.");
        var investor = await _dbContext.Investors.FirstOrDefaultAsync(i => i.Id == request.InvestorId, cancellationToken)
            ?? throw new InvalidOperationException("Investor not found.");

        var totalAnnual = request.AnnualRentalAmount * (1 + request.VatRate / 100m);

        var contract = new Contract
        {
            ContractCode = request.ContractCode,
            LandCode = request.LandCode,
            AssetId = request.AssetId,
            InvestorId = request.InvestorId,
            AssetNameEn = asset.Name,
            AssetNameAr = asset.NameAr,
            InvestorNameEn = investor.NameEn,
            InvestorNameAr = investor.NameAr,
            AnnualRentalAmount = request.AnnualRentalAmount,
            VatRate = request.VatRate,
            TotalAnnualAmount = totalAnnual,
            ContractDuration = request.ContractDuration,
            TotalContractAmount = totalAnnual * request.ContractDuration,
            SigningDate = request.SigningDate,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = ContractStatus.Draft
        };

        contract.AddDomainEvent(new ContractCreatedEvent(contract.Id, contract.ContractCode, contract.AssetId, contract.InvestorId));

        await _dbContext.Contracts.AddAsync(contract, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return contract.Id;
    }
}
