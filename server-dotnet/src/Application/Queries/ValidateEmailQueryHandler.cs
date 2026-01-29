using MediatR;
using Microsoft.EntityFrameworkCore;
using UserManager.Application.Interfaces;

namespace UserManager.Application.Queries;

public class ValidateEmailQueryHandler : IRequestHandler<ValidateEmailQuery, bool>
{
    private readonly IAppDbContext _dbContext;

    public ValidateEmailQueryHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(ValidateEmailQuery request, CancellationToken cancellationToken)
    {
        var exists = await _dbContext.Users.AnyAsync(u => u.Email == request.Email, cancellationToken);
        return !exists; // returns true if email is available
    }
}
