using MediatR;
using Microsoft.EntityFrameworkCore;
using UserManager.Application.Interfaces;
using UserManager.Domain.Enums;
using UserManager.Domain.Events;

namespace UserManager.Application.Commands;

public class UpdateAssetStatusCommandHandler : IRequestHandler<UpdateAssetStatusCommand>
{
    private readonly IAppDbContext _dbContext;

    public UpdateAssetStatusCommandHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task Handle(UpdateAssetStatusCommand request, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == request.AssetId, cancellationToken)
            ?? throw new InvalidOperationException("Asset not found.");

        var oldStatus = asset.Status;
        if (!Enum.TryParse<AssetStatus>(request.NewStatus, true, out var newStatus))
        {
            throw new InvalidOperationException($"Invalid asset status: {request.NewStatus}");
        }

        asset.Status = newStatus;
        asset.UpdatedBy = request.UpdatedBy;
        asset.UpdatedAt = DateTimeOffset.UtcNow;

        if (newStatus == AssetStatus.InReview)
        {
            asset.SubmittedAt = DateTime.UtcNow;
            asset.AddDomainEvent(new AssetSubmittedEvent(asset.Id, asset.Code, request.UpdatedBy));
        }
        else if (newStatus == AssetStatus.Completed)
        {
            asset.CompletedAt = DateTime.UtcNow;
            asset.AddDomainEvent(new AssetApprovedEvent(asset.Id, asset.Code, request.UpdatedBy));
        }
        else if (newStatus == AssetStatus.Rejected)
        {
            asset.RejectionReason = request.Reason;
            asset.AddDomainEvent(new AssetRejectedEvent(asset.Id, asset.Code, request.UpdatedBy, request.Reason ?? ""));
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
