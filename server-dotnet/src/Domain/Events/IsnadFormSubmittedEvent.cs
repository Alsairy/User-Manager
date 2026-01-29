namespace UserManager.Domain.Events;
public record IsnadFormSubmittedEvent(Guid FormId, string ReferenceNumber, Guid? AssetId) : IDomainEvent;
