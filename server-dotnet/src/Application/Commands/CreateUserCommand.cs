using MediatR;

namespace UserManager.Application.Commands;

public record CreateUserCommand(string Email, string FullName, string Password, string? Role) : IRequest<Guid>;
