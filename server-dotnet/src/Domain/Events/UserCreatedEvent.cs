namespace UserManager.Domain.Events;
public record UserCreatedEvent(Guid UserId, string Email, string FullName) : IDomainEvent;
