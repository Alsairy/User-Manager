namespace UserManager.Domain.Events;
public record AssetApprovedEvent(Guid AssetId, string AssetCode, string ApprovedBy) : IDomainEvent;
