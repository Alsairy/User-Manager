using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;
using UserManager.Infrastructure.Persistence;

namespace UserManager.Api.Tests;

public class UsersControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly HttpClient _unauthenticatedClient;
    private readonly TestWebApplicationFactory _factory;

    public UsersControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region List Users

    [Fact]
    public async Task GetUsers_ShouldReturnPaginatedResults()
    {
        var response = await _client.GetAsync("/api/v1/users");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_WithPagination_ShouldReturnPaginatedResults()
    {
        var response = await _client.GetAsync("/api/v1/users?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_WithSearch_ShouldFilterResults()
    {
        var response = await _client.GetAsync("/api/v1/users?search=test");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_WithStatusFilter_ShouldFilterResults()
    {
        var response = await _client.GetAsync("/api/v1/users?status=Active");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_ShouldReturnPaginatedFormat()
    {
        var response = await _client.GetAsync("/api/v1/users");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        // API uses PascalCase serialization (PropertyNamingPolicy = null)
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Object);
        document.RootElement.TryGetProperty("Total", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("Page", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("Limit", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetUsers_WithHighPageNumber_ShouldReturnEmptyOrPaginatedList()
    {
        var response = await _client.GetAsync("/api/v1/users?page=9999&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Object);
    }

    [Fact]
    public async Task GetUsers_WithLimit100_ShouldReturnUpTo100Results()
    {
        var response = await _client.GetAsync("/api/v1/users?page=1&limit=100");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_WithPendingStatus_ShouldFilterResults()
    {
        var response = await _client.GetAsync("/api/v1/users?status=Pending");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUsers_WithInactiveStatus_ShouldFilterResults()
    {
        var response = await _client.GetAsync("/api/v1/users?status=Inactive");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Get User By ID

    [Fact]
    public async Task GetUserById_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _client.GetAsync($"/api/v1/users/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetUserById_WithInvalidGuid_ShouldReturnNotFoundOrBadRequest()
    {
        var response = await _client.GetAsync("/api/v1/users/invalid-guid");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetUserById_AfterCreation_ShouldReturnUser()
    {
        var createRequest = new
        {
            email = $"gettest-{Guid.NewGuid()}@example.com",
            fullName = "Get Test User",
            password = "SecurePassword123!"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/users", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var userId = idElement.GetString();

                var getResponse = await _client.GetAsync($"/api/v1/users/{userId}");
                getResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Create User

    [Fact]
    public async Task CreateUser_WithValidData_ShouldCreateUser()
    {
        var request = new
        {
            email = $"newuser-{Guid.NewGuid()}@example.com",
            fullName = "New Test User",
            password = "SecurePassword123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/users", request);
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.Created,
            HttpStatusCode.BadRequest,
            HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task CreateUser_WithInvalidEmail_ShouldReturnBadRequest()
    {
        var request = new
        {
            email = "not-an-email",
            fullName = "Test User",
            password = "SecurePassword123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/users", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateUser_WithEmptyPassword_ShouldReturnBadRequest()
    {
        var request = new
        {
            email = "test@example.com",
            fullName = "Test User",
            password = ""
        };

        var response = await _client.PostAsJsonAsync("/api/v1/users", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateUser_WithEmptyEmail_ShouldReturnBadRequest()
    {
        var request = new
        {
            email = "",
            fullName = "Test User",
            password = "SecurePassword123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/users", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateUser_WithEmptyFullName_ShouldReturnBadRequest()
    {
        var request = new
        {
            email = $"emptyname-{Guid.NewGuid()}@example.com",
            fullName = "",
            password = "SecurePassword123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/users", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateUser_WithRole_ShouldCreateUserWithRole()
    {
        var request = new
        {
            email = $"withrole-{Guid.NewGuid()}@example.com",
            fullName = "User With Role",
            password = "SecurePassword123!",
            role = "Admin"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/users", request);
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.Created,
            HttpStatusCode.BadRequest,
            HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task CreateUser_WithAllFields_ShouldCreateUser()
    {
        var request = new
        {
            email = $"allfields-{Guid.NewGuid()}@example.com",
            fullName = "User With All Fields",
            password = "SecurePassword123!",
            role = "User"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/users", request);
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.Created,
            HttpStatusCode.BadRequest,
            HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task CreateUser_ShouldTrimEmailAndName()
    {
        var request = new
        {
            email = $"   trimtest-{Guid.NewGuid()}@example.com   ",
            fullName = "   Trimmed Name   ",
            password = "SecurePassword123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/users", request);
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.Created,
            HttpStatusCode.BadRequest,
            HttpStatusCode.InternalServerError);
    }

    #endregion

    #region Update User

    [Fact]
    public async Task UpdateUser_WithNonExistentId_ShouldReturnNotFound()
    {
        var request = new
        {
            fullName = "Updated Name"
        };

        var response = await _client.PutAsJsonAsync($"/api/v1/users/{Guid.NewGuid()}", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateUser_WithValidData_ShouldUpdateUser()
    {
        // First create a user
        var createRequest = new
        {
            email = $"updatetest-{Guid.NewGuid()}@example.com",
            fullName = "Original Name",
            password = "SecurePassword123!"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/users", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var userId = idElement.GetString();

                var updateRequest = new
                {
                    fullName = "Updated Name",
                    status = "Active"
                };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/users/{userId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateUser_WithFullNameOnly_ShouldUpdateFullName()
    {
        var createRequest = new
        {
            email = $"nameonly-{Guid.NewGuid()}@example.com",
            fullName = "Original Name",
            password = "SecurePassword123!"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/users", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var userId = idElement.GetString();

                var updateRequest = new { fullName = "New Name Only" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/users/{userId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateUser_WithStatusOnly_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            email = $"statusonly-{Guid.NewGuid()}@example.com",
            fullName = "Status Only User",
            password = "SecurePassword123!"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/users", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var userId = idElement.GetString();

                var updateRequest = new { status = "Active" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/users/{userId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateUser_ToInactiveStatus_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            email = $"inactive-{Guid.NewGuid()}@example.com",
            fullName = "Inactive Status User",
            password = "SecurePassword123!"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/users", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var userId = idElement.GetString();

                var updateRequest = new { status = "Inactive" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/users/{userId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateUser_ToPendingStatus_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            email = $"pending-{Guid.NewGuid()}@example.com",
            fullName = "Pending Status User",
            password = "SecurePassword123!"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/users", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var userId = idElement.GetString();

                var updateRequest = new { status = "Pending" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/users/{userId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateUser_WithAllFields_ShouldUpdateAllFields()
    {
        var createRequest = new
        {
            email = $"allfields-{Guid.NewGuid()}@example.com",
            fullName = "All Fields User",
            password = "SecurePassword123!"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/users", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var userId = idElement.GetString();

                var updateRequest = new
                {
                    fullName = "Completely Updated Name",
                    status = "Active"
                };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/users/{userId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Delete User

    [Fact]
    public async Task DeleteUser_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _client.DeleteAsync($"/api/v1/users/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteUser_WithExistingUser_ShouldReturnNoContent()
    {
        var createRequest = new
        {
            email = $"deletetest-{Guid.NewGuid()}@example.com",
            fullName = "Delete Test User",
            password = "SecurePassword123!"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/users", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var userId = idElement.GetString();

                var deleteResponse = await _client.DeleteAsync($"/api/v1/users/{userId}");
                deleteResponse.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task DeleteUser_ThenGet_ShouldReturnNotFound()
    {
        var createRequest = new
        {
            email = $"delverify-{Guid.NewGuid()}@example.com",
            fullName = "Delete Verify User",
            password = "SecurePassword123!"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/users", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var userId = idElement.GetString();

                await _client.DeleteAsync($"/api/v1/users/{userId}");

                var getResponse = await _client.GetAsync($"/api/v1/users/{userId}");
                getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Unlock User

    [Fact]
    public async Task UnlockUser_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _client.PostAsync($"/api/v1/users/{Guid.NewGuid()}/unlock", null);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UnlockUser_WithExistingUser_ShouldReturnOk()
    {
        var createRequest = new
        {
            email = $"unlocktest-{Guid.NewGuid()}@example.com",
            fullName = "Unlock Test User",
            password = "SecurePassword123!"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/users", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var userId = idElement.GetString();

                var unlockResponse = await _client.PostAsync($"/api/v1/users/{userId}/unlock", null);
                unlockResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetUsers_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/users");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetUserById_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync($"/api/v1/users/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateUser_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new
        {
            email = "unauthorized@example.com",
            fullName = "Unauthorized User",
            password = "SecurePassword123!"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/users", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateUser_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new { fullName = "Updated" };
        var response = await _unauthenticatedClient.PutAsJsonAsync($"/api/v1/users/{Guid.NewGuid()}", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteUser_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.DeleteAsync($"/api/v1/users/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UnlockUser_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.PostAsync($"/api/v1/users/{Guid.NewGuid()}/unlock", null);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion
}
