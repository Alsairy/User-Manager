namespace UserManager.Domain.Events;
public record InstallmentOverdueEvent(Guid InstallmentId, Guid ContractId, int InstallmentNumber, decimal Amount) : IDomainEvent;
