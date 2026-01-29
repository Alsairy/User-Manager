using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Domain.Tests;

public class AssetTests
{
    [Fact]
    public void NewAsset_ShouldHaveDefaultStatus()
    {
        var asset = new Asset();
        asset.Status.Should().Be(AssetStatus.Draft);
    }

    [Fact]
    public void NewAsset_ShouldHaveEmptyCollections()
    {
        var asset = new Asset();
        asset.Features.Should().BeEmpty();
        asset.Attachments.Should().BeEmpty();
        asset.OwnershipDocuments.Should().BeEmpty();
        asset.VerifiedBy.Should().BeEmpty();
    }

    [Fact]
    public void NewAsset_ShouldBeVisibleToInvestorsByDefault()
    {
        var asset = new Asset();
        asset.VisibleToInvestors.Should().BeTrue();
    }

    [Fact]
    public void NewAsset_ShouldHaveDefaultAssetType()
    {
        var asset = new Asset();
        asset.AssetType.Should().Be("land");
    }
}
