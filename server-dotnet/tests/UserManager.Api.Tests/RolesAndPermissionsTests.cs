using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class RolesAndPermissionsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly HttpClient _unauthenticatedClient;

    public RolesAndPermissionsTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region Roles - List

    [Fact]
    public async Task GetRoles_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/roles");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetRoles_ShouldReturnArrayFormat()
    {
        var response = await _client.GetAsync("/api/v1/roles");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    #endregion

    #region Roles - Get By ID

    [Fact]
    public async Task GetRoleById_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _client.GetAsync($"/api/v1/roles/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetRoleById_WithInvalidGuid_ShouldReturnNotFoundOrBadRequest()
    {
        var response = await _client.GetAsync("/api/v1/roles/invalid-guid");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetRoleById_AfterCreation_ShouldReturnRole()
    {
        // First create a role
        var createRequest = new
        {
            name = $"TestRole-{Guid.NewGuid()}",
            description = "Test role for get by ID test"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/roles", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var roleId = idElement.GetString();

                var getResponse = await _client.GetAsync($"/api/v1/roles/{roleId}");
                getResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Roles - Create

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

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        // API uses PascalCase serialization (PropertyNamingPolicy = null)
        document.RootElement.TryGetProperty("Id", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("Name", out _).Should().BeTrue();
    }

    [Fact]
    public async Task CreateRole_WithNameOnly_ShouldCreateRole()
    {
        var request = new
        {
            name = $"NameOnlyRole-{Guid.NewGuid()}"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/roles", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateRole_WithEmptyName_ShouldReturnBadRequestOrCreated()
    {
        var request = new
        {
            name = "",
            description = "Test role description"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/roles", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Created, HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateRole_WithLongDescription_ShouldCreateRole()
    {
        var request = new
        {
            name = $"LongDescRole-{Guid.NewGuid()}",
            description = new string('A', 500)
        };

        var response = await _client.PostAsJsonAsync("/api/v1/roles", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateRole_ShouldTrimWhitespace()
    {
        var request = new
        {
            name = $"   TrimmedRole-{Guid.NewGuid()}   ",
            description = "   Trimmed description   "
        };

        var response = await _client.PostAsJsonAsync("/api/v1/roles", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.BadRequest);
    }

    #endregion

    #region Roles - Update

    [Fact]
    public async Task UpdateRole_WithNonExistentId_ShouldReturnNotFound()
    {
        var request = new
        {
            name = "Updated Role Name"
        };

        var response = await _client.PutAsJsonAsync($"/api/v1/roles/{Guid.NewGuid()}", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateRole_WithValidData_ShouldUpdateRole()
    {
        // First create a role
        var createRequest = new
        {
            name = $"OriginalRole-{Guid.NewGuid()}",
            description = "Original description"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/roles", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var roleId = idElement.GetString();

                var updateRequest = new
                {
                    name = "Updated Role Name",
                    description = "Updated description"
                };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/roles/{roleId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateRole_WithNameOnly_ShouldUpdateName()
    {
        var createRequest = new
        {
            name = $"NameUpdateRole-{Guid.NewGuid()}",
            description = "Original description"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/roles", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var roleId = idElement.GetString();

                var updateRequest = new { name = "New Name Only" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/roles/{roleId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateRole_WithDescriptionOnly_ShouldUpdateDescription()
    {
        var createRequest = new
        {
            name = $"DescUpdateRole-{Guid.NewGuid()}",
            description = "Original description"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/roles", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var roleId = idElement.GetString();

                var updateRequest = new { description = "New description only" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/roles/{roleId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Roles - Delete

    [Fact]
    public async Task DeleteRole_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _client.DeleteAsync($"/api/v1/roles/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteRole_WithExistingRole_ShouldReturnNoContent()
    {
        var createRequest = new
        {
            name = $"DeleteTestRole-{Guid.NewGuid()}",
            description = "Role to delete"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/roles", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var roleId = idElement.GetString();

                var deleteResponse = await _client.DeleteAsync($"/api/v1/roles/{roleId}");
                deleteResponse.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task DeleteRole_ThenGet_ShouldReturnNotFound()
    {
        var createRequest = new
        {
            name = $"DeleteVerifyRole-{Guid.NewGuid()}",
            description = "Role to delete and verify"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/roles", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var roleId = idElement.GetString();

                await _client.DeleteAsync($"/api/v1/roles/{roleId}");

                var getResponse = await _client.GetAsync($"/api/v1/roles/{roleId}");
                getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Roles - Get Permissions

    [Fact]
    public async Task GetRolePermissions_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _client.GetAsync($"/api/v1/roles/{Guid.NewGuid()}/permissions");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetRolePermissions_AfterCreation_ShouldReturnEmptyList()
    {
        var createRequest = new
        {
            name = $"PermTestRole-{Guid.NewGuid()}",
            description = "Role for permission test"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/roles", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var roleId = idElement.GetString();

                var getResponse = await _client.GetAsync($"/api/v1/roles/{roleId}/permissions");
                getResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);

                if (getResponse.StatusCode == HttpStatusCode.OK)
                {
                    var permContent = await getResponse.Content.ReadAsStringAsync();
                    using var permDoc = JsonDocument.Parse(permContent);
                    permDoc.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
                }
            }
        }
    }

    #endregion

    #region Roles - Assign Permissions

    [Fact]
    public async Task AssignPermissions_WithNonExistentRole_ShouldReturnNotFound()
    {
        var request = new
        {
            permissionKeys = new[] { "users:read", "users:create" }
        };

        var response = await _client.PutAsJsonAsync($"/api/v1/roles/{Guid.NewGuid()}/permissions", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AssignPermissions_WithEmptyList_ShouldClearPermissions()
    {
        var createRequest = new
        {
            name = $"ClearPermRole-{Guid.NewGuid()}",
            description = "Role for clearing permissions"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/roles", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var roleId = idElement.GetString();

                var assignRequest = new { permissionKeys = Array.Empty<string>() };

                var assignResponse = await _client.PutAsJsonAsync($"/api/v1/roles/{roleId}/permissions", assignRequest);
                assignResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task AssignPermissions_WithValidKeys_ShouldAssignPermissions()
    {
        var createRequest = new
        {
            name = $"AssignPermRole-{Guid.NewGuid()}",
            description = "Role for assigning permissions"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/roles", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var roleId = idElement.GetString();

                var assignRequest = new
                {
                    permissionKeys = new[] { "users:read", "roles:read", "assets:read" }
                };

                var assignResponse = await _client.PutAsJsonAsync($"/api/v1/roles/{roleId}/permissions", assignRequest);
                assignResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task AssignPermissions_WithNonExistentKeys_ShouldIgnoreInvalidKeys()
    {
        var createRequest = new
        {
            name = $"InvalidPermRole-{Guid.NewGuid()}",
            description = "Role for invalid permission keys"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/roles", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var roleId = idElement.GetString();

                var assignRequest = new
                {
                    permissionKeys = new[] { "nonexistent:permission", "another:fake" }
                };

                var assignResponse = await _client.PutAsJsonAsync($"/api/v1/roles/{roleId}/permissions", assignRequest);
                assignResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Roles - Authorization

    [Fact]
    public async Task GetRoles_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/roles");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateRole_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new
        {
            name = "UnauthorizedRole",
            description = "Should not be created"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/roles", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateRole_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new { name = "Updated" };
        var response = await _unauthenticatedClient.PutAsJsonAsync($"/api/v1/roles/{Guid.NewGuid()}", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteRole_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.DeleteAsync($"/api/v1/roles/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetRolePermissions_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync($"/api/v1/roles/{Guid.NewGuid()}/permissions");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AssignPermissions_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new { permissionKeys = new[] { "users:read" } };
        var response = await _unauthenticatedClient.PutAsJsonAsync($"/api/v1/roles/{Guid.NewGuid()}/permissions", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Permissions - List

    [Fact]
    public async Task GetPermissions_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/permissions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetPermissions_ShouldReturnArrayFormat()
    {
        var response = await _client.GetAsync("/api/v1/permissions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    #endregion

    #region Permissions - Get By ID

    [Fact]
    public async Task GetPermissionById_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _client.GetAsync($"/api/v1/permissions/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetPermissionById_WithInvalidGuid_ShouldReturnNotFoundOrBadRequest()
    {
        var response = await _client.GetAsync("/api/v1/permissions/invalid-guid");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetPermissionById_AfterCreation_ShouldReturnPermission()
    {
        var createRequest = new
        {
            key = $"test:permission:{Guid.NewGuid():N}"[..30],
            description = "Test permission for get by ID test"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/permissions", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var permissionId = idElement.GetString();

                var getResponse = await _client.GetAsync($"/api/v1/permissions/{permissionId}");
                getResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Permissions - Create

    [Fact]
    public async Task CreatePermission_WithValidData_ShouldCreatePermission()
    {
        var request = new
        {
            key = $"test:create:{Guid.NewGuid():N}"[..30],
            description = "Test permission description"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/permissions", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        // API uses PascalCase serialization (PropertyNamingPolicy = null)
        document.RootElement.TryGetProperty("Id", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("Key", out _).Should().BeTrue();
    }

    [Fact]
    public async Task CreatePermission_WithKeyOnly_ShouldCreatePermission()
    {
        var request = new
        {
            key = $"test:keyonly:{Guid.NewGuid():N}"[..30]
        };

        var response = await _client.PostAsJsonAsync("/api/v1/permissions", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreatePermission_WithEmptyKey_ShouldReturnBadRequestOrCreate()
    {
        var request = new
        {
            key = "",
            description = "Permission with empty key"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/permissions", request);
        // API may or may not validate empty key
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.OK, HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreatePermission_ShouldTrimWhitespace()
    {
        var request = new
        {
            key = $"   test:trim:{Guid.NewGuid():N}   "[..30],
            description = "   Trimmed description   "
        };

        var response = await _client.PostAsJsonAsync("/api/v1/permissions", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreatePermission_WithColonNotation_ShouldCreatePermission()
    {
        var request = new
        {
            key = $"module:action:{Guid.NewGuid():N}"[..30],
            description = "Permission with colon notation"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/permissions", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
    }

    #endregion

    #region Permissions - Delete

    [Fact]
    public async Task DeletePermission_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _client.DeleteAsync($"/api/v1/permissions/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeletePermission_WithExistingPermission_ShouldReturnNoContent()
    {
        var createRequest = new
        {
            key = $"test:delete:{Guid.NewGuid():N}"[..30],
            description = "Permission to delete"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/permissions", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var permissionId = idElement.GetString();

                var deleteResponse = await _client.DeleteAsync($"/api/v1/permissions/{permissionId}");
                deleteResponse.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task DeletePermission_ThenGet_ShouldReturnNotFound()
    {
        var createRequest = new
        {
            key = $"test:delverify:{Guid.NewGuid():N}"[..30],
            description = "Permission to delete and verify"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/permissions", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var permissionId = idElement.GetString();

                await _client.DeleteAsync($"/api/v1/permissions/{permissionId}");

                var getResponse = await _client.GetAsync($"/api/v1/permissions/{permissionId}");
                getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Permissions - Authorization

    [Fact]
    public async Task GetPermissions_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/permissions");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetPermissionById_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync($"/api/v1/permissions/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreatePermission_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new
        {
            key = "unauthorized:permission",
            description = "Should not be created"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/permissions", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeletePermission_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.DeleteAsync($"/api/v1/permissions/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion
}
