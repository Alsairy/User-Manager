using System.Net;
using System.Text.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class NotificationsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _authenticatedClient;
    private readonly HttpClient _unauthenticatedClient;

    public NotificationsControllerTests(TestWebApplicationFactory factory)
    {
        _authenticatedClient = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region Get Notifications

    [Fact]
    public async Task GetNotifications_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/notifications");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetNotifications_ShouldReturnPaginatedResults()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/notifications?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);

        document.RootElement.TryGetProperty("data", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("total", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("unreadCount", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("page", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("limit", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetNotifications_WithUnreadOnlyFilter_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/notifications?unreadOnly=true");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetNotifications_WithUnreadOnlyFalse_ShouldReturnAll()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/notifications?unreadOnly=false");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetNotifications_WithPagination_ShouldRespectLimits()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/notifications?page=1&limit=5");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);

        var data = document.RootElement.GetProperty("data");
        data.GetArrayLength().Should().BeLessOrEqualTo(5);
    }

    [Fact]
    public async Task GetNotifications_Page2_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/notifications?page=2&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Mark as Read

    [Fact]
    public async Task MarkAsRead_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _authenticatedClient.PutAsync($"/api/v1/notifications/{Guid.NewGuid()}/read", null);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task MarkAsRead_WithInvalidGuid_ShouldReturnNotFoundOrBadRequest()
    {
        var response = await _authenticatedClient.PutAsync("/api/v1/notifications/invalid-guid/read", null);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
    }

    #endregion

    #region Mark All as Read

    [Fact]
    public async Task MarkAllAsRead_ShouldReturnNoContent()
    {
        var response = await _authenticatedClient.PutAsync("/api/v1/notifications/read-all", null);
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task MarkAllAsRead_WhenNoUnread_ShouldStillReturnNoContent()
    {
        // Call twice - second time there should be no unread notifications
        await _authenticatedClient.PutAsync("/api/v1/notifications/read-all", null);
        var response = await _authenticatedClient.PutAsync("/api/v1/notifications/read-all", null);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetNotifications_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/notifications");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task MarkAsRead_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.PutAsync($"/api/v1/notifications/{Guid.NewGuid()}/read", null);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task MarkAllAsRead_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.PutAsync("/api/v1/notifications/read-all", null);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Invalid Endpoints

    [Fact]
    public async Task Notifications_PostToGet_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PostAsync("/api/v1/notifications", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task Notifications_DeleteNotification_ShouldReturnMethodNotAllowedOrNotFound()
    {
        // Delete is not a supported method - returns MethodNotAllowed or NotFound
        var response = await _authenticatedClient.DeleteAsync($"/api/v1/notifications/{Guid.NewGuid()}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.MethodNotAllowed, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Notifications_GetInvalidEndpoint_ShouldReturnNotFound()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/notifications/invalid-endpoint");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
    }

    #endregion

    #region Response Content Validation

    [Fact]
    public async Task GetNotifications_ShouldReturnJsonContentType()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/notifications");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task GetNotifications_DataShouldBeArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/notifications");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);

        var data = document.RootElement.GetProperty("data");
        data.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetNotifications_TotalAndUnreadCountShouldBeNumbers()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/notifications");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);

        document.RootElement.GetProperty("total").ValueKind.Should().Be(JsonValueKind.Number);
        document.RootElement.GetProperty("unreadCount").ValueKind.Should().Be(JsonValueKind.Number);
    }

    #endregion
}
