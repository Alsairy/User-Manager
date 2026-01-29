namespace UserManager.Domain.Events;
public record IstifadaRequestCreatedEvent(Guid RequestId, string ReferenceNumber, Guid? AssetId) : IDomainEvent;
