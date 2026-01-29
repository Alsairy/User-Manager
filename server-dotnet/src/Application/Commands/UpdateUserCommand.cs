using MediatR;

namespace UserManager.Application.Commands;

public record UpdateUserCommand(
    Guid UserId,
    string? FullName,
    string? Status) : IRequest<bool>;
