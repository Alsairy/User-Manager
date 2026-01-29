using MediatR;

namespace UserManager.Application.Queries;

public record ValidateEmailQuery(string Email) : IRequest<bool>;
