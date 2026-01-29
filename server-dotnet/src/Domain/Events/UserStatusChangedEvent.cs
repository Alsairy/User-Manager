namespace UserManager.Domain.Events;
public record UserStatusChangedEvent(Guid UserId, string OldStatus, string NewStatus) : IDomainEvent;
