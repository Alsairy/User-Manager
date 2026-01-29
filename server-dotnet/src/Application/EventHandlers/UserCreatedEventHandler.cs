using MediatR;
using Microsoft.Extensions.Logging;
using UserManager.Application.Interfaces;
using UserManager.Domain.Events;

namespace UserManager.Application.EventHandlers;

public class UserCreatedEventHandler : INotificationHandler<UserCreatedEvent>
{
    private readonly IEmailService _emailService;
    private readonly ILogger<UserCreatedEventHandler> _logger;

    public UserCreatedEventHandler(IEmailService emailService, ILogger<UserCreatedEventHandler> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Handle(UserCreatedEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Handling UserCreatedEvent for {Email}", notification.Email);

        await _emailService.SendTemplatedAsync(
            notification.Email,
            "UserInvitation",
            new { notification.Email, notification.FullName },
            cancellationToken);
    }
}
