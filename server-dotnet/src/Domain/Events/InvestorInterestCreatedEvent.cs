namespace UserManager.Domain.Events;
public record InvestorInterestCreatedEvent(Guid InterestId, string ReferenceNumber, Guid AssetId) : IDomainEvent;
