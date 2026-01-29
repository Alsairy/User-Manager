using MediatR;
using Microsoft.EntityFrameworkCore;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;
using UserManager.Domain.Events;

namespace UserManager.Application.Commands;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, Guid>
{
    private readonly IAppDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;

    public CreateUserCommandHandler(IAppDbContext dbContext, IPasswordHasher passwordHasher)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    public async Task<Guid> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var user = new User
        {
            Email = request.Email,
            FullName = request.FullName,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Status = UserStatus.Pending
        };

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            var role = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Name == request.Role, cancellationToken);
            if (role != null)
            {
                user.UserRoles.Add(new UserRole { User = user, Role = role });
            }
        }

        user.AddDomainEvent(new UserCreatedEvent(user.Id, user.Email, user.FullName));

        await _dbContext.Users.AddAsync(user, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return user.Id;
    }
}
