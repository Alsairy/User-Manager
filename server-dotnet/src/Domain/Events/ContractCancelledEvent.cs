namespace UserManager.Domain.Events;
public record ContractCancelledEvent(Guid ContractId, string ContractCode, string Reason) : IDomainEvent;
