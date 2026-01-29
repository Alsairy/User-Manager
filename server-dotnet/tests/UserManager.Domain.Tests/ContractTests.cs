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
}
