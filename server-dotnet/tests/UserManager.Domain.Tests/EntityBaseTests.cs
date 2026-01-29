using UserManager.Domain.Common;
using UserManager.Domain.Events;

namespace UserManager.Domain.Tests;

public class EntityBaseTests
{
    private class TestEntity : EntityBase { }

    [Fact]
    public void NewEntity_ShouldHaveId()
    {
        var entity = new TestEntity();
        entity.Id.Should().NotBeEmpty();
    }

    [Fact]
    public void NewEntity_ShouldHaveCreatedAt()
    {
        var before = DateTimeOffset.UtcNow;
        var entity = new TestEntity();
        var after = DateTimeOffset.UtcNow;

        entity.CreatedAt.Should().BeOnOrAfter(before);
        entity.CreatedAt.Should().BeOnOrBefore(after);
    }

    [Fact]
    public void NewEntity_ShouldHaveNullUpdatedAt()
    {
        var entity = new TestEntity();
        entity.UpdatedAt.Should().BeNull();
    }

    [Fact]
    public void AddDomainEvent_ShouldAddEvent()
    {
        var entity = new TestEntity();
        var evt = new UserCreatedEvent(Guid.NewGuid(), "test@test.com", "Test User");

        entity.AddDomainEvent(evt);

        entity.DomainEvents.Should().ContainSingle();
        entity.DomainEvents[0].Should().Be(evt);
    }

    [Fact]
    public void ClearDomainEvents_ShouldRemoveAllEvents()
    {
        var entity = new TestEntity();
        entity.AddDomainEvent(new UserCreatedEvent(Guid.NewGuid(), "test@test.com", "Test"));
        entity.AddDomainEvent(new UserStatusChangedEvent(Guid.NewGuid(), "Pending", "Active"));

        entity.ClearDomainEvents();

        entity.DomainEvents.Should().BeEmpty();
    }
}
