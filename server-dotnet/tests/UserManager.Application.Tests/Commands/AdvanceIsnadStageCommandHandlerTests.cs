using Microsoft.EntityFrameworkCore;
using Moq;
using UserManager.Application.Commands;
using UserManager.Application.Interfaces;
using UserManager.Application.Tests.Helpers;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;
using UserManager.Domain.Events;

namespace UserManager.Application.Tests.Commands;

public class AdvanceIsnadStageCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly AdvanceIsnadStageCommandHandler _handler;

    public AdvanceIsnadStageCommandHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _handler = new AdvanceIsnadStageCommandHandler(_dbContextMock.Object);
    }

    [Fact]
    public async Task Handle_ExistingForm_ShouldAdvanceStage()
    {
        // Arrange
        var formId = Guid.NewGuid();
        var form = new IsnadForm
        {
            Id = formId,
            Title = "Test Form",
            ReferenceNumber = "REF-001",
            CurrentStage = "school_planning",
            CurrentStepIndex = 0,
            Status = IsnadStatus.PendingVerification
        };
        var forms = new List<IsnadForm> { form };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockDbSet.Object);

        var command = new AdvanceIsnadStageCommand(formId, "land_review", "assignee-123");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        form.CurrentStage.Should().Be("land_review");
        form.CurrentAssigneeId.Should().Be("assignee-123");
        form.CurrentStepIndex.Should().Be(1);
        form.UpdatedAt.Should().NotBeNull();
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ExistingForm_ShouldSetSlaDeadline()
    {
        // Arrange
        var formId = Guid.NewGuid();
        var form = new IsnadForm
        {
            Id = formId,
            Title = "Test Form",
            ReferenceNumber = "REF-002",
            CurrentStage = "school_planning",
            CurrentStepIndex = 0,
            Status = IsnadStatus.PendingVerification
        };
        var forms = new List<IsnadForm> { form };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockDbSet.Object);

        var beforeCall = DateTime.UtcNow;
        var command = new AdvanceIsnadStageCommand(formId, "land_review", null);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var afterCall = DateTime.UtcNow;
        form.SlaDeadline.Should().NotBeNull();
        // SLA deadline should be 5 days from now
        form.SlaDeadline.Should().BeOnOrAfter(beforeCall.AddDays(5).AddSeconds(-1));
        form.SlaDeadline.Should().BeOnOrBefore(afterCall.AddDays(5).AddSeconds(1));
    }

    [Fact]
    public async Task Handle_ExistingForm_ShouldRaiseDomainEvent()
    {
        // Arrange
        var formId = Guid.NewGuid();
        var form = new IsnadForm
        {
            Id = formId,
            Title = "Test Form",
            ReferenceNumber = "REF-003",
            CurrentStage = "school_planning",
            CurrentStepIndex = 0,
            Status = IsnadStatus.PendingVerification
        };
        var forms = new List<IsnadForm> { form };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockDbSet.Object);

        var command = new AdvanceIsnadStageCommand(formId, "land_review", "assignee-456");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        form.DomainEvents.Should().ContainSingle();
        var domainEvent = form.DomainEvents.First() as IsnadStageAdvancedEvent;
        domainEvent.Should().NotBeNull();
        domainEvent!.FormId.Should().Be(formId);
        domainEvent.ReferenceNumber.Should().Be("REF-003");
        domainEvent.OldStage.Should().Be("school_planning");
        domainEvent.NewStage.Should().Be("land_review");
    }

    [Fact]
    public async Task Handle_FormNotFound_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var formId = Guid.NewGuid();
        var forms = new List<IsnadForm>();

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockDbSet.Object);

        var command = new AdvanceIsnadStageCommand(formId, "land_review", null);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("ISNAD form not found.");
    }

    [Fact]
    public async Task Handle_WithNullAssignee_ShouldSetAssigneeToNull()
    {
        // Arrange
        var formId = Guid.NewGuid();
        var form = new IsnadForm
        {
            Id = formId,
            Title = "Test Form",
            ReferenceNumber = "REF-004",
            CurrentStage = "school_planning",
            CurrentStepIndex = 0,
            CurrentAssigneeId = "old-assignee",
            Status = IsnadStatus.PendingVerification
        };
        var forms = new List<IsnadForm> { form };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockDbSet.Object);

        var command = new AdvanceIsnadStageCommand(formId, "land_review", null);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        form.CurrentAssigneeId.Should().BeNull();
    }

    [Fact]
    public async Task Handle_MultipleStageAdvancements_ShouldIncrementStepIndex()
    {
        // Arrange
        var formId = Guid.NewGuid();
        var form = new IsnadForm
        {
            Id = formId,
            Title = "Test Form",
            ReferenceNumber = "REF-005",
            CurrentStage = "school_planning",
            CurrentStepIndex = 2,
            Status = IsnadStatus.PendingVerification
        };
        var forms = new List<IsnadForm> { form };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockDbSet.Object);

        var command = new AdvanceIsnadStageCommand(formId, "approval", "assignee-789");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        form.CurrentStepIndex.Should().Be(3);
    }

    [Fact]
    public async Task Handle_ShouldSetUpdatedAtToCurrentTime()
    {
        // Arrange
        var formId = Guid.NewGuid();
        var form = new IsnadForm
        {
            Id = formId,
            Title = "Test Form",
            ReferenceNumber = "REF-006",
            CurrentStage = "school_planning",
            CurrentStepIndex = 0,
            Status = IsnadStatus.PendingVerification
        };
        var forms = new List<IsnadForm> { form };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockDbSet.Object);

        var beforeCall = DateTimeOffset.UtcNow;
        var command = new AdvanceIsnadStageCommand(formId, "land_review", null);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var afterCall = DateTimeOffset.UtcNow;
        form.UpdatedAt.Should().NotBeNull();
        form.UpdatedAt.Should().BeOnOrAfter(beforeCall);
        form.UpdatedAt.Should().BeOnOrBefore(afterCall);
    }

    [Theory]
    [InlineData("school_planning", "land_review")]
    [InlineData("land_review", "finance_review")]
    [InlineData("finance_review", "director_approval")]
    [InlineData("director_approval", "final_approval")]
    public async Task Handle_VariousStageTransitions_ShouldAdvanceCorrectly(string oldStage, string newStage)
    {
        // Arrange
        var formId = Guid.NewGuid();
        var form = new IsnadForm
        {
            Id = formId,
            Title = "Test Form",
            ReferenceNumber = "REF-007",
            CurrentStage = oldStage,
            CurrentStepIndex = 0,
            Status = IsnadStatus.PendingVerification
        };
        var forms = new List<IsnadForm> { form };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockDbSet.Object);

        var command = new AdvanceIsnadStageCommand(formId, newStage, "assignee");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        form.CurrentStage.Should().Be(newStage);
        var domainEvent = form.DomainEvents.First() as IsnadStageAdvancedEvent;
        domainEvent!.OldStage.Should().Be(oldStage);
        domainEvent.NewStage.Should().Be(newStage);
    }

    [Fact]
    public async Task Handle_ShouldSaveChanges()
    {
        // Arrange
        var formId = Guid.NewGuid();
        var form = new IsnadForm
        {
            Id = formId,
            Title = "Test Form",
            ReferenceNumber = "REF-008",
            CurrentStage = "school_planning",
            CurrentStepIndex = 0,
            Status = IsnadStatus.PendingVerification
        };
        var forms = new List<IsnadForm> { form };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockDbSet.Object);

        var command = new AdvanceIsnadStageCommand(formId, "land_review", null);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_DifferentFormId_ShouldThrowException()
    {
        // Arrange
        var existingFormId = Guid.NewGuid();
        var requestedFormId = Guid.NewGuid();
        var form = new IsnadForm
        {
            Id = existingFormId,
            Title = "Test Form",
            ReferenceNumber = "REF-009",
            CurrentStage = "school_planning",
            CurrentStepIndex = 0,
            Status = IsnadStatus.PendingVerification
        };
        var forms = new List<IsnadForm> { form };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockDbSet.Object);

        var command = new AdvanceIsnadStageCommand(requestedFormId, "land_review", null);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("ISNAD form not found.");
    }

    [Fact]
    public async Task Handle_SlaDeadline_ShouldBeFiveDaysFromNow()
    {
        // Arrange
        var formId = Guid.NewGuid();
        var form = new IsnadForm
        {
            Id = formId,
            Title = "Test Form",
            ReferenceNumber = "REF-010",
            CurrentStage = "school_planning",
            CurrentStepIndex = 0,
            Status = IsnadStatus.PendingVerification
        };
        var forms = new List<IsnadForm> { form };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockDbSet.Object);

        var command = new AdvanceIsnadStageCommand(formId, "land_review", null);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var expectedDeadline = DateTime.UtcNow.AddDays(5);
        form.SlaDeadline.Should().NotBeNull();
        form.SlaDeadline!.Value.Should().BeCloseTo(expectedDeadline, TimeSpan.FromSeconds(5));
    }
}
