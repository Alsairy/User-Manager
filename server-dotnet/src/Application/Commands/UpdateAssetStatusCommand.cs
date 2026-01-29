using MediatR;

namespace UserManager.Application.Commands;

public record UpdateAssetStatusCommand(Guid AssetId, string NewStatus, string? Reason, string UpdatedBy) : IRequest;
