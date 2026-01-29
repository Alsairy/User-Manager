using MediatR;

namespace UserManager.Application.Commands;

public record AdvanceIsnadStageCommand(Guid FormId, string NewStage, string? AssigneeId) : IRequest;
