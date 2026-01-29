namespace UserManager.Domain.Events;
public record AssetRejectedEvent(Guid AssetId, string AssetCode, string RejectedBy, string Reason) : IDomainEvent;
