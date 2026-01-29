namespace UserManager.Domain.Events;
public record ContractActivatedEvent(Guid ContractId, string ContractCode) : IDomainEvent;
