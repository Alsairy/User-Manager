using MediatR;
using Microsoft.EntityFrameworkCore;
using UserManager.Application.Interfaces;
using UserManager.Domain.Enums;
using UserManager.Domain.Events;

namespace UserManager.Application.Commands;

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, bool>
{
    private readonly IAppDbContext _dbContext;

    public UpdateUserCommandHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user is null)
        {
            return false;
        }

        var previousStatus = user.Status;

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            user.FullName = request.FullName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Status) &&
            Enum.TryParse<UserStatus>(request.Status, true, out var newStatus))
        {
            user.Status = newStatus;

            if (previousStatus != newStatus)
            {
                user.AddDomainEvent(new UserStatusChangedEvent(user.Id, previousStatus.ToString(), newStatus.ToString()));
            }
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
