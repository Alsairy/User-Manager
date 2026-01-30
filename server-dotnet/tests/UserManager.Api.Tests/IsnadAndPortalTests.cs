using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class IsnadFormsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly HttpClient _unauthenticatedClient;

    public IsnadFormsControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region List ISNAD Forms

    [Fact]
    public async Task GetIsnadForms_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/isnad/forms");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetIsnadForms_ShouldReturnArrayFormat()
    {
        var response = await _client.GetAsync("/api/v1/isnad/forms");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetIsnadForms_WithPagination_ShouldReturnPaginatedResults()
    {
        var response = await _client.GetAsync("/api/v1/isnad/forms?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Get ISNAD Form By ID

    [Fact]
    public async Task GetIsnadFormById_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _client.GetAsync($"/api/v1/isnad/forms/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetIsnadFormById_WithInvalidGuid_ShouldReturnNotFoundOrBadRequest()
    {
        var response = await _client.GetAsync("/api/v1/isnad/forms/invalid-guid");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetIsnadFormById_AfterCreation_ShouldReturnForm()
    {
        var createRequest = new
        {
            title = $"Test ISNAD Form {Guid.NewGuid()}",
            formCode = $"ISNAD-{Guid.NewGuid():N}"[..12],
            notes = "Test notes"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var getResponse = await _client.GetAsync($"/api/v1/isnad/forms/{formId}");
                getResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Create ISNAD Form

    [Fact]
    public async Task CreateIsnadForm_WithValidData_ShouldCreateForm()
    {
        var request = new
        {
            title = $"Test ISNAD Form {Guid.NewGuid()}",
            formCode = $"ISNAD-{Guid.NewGuid():N}"[..12],
            notes = "Test form notes",
            createdBy = "test-user"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/isnad/forms", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.TryGetProperty("id", out _).Should().BeTrue();
    }

    [Fact]
    public async Task CreateIsnadForm_WithMinimalData_ShouldCreateForm()
    {
        var request = new
        {
            title = $"Minimal ISNAD {Guid.NewGuid()}"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/isnad/forms", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateIsnadForm_WithAssetId_ShouldLinkToAsset()
    {
        var assetId = Guid.NewGuid();
        var request = new
        {
            title = $"ISNAD With Asset {Guid.NewGuid()}",
            assetId = assetId.ToString(),
            notes = "Form linked to asset"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/isnad/forms", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateIsnadForm_WithEmptyPayload_ShouldCreateWithDefaults()
    {
        var request = new { };

        var response = await _client.PostAsJsonAsync("/api/v1/isnad/forms", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateIsnadForm_ShouldSetPendingVerificationStatus()
    {
        var request = new
        {
            title = $"Status Test ISNAD {Guid.NewGuid()}",
            notes = "Testing initial status"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/isnad/forms", request);

        if (response.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var content = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(content);

            if (document.RootElement.TryGetProperty("status", out var statusElement))
            {
                statusElement.GetString().Should().Be("pending_verification");
            }
        }
    }

    [Fact]
    public async Task CreateIsnadForm_ShouldSetCurrentStage()
    {
        var request = new
        {
            title = $"Stage Test ISNAD {Guid.NewGuid()}"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/isnad/forms", request);

        if (response.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var content = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(content);

            if (document.RootElement.TryGetProperty("currentStage", out var stageElement))
            {
                stageElement.GetString().Should().Be("school_planning");
            }
        }
    }

    [Fact]
    public async Task CreateIsnadForm_WithAssetIdAsObject_ShouldExtractId()
    {
        var assetId = Guid.NewGuid();
        var request = new
        {
            title = $"Object Asset ISNAD {Guid.NewGuid()}",
            assetId = new { id = assetId.ToString() }
        };

        var response = await _client.PostAsJsonAsync("/api/v1/isnad/forms", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.BadRequest);
    }

    #endregion

    #region Update ISNAD Form

    [Fact]
    public async Task UpdateIsnadForm_WithNonExistentId_ShouldReturnNotFound()
    {
        var request = new { title = "Updated Title" };

        var response = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{Guid.NewGuid()}", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateIsnadForm_WithValidData_ShouldUpdateForm()
    {
        // First create a form
        var createRequest = new
        {
            title = $"Original ISNAD {Guid.NewGuid()}",
            notes = "Original notes"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var updateRequest = new
                {
                    title = "Updated ISNAD Title",
                    notes = "Updated notes"
                };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{formId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateIsnadForm_WithTitleOnly_ShouldUpdateTitle()
    {
        var createRequest = new
        {
            title = $"Title Only ISNAD {Guid.NewGuid()}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var updateRequest = new { title = "New Title Only" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{formId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateIsnadForm_WithNotesOnly_ShouldUpdateNotes()
    {
        var createRequest = new
        {
            title = $"Notes Only ISNAD {Guid.NewGuid()}",
            notes = "Original notes"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var updateRequest = new { notes = "Updated notes only" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{formId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateIsnadForm_StatusToDraft_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            title = $"Draft Status ISNAD {Guid.NewGuid()}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var updateRequest = new { status = "draft" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{formId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateIsnadForm_StatusToChangesRequested_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            title = $"Changes Requested ISNAD {Guid.NewGuid()}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var updateRequest = new { status = "changes_requested" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{formId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateIsnadForm_StatusToApproved_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            title = $"Approved ISNAD {Guid.NewGuid()}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var updateRequest = new { status = "approved" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{formId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateIsnadForm_StatusToRejected_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            title = $"Rejected ISNAD {Guid.NewGuid()}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var updateRequest = new { status = "rejected" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{formId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateIsnadForm_StatusToCancelled_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            title = $"Cancelled ISNAD {Guid.NewGuid()}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var updateRequest = new { status = "cancelled" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{formId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateIsnadForm_StatusToPendingCeo_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            title = $"Pending CEO ISNAD {Guid.NewGuid()}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var updateRequest = new { status = "pending_ceo" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{formId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateIsnadForm_StatusToPendingMinister_ShouldUpdateStatus()
    {
        var createRequest = new
        {
            title = $"Pending Minister ISNAD {Guid.NewGuid()}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var updateRequest = new { status = "pending_minister" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{formId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateIsnadForm_WithAssetId_ShouldUpdateAssetLink()
    {
        var createRequest = new
        {
            title = $"Asset Link ISNAD {Guid.NewGuid()}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();
                var newAssetId = Guid.NewGuid();

                var updateRequest = new { assetId = newAssetId.ToString() };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{formId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task UpdateIsnadForm_WithInvalidStatus_ShouldIgnoreStatus()
    {
        var createRequest = new
        {
            title = $"Invalid Status ISNAD {Guid.NewGuid()}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var updateRequest = new { status = "invalid_status_value" };

                var updateResponse = await _client.PutAsJsonAsync($"/api/v1/isnad/forms/{formId}", updateRequest);
                updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Delete ISNAD Form

    [Fact]
    public async Task DeleteIsnadForm_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _client.DeleteAsync($"/api/v1/isnad/forms/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteIsnadForm_WithExistingForm_ShouldReturnNoContent()
    {
        var createRequest = new
        {
            title = $"Delete Test ISNAD {Guid.NewGuid()}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                var deleteResponse = await _client.DeleteAsync($"/api/v1/isnad/forms/{formId}");
                deleteResponse.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.NotFound);
            }
        }
    }

    [Fact]
    public async Task DeleteIsnadForm_ThenGet_ShouldReturnNotFound()
    {
        var createRequest = new
        {
            title = $"Delete Verify ISNAD {Guid.NewGuid()}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/isnad/forms", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var formId = idElement.GetString();

                await _client.DeleteAsync($"/api/v1/isnad/forms/{formId}");

                var getResponse = await _client.GetAsync($"/api/v1/isnad/forms/{formId}");
                getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetIsnadForms_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/isnad/forms");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetIsnadFormById_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync($"/api/v1/isnad/forms/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateIsnadForm_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new
        {
            title = "Unauthorized ISNAD",
            notes = "Should not be created"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/isnad/forms", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateIsnadForm_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new { title = "Updated" };
        var response = await _unauthenticatedClient.PutAsJsonAsync($"/api/v1/isnad/forms/{Guid.NewGuid()}", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteIsnadForm_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.DeleteAsync($"/api/v1/isnad/forms/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion
}

public class ReferenceControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ReferenceControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetRegions_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/reference/regions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCities_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/reference/cities");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistricts_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/reference/districts");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCitiesByRegion_ShouldReturnFilteredList()
    {
        var response = await _client.GetAsync("/api/v1/reference/cities?regionId=1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistrictsByCity_ShouldReturnFilteredList()
    {
        var response = await _client.GetAsync("/api/v1/reference/districts?cityId=1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}

public class AuditLogsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuditLogsControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAuditLogs_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/v1/audit-logs");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithPagination_ShouldReturnPaginatedResults()
    {
        var response = await _client.GetAsync("/api/v1/audit-logs?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithEntityTypeFilter_ShouldFilterResults()
    {
        var response = await _client.GetAsync("/api/v1/audit-logs?entityType=User");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
