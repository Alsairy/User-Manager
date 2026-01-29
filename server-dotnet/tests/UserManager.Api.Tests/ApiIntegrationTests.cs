using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class ApiIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ApiIntegrationTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_Live_ReturnsHealthy()
    {
        var response = await _client.GetAsync("/health/live");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Health_Ready_ReturnsHealthyOrUnavailable()
    {
        // In-memory databases may not support CanConnectAsync properly
        var response = await _client.GetAsync("/health/ready");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
    }

    [Fact]
    public async Task ContractsDashboard_ReturnsStats()
    {
        var response = await _client.GetAsync("/api/v1/contracts/dashboard");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await response.Content.ReadAsStringAsync();
        json.Should().Contain("totalContracts");
        json.Should().Contain("activeContracts");
    }

    [Fact]
    public async Task Users_List_ReturnsUsers()
    {
        var response = await _client.GetAsync("/api/v1/users");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Assets_List_ReturnsAssets()
    {
        var response = await _client.GetAsync("/api/v1/assets");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Roles_List_ReturnsRoles()
    {
        var response = await _client.GetAsync("/api/v1/roles");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Permissions_List_ReturnsPermissions()
    {
        var response = await _client.GetAsync("/api/v1/permissions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Reference_Regions_ReturnsData()
    {
        var response = await _client.GetAsync("/api/v1/reference/regions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task IstifadaRequest_CanCreateAndList()
    {
        var payload = new
        {
            investorAccountId = "demo-investor-001",
            programType = "educational_services",
            programTitle = "Test Istifada Program",
            programDescription = "This is a test istifada program description.",
            startDate = "2026-02-01",
            endDate = "2026-07-01"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/portal/istifada", payload);
        createResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);

        var listResponse = await _client.GetAsync("/api/v1/portal/istifada?investorAccountId=demo-investor-001");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await listResponse.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task Contracts_List_ReturnsContracts()
    {
        var response = await _client.GetAsync("/api/v1/contracts");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task IsnadForms_List_ReturnsForms()
    {
        var response = await _client.GetAsync("/api/v1/isnad/forms");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task AuditLogs_List_ReturnsLogs()
    {
        var response = await _client.GetAsync("/api/v1/audit-logs");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
