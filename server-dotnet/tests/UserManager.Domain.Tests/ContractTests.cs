using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Domain.Tests;

public class ContractTests
{
    [Fact]
    public void NewContract_ShouldHaveDraftStatus()
    {
        var contract = new Contract();
        contract.Status.Should().Be(ContractStatus.Draft);
    }

    [Fact]
    public void NewContract_ShouldHaveDefaultCurrency()
    {
        var contract = new Contract();
        contract.Currency.Should().Be("SAR");
    }

    [Fact]
    public void NewContract_ShouldHaveEmptyInstallments()
    {
        var contract = new Contract();
        contract.Installments.Should().BeEmpty();
    }

    [Fact]
    public void Contract_ShouldGenerateId()
    {
        var contract = new Contract();
        contract.Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public void Contract_ShouldStoreAllProperties()
    {
        var assetId = Guid.NewGuid();
        var investorId = Guid.NewGuid();
        var startDate = DateOnly.FromDateTime(DateTime.Today);
        var endDate = DateOnly.FromDateTime(DateTime.Today.AddYears(1));

        var contract = new Contract
        {
            ContractCode = "CTR-001",
            AssetId = assetId,
            InvestorId = investorId,
            AnnualRentalAmount = 50000m,
            TotalContractAmount = 100000m,
            StartDate = startDate,
            EndDate = endDate,
            Currency = "USD",
            Status = ContractStatus.Active,
            Notes = "Test contract"
        };

        contract.ContractCode.Should().Be("CTR-001");
        contract.AssetId.Should().Be(assetId);
        contract.InvestorId.Should().Be(investorId);
        contract.AnnualRentalAmount.Should().Be(50000m);
        contract.TotalContractAmount.Should().Be(100000m);
        contract.StartDate.Should().Be(startDate);
        contract.EndDate.Should().Be(endDate);
        contract.Currency.Should().Be("USD");
        contract.Status.Should().Be(ContractStatus.Active);
        contract.Notes.Should().Be("Test contract");
    }

    [Theory]
    [InlineData(ContractStatus.Draft)]
    [InlineData(ContractStatus.Active)]
    [InlineData(ContractStatus.Completed)]
    [InlineData(ContractStatus.Cancelled)]
    [InlineData(ContractStatus.Expiring)]
    [InlineData(ContractStatus.Expired)]
    public void Contract_ShouldSupportAllStatuses(ContractStatus status)
    {
        var contract = new Contract { Status = status };
        contract.Status.Should().Be(status);
    }

    [Fact]
    public void Contract_ShouldCalculateDuration()
    {
        var contract = new Contract
        {
            StartDate = DateOnly.FromDateTime(DateTime.Today),
            EndDate = DateOnly.FromDateTime(DateTime.Today.AddMonths(12))
        };

        var duration = contract.EndDate.DayNumber - contract.StartDate.DayNumber;
        duration.Should().BeGreaterThan(0);
    }
}
