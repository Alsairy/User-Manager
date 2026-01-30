using UserManager.Infrastructure.Services;

namespace UserManager.Application.Tests.Services;

public class DateTimeProviderTests
{
    private readonly DateTimeProvider _dateTimeProvider;

    public DateTimeProviderTests()
    {
        _dateTimeProvider = new DateTimeProvider();
    }

    [Fact]
    public void UtcNow_ShouldReturnValidDateTimeOffset()
    {
        // Act
        var result = _dateTimeProvider.UtcNow;

        // Assert
        result.Should().NotBe(default(DateTimeOffset));
    }

    [Fact]
    public void UtcNow_ShouldReturnCurrentTime()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow;

        // Act
        var result = _dateTimeProvider.UtcNow;
        var after = DateTimeOffset.UtcNow;

        // Assert
        result.Should().BeOnOrAfter(before);
        result.Should().BeOnOrBefore(after);
    }

    [Fact]
    public void UtcNow_ShouldReturnUtcTime()
    {
        // Act
        var result = _dateTimeProvider.UtcNow;

        // Assert
        result.Offset.Should().Be(TimeSpan.Zero);
    }

    [Fact]
    public void UtcNow_CalledTwice_ShouldReturnIncreasingOrEqualTimes()
    {
        // Act
        var first = _dateTimeProvider.UtcNow;
        var second = _dateTimeProvider.UtcNow;

        // Assert
        second.Should().BeOnOrAfter(first);
    }

    [Fact]
    public void UtcNow_ShouldBeReasonablyAccurate()
    {
        // Arrange
        var systemUtcNow = DateTimeOffset.UtcNow;

        // Act
        var result = _dateTimeProvider.UtcNow;

        // Assert - should be within 1 second of system time
        var difference = (result - systemUtcNow).Duration();
        difference.Should().BeLessThan(TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void UtcNow_ShouldHaveValidYear()
    {
        // Act
        var result = _dateTimeProvider.UtcNow;

        // Assert
        result.Year.Should().BeGreaterThanOrEqualTo(2024);
        result.Year.Should().BeLessThanOrEqualTo(2100);
    }
}
