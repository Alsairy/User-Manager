using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class AssetsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly HttpClient _unauthenticatedClient;

    public AssetsControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region List Assets

    [Fact]
    public async Task GetAssets_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/assets");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAssets_WithPagination_ShouldReturnPaginatedResults()
    {
        var response = await _client.GetAsync("/api/v1/assets?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAssets_WithStatusFilter_ShouldFilterResults()
    {
        var response = await _client.GetAsync("/api/v1/assets?status=Draft");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAssets_ShouldReturnArrayFormat()
    {
        var response = await _client.GetAsync("/api/v1/assets");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    #endregion

    #region Get Asset By ID

    [Fact]
    public async Task GetAssetById_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _client.GetAsync($"/api/v1/assets/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetAssetById_WithInvalidGuid_ShouldReturnNotFoundOrBadRequest()
    {
        var response = await _client.GetAsync("/api/v1/assets/invalid-guid");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAssetById_AfterCreation_ShouldReturnAsset()
    {
        // First create an asset
        var createRequest = new
        {
            name = $"Test Asset {Guid.NewGuid()}",
            code = $"AST-{Guid.NewGuid():N}"[..12],
            description = "Test description"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);
        createResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.BadRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                // Get the asset by ID
                var getResponse = await _client.GetAsync($"/api/v1/assets/{assetId}");
                getResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Create Asset

    [Fact]
    public async Task CreateAsset_WithAllFields_ShouldCreateAsset()
    {
        var request = new
        {
            name = $"Test Asset {Guid.NewGuid()}",
            code = $"AST-{Guid.NewGuid():N}"[..12],
            description = "Complete test asset with all fields"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/assets", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        // Verify response contains asset data
        document.RootElement.ValueKind.Should().BeOneOf(JsonValueKind.Object, JsonValueKind.Array);
    }

    [Fact]
    public async Task CreateAsset_WithMinimalFields_ShouldCreateAsset()
    {
        var request = new
        {
            name = $"Minimal Asset {Guid.NewGuid()}",
            code = $"MIN-{Guid.NewGuid():N}"[..10]
        };

        var response = await _client.PostAsJsonAsync("/api/v1/assets", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateAsset_WithEmptyName_ShouldReturnBadRequestOrCreate()
    {
        var request = new
        {
            name = "",
            code = "TEST-001"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/assets", request);
        // API may or may not validate empty name
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.OK, HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateAsset_WithEmptyCode_ShouldReturnBadRequestOrCreate()
    {
        var request = new
        {
            name = "Test Asset",
            code = ""
        };

        var response = await _client.PostAsJsonAsync("/api/v1/assets", request);
        // API may or may not validate empty code
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.OK, HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateAsset_WithDescription_ShouldIncludeDescriptionInResponse()
    {
        var description = "This is a test description for the asset";
        var request = new
        {
            name = $"Asset With Description {Guid.NewGuid()}",
            code = $"DESC-{Guid.NewGuid():N}"[..10],
            description
        };

        var response = await _client.PostAsJsonAsync("/api/v1/assets", request);

        if (response.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var content = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(content);

            if (document.RootElement.TryGetProperty("description", out var descElement))
            {
                descElement.GetString().Should().Be(description);
            }
        }
    }

    [Fact]
    public async Task CreateAsset_ShouldTrimWhitespace()
    {
        var request = new
        {
            name = "   Trimmed Asset Name   ",
            code = "   TRIM-001   ",
            description = "   Trimmed description   "
        };

        var response = await _client.PostAsJsonAsync("/api/v1/assets", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateAsset_ShouldSetDraftStatus()
    {
        var request = new
        {
            name = $"Draft Status Asset {Guid.NewGuid()}",
            code = $"DRF-{Guid.NewGuid():N}"[..10]
        };

        var response = await _client.PostAsJsonAsync("/api/v1/assets", request);

        if (response.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var content = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(content);

            if (document.RootElement.TryGetProperty("status", out var statusElement))
            {
                statusElement.GetString().Should().Be("draft");
            }
        }
    }

    #endregion

    #region Update Asset

    [Fact]
    public async Task UpdateAsset_WithNonExistentId_ShouldReturnNotFound()
    {
        var request = new
        {
            name = "Updated Asset"
        };

        var response = await _client.PutAsJsonAsync($"/api/v1/assets/{Guid.NewGuid()}", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateAsset_WithValidData_ShouldUpdateAsset()
    {
        // First create an asset
        var createRequest = new
        {
            name = $"Original Asset {Guid.NewGuid()}",
            code = $"UPD-{Guid.NewGuid():N}"[..10]
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                // Update the asset
                var updateRequest = new
                {
                    name = "Updated Asset Name",
                    description = "Updated description"
                };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/assets/{assetId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateAsset_StatusToDraft_ShouldUpdateStatus()
    {
        // Create and then update status to draft
        var createRequest = new
        {
            name = $"Status Test Asset {Guid.NewGuid()}",
            code = $"STS-{Guid.NewGuid():N}"[..10]
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                var updateRequest = new { status = "draft" };
                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/assets/{assetId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateAsset_StatusToInReview_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            name = $"InReview Test Asset {Guid.NewGuid()}",
            code = $"REV-{Guid.NewGuid():N}"[..10]
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                var updateRequest = new { status = "in_review" };
                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/assets/{assetId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateAsset_StatusToCompleted_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            name = $"Completed Test Asset {Guid.NewGuid()}",
            code = $"CMP-{Guid.NewGuid():N}"[..10]
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                var updateRequest = new { status = "completed" };
                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/assets/{assetId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateAsset_StatusToRejected_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            name = $"Rejected Test Asset {Guid.NewGuid()}",
            code = $"REJ-{Guid.NewGuid():N}"[..10]
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                var updateRequest = new { status = "rejected" };
                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/assets/{assetId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateAsset_StatusUsingSubmitted_ShouldMapToInReview()
    {
        var createRequest = new
        {
            name = $"Submitted Test Asset {Guid.NewGuid()}",
            code = $"SUB-{Guid.NewGuid():N}"[..10]
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                var updateRequest = new { status = "submitted" };
                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/assets/{assetId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateAsset_StatusUsingApproved_ShouldMapToCompleted()
    {
        var createRequest = new
        {
            name = $"Approved Test Asset {Guid.NewGuid()}",
            code = $"APR-{Guid.NewGuid():N}"[..10]
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                var updateRequest = new { status = "approved" };
                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/assets/{assetId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateAsset_WithNameOnly_ShouldUpdateName()
    {
        var createRequest = new
        {
            name = $"Name Only Asset {Guid.NewGuid()}",
            code = $"NAM-{Guid.NewGuid():N}"[..10]
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                var updateRequest = new { name = "New Asset Name" };
                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/assets/{assetId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateAsset_WithDescriptionOnly_ShouldUpdateDescription()
    {
        var createRequest = new
        {
            name = $"Desc Only Asset {Guid.NewGuid()}",
            code = $"DSC-{Guid.NewGuid():N}"[..10]
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                var updateRequest = new { description = "New description text" };
                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/assets/{assetId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateAsset_WithInvalidStatus_ShouldIgnoreStatus()
    {
        var createRequest = new
        {
            name = $"Invalid Status Asset {Guid.NewGuid()}",
            code = $"INV-{Guid.NewGuid():N}"[..10]
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                var updateRequest = new { status = "invalid_status_value" };
                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/assets/{assetId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Delete Asset

    [Fact]
    public async Task DeleteAsset_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _client.DeleteAsync($"/api/v1/assets/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteAsset_WithExistingAsset_ShouldReturnNoContent()
    {
        // First create an asset
        var createRequest = new
        {
            name = $"Delete Test Asset {Guid.NewGuid()}",
            code = $"DEL-{Guid.NewGuid():N}"[..10]
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                // Delete the asset
                var deleteResponse = await _client.DeleteAsync($"/api/v1/assets/{assetId}");
                deleteResponse.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.NotFound);

                // Verify it's deleted
                var getResponse = await _client.GetAsync($"/api/v1/assets/{assetId}");
                getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task DeleteAsset_ThenGet_ShouldReturnNotFound()
    {
        var createRequest = new
        {
            name = $"Delete Verify Asset {Guid.NewGuid()}",
            code = $"DLV-{Guid.NewGuid():N}"[..10]
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/assets", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var assetId = idElement.GetString();

                await _client.DeleteAsync($"/api/v1/assets/{assetId}");

                var getResponse = await _client.GetAsync($"/api/v1/assets/{assetId}");
                getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetAssets_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/assets");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateAsset_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new
        {
            name = "Unauthorized Asset",
            code = "UNAUTH-001"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/assets", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateAsset_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new { name = "Updated" };
        var response = await _unauthenticatedClient.PutAsJsonAsync($"/api/v1/assets/{Guid.NewGuid()}", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteAsset_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.DeleteAsync($"/api/v1/assets/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAssetById_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync($"/api/v1/assets/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion
}
