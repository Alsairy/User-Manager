namespace UserManager.Domain.Events;
public record IsnadFormRejectedEvent(Guid FormId, string ReferenceNumber, string Reason) : IDomainEvent;
