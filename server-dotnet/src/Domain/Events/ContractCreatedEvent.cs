namespace UserManager.Domain.Events;
public record ContractCreatedEvent(Guid ContractId, string ContractCode, Guid AssetId, Guid InvestorId) : IDomainEvent;
