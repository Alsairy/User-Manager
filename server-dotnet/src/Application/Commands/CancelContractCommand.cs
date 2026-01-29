using MediatR;

namespace UserManager.Application.Commands;

public record CancelContractCommand(Guid ContractId, string Reason, string CancelledBy) : IRequest;
