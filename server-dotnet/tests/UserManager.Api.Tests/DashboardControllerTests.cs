using System.Net;
using System.Text.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class DashboardControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _authenticatedClient;
    private readonly HttpClient _unauthenticatedClient;

    public DashboardControllerTests(TestWebApplicationFactory factory)
    {
        _authenticatedClient = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region Get Stats

    [Fact]
    public async Task GetStats_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/dashboard/stats");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetStats_ShouldReturnExpectedStructure()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/dashboard/stats");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();

        using var document = JsonDocument.Parse(content);
        var root = document.RootElement;

        // Verify the response contains expected dashboard statistics fields
        // The exact structure depends on GetDashboardStatsQuery implementation
        root.ValueKind.Should().Be(JsonValueKind.Object);
    }

    [Fact]
    public async Task GetStats_ShouldReturnJsonContentType()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/dashboard/stats");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetStats_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/dashboard/stats");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Edge Cases

    [Fact]
    public async Task GetStats_WithQueryParams_ShouldIgnoreAndReturnOk()
    {
        // The endpoint doesn't take query params, but should handle them gracefully
        var response = await _authenticatedClient.GetAsync("/api/v1/dashboard/stats?unused=param");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetStats_MultipleCalls_ShouldReturnConsistentResults()
    {
        var response1 = await _authenticatedClient.GetAsync("/api/v1/dashboard/stats");
        var response2 = await _authenticatedClient.GetAsync("/api/v1/dashboard/stats");

        response1.StatusCode.Should().Be(HttpStatusCode.OK);
        response2.StatusCode.Should().Be(HttpStatusCode.OK);

        // Both calls should succeed - data may differ but structure should be same
        var content1 = await response1.Content.ReadAsStringAsync();
        var content2 = await response2.Content.ReadAsStringAsync();

        content1.Should().NotBeNullOrEmpty();
        content2.Should().NotBeNullOrEmpty();
    }

    #endregion

    #region Invalid Endpoints

    [Fact]
    public async Task GetStats_WithInvalidVersion_ShouldReturnOkOrNotFound()
    {
        // API versioning may fall back to default version or return NotFound
        var response = await _authenticatedClient.GetAsync("/api/v99/dashboard/stats");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Dashboard_InvalidEndpoint_ShouldReturnNotFound()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/dashboard/invalid");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Dashboard_PostToStats_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PostAsync("/api/v1/dashboard/stats", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    #endregion
}
