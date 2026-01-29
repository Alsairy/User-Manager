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

    [Fact]
    public void Asset_ShouldGenerateId()
    {
        var asset = new Asset();
        asset.Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public void Asset_ShouldStoreAllProperties()
    {
        var asset = new Asset
        {
            Name = "Test Asset",
            NameAr = "أصل اختبار",
            AssetType = "Commercial",
            TotalArea = 1000,
            RegionId = "1",
            CityId = "2",
            DistrictId = "3",
            StreetAddress = "123 Test St",
            DeedNumber = "D-12345",
            Code = "AST-001",
            Status = AssetStatus.InReview,
            VisibleToInvestors = false,
            Description = "Test description"
        };

        asset.Name.Should().Be("Test Asset");
        asset.NameAr.Should().Be("أصل اختبار");
        asset.AssetType.Should().Be("Commercial");
        asset.TotalArea.Should().Be(1000);
        asset.RegionId.Should().Be("1");
        asset.CityId.Should().Be("2");
        asset.DistrictId.Should().Be("3");
        asset.StreetAddress.Should().Be("123 Test St");
        asset.DeedNumber.Should().Be("D-12345");
        asset.Code.Should().Be("AST-001");
        asset.Status.Should().Be(AssetStatus.InReview);
        asset.VisibleToInvestors.Should().BeFalse();
        asset.Description.Should().Be("Test description");
    }

    [Theory]
    [InlineData(AssetStatus.Draft)]
    [InlineData(AssetStatus.InReview)]
    [InlineData(AssetStatus.Completed)]
    [InlineData(AssetStatus.Rejected)]
    [InlineData(AssetStatus.IncompleteBulk)]
    public void Asset_ShouldSupportAllStatuses(AssetStatus status)
    {
        var asset = new Asset { Status = status };
        asset.Status.Should().Be(status);
    }
}
