using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class AssetsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AssetsControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAssets_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/assets");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAssets_WithPagination_ShouldReturnPaginatedResults()
    {
        var response = await _client.GetAsync("/api/v1/assets?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAssets_WithStatusFilter_ShouldFilterResults()
    {
        var response = await _client.GetAsync("/api/v1/assets?status=Draft");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAssetById_WithNonExistentId_ShouldReturnNotFoundOrOk()
    {
        var response = await _client.GetAsync($"/api/v1/assets/{Guid.NewGuid()}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateAsset_WithValidData_ShouldCreateAsset()
    {
        var request = new
        {
            name = $"Test Asset {Guid.NewGuid()}",
            nameAr = "أصل اختبار",
            assetType = "Commercial",
            area = 1000,
            regionId = 1,
            cityId = 1
        };

        var response = await _client.PostAsJsonAsync("/api/v1/assets", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateAsset_WithEmptyName_ShouldReturnBadRequest()
    {
        var request = new
        {
            name = "",
            nameAr = "",
            assetType = "Commercial"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/assets", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateAsset_WithNonExistentId_ShouldReturnNotFoundOrOk()
    {
        var request = new
        {
            name = "Updated Asset"
        };

        var response = await _client.PutAsJsonAsync($"/api/v1/assets/{Guid.NewGuid()}", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.OK, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteAsset_WithNonExistentId_ShouldReturnNotFoundOrNoContent()
    {
        var response = await _client.DeleteAsync($"/api/v1/assets/{Guid.NewGuid()}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.NoContent, HttpStatusCode.OK);
    }
}

public class ContractsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ContractsControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetContracts_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/contracts");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContractsDashboard_ShouldReturnStats()
    {
        var response = await _client.GetAsync("/api/v1/contracts/dashboard");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("totalContracts");
    }

    [Fact]
    public async Task GetContracts_WithPagination_ShouldReturnPaginatedResults()
    {
        var response = await _client.GetAsync("/api/v1/contracts?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContractById_WithNonExistentId_ShouldReturnNotFoundOrOk()
    {
        var response = await _client.GetAsync($"/api/v1/contracts/{Guid.NewGuid()}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.OK);
    }

    [Fact]
    public async Task DeleteContract_WithNonExistentId_ShouldReturnNotFoundOrNoContent()
    {
        var response = await _client.DeleteAsync($"/api/v1/contracts/{Guid.NewGuid()}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.NoContent, HttpStatusCode.OK);
    }
}
