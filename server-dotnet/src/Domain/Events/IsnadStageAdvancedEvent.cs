namespace UserManager.Domain.Events;
public record IsnadStageAdvancedEvent(Guid FormId, string ReferenceNumber, string OldStage, string NewStage) : IDomainEvent;
