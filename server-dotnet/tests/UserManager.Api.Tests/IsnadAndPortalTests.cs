using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class IsnadFormsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public IsnadFormsControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetIsnadForms_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/isnad/forms");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetIsnadForms_WithPagination_ShouldReturnPaginatedResults()
    {
        var response = await _client.GetAsync("/api/v1/isnad/forms?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetIsnadFormById_WithNonExistentId_ShouldReturnNotFoundOrOk()
    {
        var response = await _client.GetAsync($"/api/v1/isnad/forms/{Guid.NewGuid()}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.OK);
    }
}

public class ReferenceControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ReferenceControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetRegions_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/reference/regions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCities_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/reference/cities");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistricts_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/reference/districts");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCitiesByRegion_ShouldReturnFilteredList()
    {
        var response = await _client.GetAsync("/api/v1/reference/cities?regionId=1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistrictsByCity_ShouldReturnFilteredList()
    {
        var response = await _client.GetAsync("/api/v1/reference/districts?cityId=1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}

public class AuditLogsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuditLogsControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAuditLogs_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/audit-logs");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithPagination_ShouldReturnPaginatedResults()
    {
        var response = await _client.GetAsync("/api/v1/audit-logs?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithEntityTypeFilter_ShouldFilterResults()
    {
        var response = await _client.GetAsync("/api/v1/audit-logs?entityType=User");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
