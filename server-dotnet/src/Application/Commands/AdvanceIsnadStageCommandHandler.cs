using MediatR;
using Microsoft.EntityFrameworkCore;
using UserManager.Application.Interfaces;
using UserManager.Domain.Events;

namespace UserManager.Application.Commands;

public class AdvanceIsnadStageCommandHandler : IRequestHandler<AdvanceIsnadStageCommand>
{
    private readonly IAppDbContext _dbContext;

    public AdvanceIsnadStageCommandHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task Handle(AdvanceIsnadStageCommand request, CancellationToken cancellationToken)
    {
        var form = await _dbContext.IsnadForms.FirstOrDefaultAsync(f => f.Id == request.FormId, cancellationToken)
            ?? throw new InvalidOperationException("ISNAD form not found.");

        var oldStage = form.CurrentStage;
        form.CurrentStage = request.NewStage;
        form.CurrentAssigneeId = request.AssigneeId;
        form.CurrentStepIndex++;
        form.UpdatedAt = DateTimeOffset.UtcNow;
        form.SlaDeadline = DateTime.UtcNow.AddDays(5); // 5-day SLA per stage

        form.AddDomainEvent(new IsnadStageAdvancedEvent(form.Id, form.ReferenceNumber, oldStage, request.NewStage));

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
