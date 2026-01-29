using MediatR;
using Microsoft.EntityFrameworkCore;
using UserManager.Application.Interfaces;
using UserManager.Domain.Enums;
using UserManager.Domain.Events;

namespace UserManager.Application.Commands;

public class CancelContractCommandHandler : IRequestHandler<CancelContractCommand>
{
    private readonly IAppDbContext _dbContext;

    public CancelContractCommandHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task Handle(CancelContractCommand request, CancellationToken cancellationToken)
    {
        var contract = await _dbContext.Contracts.FirstOrDefaultAsync(c => c.Id == request.ContractId, cancellationToken)
            ?? throw new InvalidOperationException("Contract not found.");

        contract.Status = ContractStatus.Cancelled;
        contract.CancelledAt = DateTime.UtcNow;
        contract.CancelledBy = request.CancelledBy;
        contract.CancellationJustification = request.Reason;
        contract.UpdatedAt = DateTimeOffset.UtcNow;

        contract.AddDomainEvent(new ContractCancelledEvent(contract.Id, contract.ContractCode, request.Reason));

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
