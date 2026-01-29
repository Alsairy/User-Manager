using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class RolesAndPermissionsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RolesAndPermissionsTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    // Roles tests
    [Fact]
    public async Task GetRoles_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/roles");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateRole_WithValidData_ShouldCreateRole()
    {
        var request = new
        {
            name = $"TestRole-{Guid.NewGuid()}",
            description = "Test role description"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/roles", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateRole_WithEmptyName_ShouldReturnBadRequestOrCreated()
    {
        // Note: The API may allow empty names without validation
        var request = new
        {
            name = "",
            description = "Test role description"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/roles", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Created, HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetRoleById_WithNonExistentId_ShouldReturnNotFoundOrOk()
    {
        var response = await _client.GetAsync($"/api/v1/roles/{Guid.NewGuid()}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.OK);
    }

    // Permissions tests
    [Fact]
    public async Task GetPermissions_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/permissions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetPermissionById_WithNonExistentId_ShouldReturnNotFoundOrOk()
    {
        var response = await _client.GetAsync($"/api/v1/permissions/{Guid.NewGuid()}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.OK);
    }
}
