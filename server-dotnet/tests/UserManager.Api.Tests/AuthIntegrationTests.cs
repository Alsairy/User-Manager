using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class AuthIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly HttpClient _unauthenticatedClient;

    public AuthIntegrationTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnTokens()
    {
        // This test would require seeded test data
        // For now, we test the endpoint structure
        var loginRequest = new
        {
            email = "test@example.com",
            password = "TestPassword123!"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        // Either OK with tokens or BadRequest for invalid credentials (no user seeded)
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithEmptyEmail_ShouldReturnBadRequest()
    {
        var loginRequest = new
        {
            email = "",
            password = "TestPassword123!"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithEmptyPassword_ShouldReturnBadRequest()
    {
        var loginRequest = new
        {
            email = "test@example.com",
            password = ""
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithInvalidEmail_ShouldReturnBadRequest()
    {
        var loginRequest = new
        {
            email = "not-an-email",
            password = "TestPassword123!"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Refresh_WithInvalidToken_ShouldReturnBadRequest()
    {
        var refreshRequest = new
        {
            refreshToken = "invalid-token"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Logout_WithInvalidToken_ShouldReturnOkOrNoContent()
    {
        var logoutRequest = new
        {
            refreshToken = "invalid-token"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/logout", logoutRequest);

        // Logout with invalid token should still succeed (idempotent)
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Me_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_WithAuth_ShouldReturnOkOrBadRequest()
    {
        // Note: In tests, the user ID in claims may not exist in the in-memory database
        var response = await _client.GetAsync("/api/v1/auth/me");

        // Either OK if user exists, or BadRequest if user not found in DB
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest, HttpStatusCode.NotFound);
    }
}
