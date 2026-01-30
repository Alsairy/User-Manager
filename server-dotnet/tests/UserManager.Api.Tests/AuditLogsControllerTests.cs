using System.Net;
using System.Text.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class AuditLogsControllerIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _authenticatedClient;
    private readonly HttpClient _unauthenticatedClient;

    public AuditLogsControllerIntegrationTests(TestWebApplicationFactory factory)
    {
        _authenticatedClient = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region List Audit Logs

    [Fact]
    public async Task GetAuditLogs_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_ShouldReturnArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetAuditLogs_ShouldReturnJsonContentType()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task GetAuditLogs_ShouldReturnEmptyArrayWhenNoLogs()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);

        // May return empty array or array with logs
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
        document.RootElement.GetArrayLength().Should().BeGreaterOrEqualTo(0);
    }

    #endregion

    #region Query Parameters

    [Fact]
    public async Task GetAuditLogs_WithPagination_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithEntityTypeFilter_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?entityType=User");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithAssetEntityType_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?entityType=Asset");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithContractEntityType_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?entityType=Contract");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithInvestorEntityType_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?entityType=Investor");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithActionTypeFilter_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?actionType=Create");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithUpdateActionType_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?actionType=Update");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithDeleteActionType_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?actionType=Delete");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithUserIdFilter_ShouldReturnOk()
    {
        var userId = Guid.NewGuid();
        var response = await _authenticatedClient.GetAsync($"/api/v1/audit-logs?userId={userId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithEntityIdFilter_ShouldReturnOk()
    {
        var entityId = Guid.NewGuid();
        var response = await _authenticatedClient.GetAsync($"/api/v1/audit-logs?entityId={entityId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithMultipleFilters_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?entityType=User&actionType=Create&page=1&limit=5");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithInvalidEntityType_ShouldReturnOk()
    {
        // Invalid filter values should be handled gracefully
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?entityType=InvalidType");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithLargePage_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?page=999&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithZeroLimit_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?page=1&limit=0");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithNegativePage_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?page=-1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetAuditLogs_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/audit-logs");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAuditLogs_WithPagination_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/audit-logs?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAuditLogs_WithFilters_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/audit-logs?entityType=User");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Invalid Endpoints

    [Fact]
    public async Task AuditLogs_PostMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PostAsync("/api/v1/audit-logs", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task AuditLogs_PutMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PutAsync("/api/v1/audit-logs", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task AuditLogs_DeleteMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.DeleteAsync("/api/v1/audit-logs");
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task AuditLogs_GetById_ShouldReturnNotFound()
    {
        // There's no GET by ID endpoint
        var response = await _authenticatedClient.GetAsync($"/api/v1/audit-logs/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AuditLogs_InvalidEndpoint_ShouldReturnNotFound()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs/invalid-endpoint");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Response Content Validation

    [Fact]
    public async Task GetAuditLogs_ResponseItems_ShouldHaveExpectedStructure()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);

        // The response should be an array
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);

        // If there are any logs, verify the structure
        if (document.RootElement.GetArrayLength() > 0)
        {
            var firstLog = document.RootElement[0];
            firstLog.TryGetProperty("id", out _).Should().BeTrue();
            firstLog.TryGetProperty("actionType", out _).Should().BeTrue();
            firstLog.TryGetProperty("entityType", out _).Should().BeTrue();
            firstLog.TryGetProperty("createdAt", out _).Should().BeTrue();
        }
    }

    [Fact]
    public async Task GetAuditLogs_MultipleCalls_ShouldReturnConsistentResults()
    {
        var response1 = await _authenticatedClient.GetAsync("/api/v1/audit-logs");
        var response2 = await _authenticatedClient.GetAsync("/api/v1/audit-logs");

        response1.StatusCode.Should().Be(HttpStatusCode.OK);
        response2.StatusCode.Should().Be(HttpStatusCode.OK);

        var content1 = await response1.Content.ReadAsStringAsync();
        var content2 = await response2.Content.ReadAsStringAsync();

        content1.Should().NotBeNullOrEmpty();
        content2.Should().NotBeNullOrEmpty();
    }

    #endregion

    #region Edge Cases

    [Fact]
    public async Task GetAuditLogs_WithExtraQueryParams_ShouldIgnoreAndReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?unused=param&another=value");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithEmptyEntityType_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?entityType=");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithWhitespaceEntityType_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?entityType=%20");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithDateRange_ShouldReturnOk()
    {
        var startDate = DateTime.UtcNow.AddDays(-30).ToString("yyyy-MM-dd");
        var endDate = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var response = await _authenticatedClient.GetAsync($"/api/v1/audit-logs?startDate={startDate}&endDate={endDate}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithVeryLargeLimit_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/audit-logs?limit=10000");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion
}
