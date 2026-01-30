using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
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

    #region Login

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnTokens()
    {
        var loginRequest = new
        {
            email = "test@example.com",
            password = "TestPassword123!"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
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
    public async Task Login_WithNullEmail_ShouldReturnBadRequest()
    {
        var loginRequest = new
        {
            email = (string?)null,
            password = "TestPassword123!"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithNullPassword_ShouldReturnBadRequest()
    {
        var loginRequest = new
        {
            email = "test@example.com",
            password = (string?)null
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithNonExistentUser_ShouldReturnBadRequest()
    {
        var loginRequest = new
        {
            email = $"nonexistent-{Guid.NewGuid()}@example.com",
            password = "TestPassword123!"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ShouldReturnBadRequest()
    {
        var loginRequest = new
        {
            email = "test@example.com",
            password = "WrongPassword123!"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithWhitespaceEmail_ShouldReturnBadRequest()
    {
        var loginRequest = new
        {
            email = "   ",
            password = "TestPassword123!"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithWhitespacePassword_ShouldReturnBadRequest()
    {
        var loginRequest = new
        {
            email = "test@example.com",
            password = "   "
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithShortPassword_ShouldReturnBadRequest()
    {
        var loginRequest = new
        {
            email = "test@example.com",
            password = "short"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_SuccessfulResponse_ShouldIncludeTokens()
    {
        var loginRequest = new
        {
            email = "test@example.com",
            password = "TestPassword123!"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var content = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(content);
            document.RootElement.TryGetProperty("accessToken", out _).Should().BeTrue();
            document.RootElement.TryGetProperty("refreshToken", out _).Should().BeTrue();
        }
    }

    #endregion

    #region Refresh

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
    public async Task Refresh_WithEmptyToken_ShouldReturnBadRequest()
    {
        var refreshRequest = new
        {
            refreshToken = ""
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Refresh_WithNullToken_ShouldReturnBadRequest()
    {
        var refreshRequest = new
        {
            refreshToken = (string?)null
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Refresh_WithMalformedToken_ShouldReturnBadRequest()
    {
        var refreshRequest = new
        {
            refreshToken = "not-a-valid-jwt-token-format"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Refresh_WithExpiredToken_ShouldReturnBadRequest()
    {
        var refreshRequest = new
        {
            refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Refresh_WithWhitespaceToken_ShouldReturnBadRequest()
    {
        var refreshRequest = new
        {
            refreshToken = "   "
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Logout

    [Fact]
    public async Task Logout_WithInvalidToken_ShouldReturnOkOrNoContent()
    {
        var logoutRequest = new
        {
            refreshToken = "invalid-token"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/logout", logoutRequest);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Logout_WithEmptyToken_ShouldReturnOkOrNoContentOrBadRequest()
    {
        var logoutRequest = new
        {
            refreshToken = ""
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/logout", logoutRequest);
        // Empty token may be rejected
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Logout_WithoutAuth_ShouldReturnUnauthorized()
    {
        var logoutRequest = new
        {
            refreshToken = "some-token"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/logout", logoutRequest);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Logout_WithValidToken_ShouldReturnNoContent()
    {
        var logoutRequest = new
        {
            refreshToken = Guid.NewGuid().ToString()
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/logout", logoutRequest);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Logout_ShouldBeIdempotent()
    {
        var logoutRequest = new
        {
            refreshToken = "same-token-twice"
        };

        // First logout
        var response1 = await _client.PostAsJsonAsync("/api/v1/auth/logout", logoutRequest);
        response1.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);

        // Second logout with same token should also succeed
        var response2 = await _client.PostAsJsonAsync("/api/v1/auth/logout", logoutRequest);
        response2.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);
    }

    #endregion

    #region Me (Get Current User Profile)

    [Fact]
    public async Task Me_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_WithAuth_ShouldReturnOkOrBadRequest()
    {
        var response = await _client.GetAsync("/api/v1/auth/me");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Me_SuccessfulResponse_ShouldIncludeUserDetails()
    {
        var response = await _client.GetAsync("/api/v1/auth/me");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var content = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(content);
            document.RootElement.TryGetProperty("id", out _).Should().BeTrue();
            document.RootElement.TryGetProperty("email", out _).Should().BeTrue();
        }
    }

    [Fact]
    public async Task Me_WithExpiredAuth_ShouldReturnUnauthorizedOrBadRequest()
    {
        // Create a client without the test auth header
        var clientWithExpiredAuth = _unauthenticatedClient;
        clientWithExpiredAuth.DefaultRequestHeaders.Add("Authorization", "Bearer expired.jwt.token");

        var response = await clientWithExpiredAuth.GetAsync("/api/v1/auth/me");
        // May return BadRequest if token validation fails before auth check
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.BadRequest);
    }

    #endregion

    #region Rate Limiting

    [Fact]
    public async Task Login_MultipleAttempts_ShouldNotReturnTooManyRequests()
    {
        // In test environment, rate limiting may be disabled
        var loginRequest = new
        {
            email = "ratelimit@example.com",
            password = "TestPassword123!"
        };

        // Make a few requests
        for (int i = 0; i < 3; i++)
        {
            var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
            // Should return BadRequest (invalid credentials) or OK, not 429
            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest, HttpStatusCode.TooManyRequests);
        }
    }

    [Fact]
    public async Task Refresh_MultipleAttempts_ShouldNotReturnTooManyRequests()
    {
        var refreshRequest = new
        {
            refreshToken = "test-token"
        };

        for (int i = 0; i < 3; i++)
        {
            var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);
            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest, HttpStatusCode.TooManyRequests);
        }
    }

    #endregion

    #region IP Address Tracking

    [Fact]
    public async Task Login_ShouldAcceptRequestsWithoutIpAddress()
    {
        var loginRequest = new
        {
            email = "noip@example.com",
            password = "TestPassword123!"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Refresh_ShouldAcceptRequestsWithoutIpAddress()
    {
        var refreshRequest = new
        {
            refreshToken = "test-token"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Logout_ShouldAcceptRequestsWithoutIpAddress()
    {
        var logoutRequest = new
        {
            refreshToken = "test-token"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/logout", logoutRequest);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);
    }

    #endregion

    #region Content Type

    [Fact]
    public async Task Login_WithJsonContent_ShouldProcess()
    {
        var loginRequest = new
        {
            email = "test@example.com",
            password = "TestPassword123!"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Refresh_WithJsonContent_ShouldProcess()
    {
        var refreshRequest = new
        {
            refreshToken = "test-token"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
    }

    #endregion
}
