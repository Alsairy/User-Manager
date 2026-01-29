namespace UserManager.Domain.Events;
public record IsnadFormApprovedEvent(Guid FormId, string ReferenceNumber) : IDomainEvent;
