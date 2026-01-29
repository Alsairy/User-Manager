using MediatR;

namespace UserManager.Application.Commands;

public record DeleteUserCommand(Guid UserId) : IRequest<bool>;
