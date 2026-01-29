namespace UserManager.Domain.Events;
public record AssetSubmittedEvent(Guid AssetId, string AssetCode, string SubmittedBy) : IDomainEvent;
