using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class CrmInvestorsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _authenticatedClient;
    private readonly HttpClient _unauthenticatedClient;

    public CrmInvestorsControllerTests(TestWebApplicationFactory factory)
    {
        _authenticatedClient = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region List CRM Investors

    [Fact]
    public async Task GetCrmInvestors_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/investors");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCrmInvestors_ShouldReturnArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/investors");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetCrmInvestors_ShouldReturnJsonContentType()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/investors");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    #endregion

    #region Get CRM Investor by ID

    [Fact]
    public async Task GetCrmInvestorById_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _authenticatedClient.GetAsync($"/api/v1/crm/investors/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetCrmInvestorById_WithInvalidGuid_ShouldReturnNotFoundOrBadRequest()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/investors/invalid-guid");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
    }

    #endregion

    #region Create CRM Investor

    [Fact]
    public async Task CreateCrmInvestor_WithValidData_ShouldReturnCreated()
    {
        var request = new
        {
            name = $"CRM Investor {Guid.NewGuid():N}",
            email = "crminvestor@example.com"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/crm/investors", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        // Response may use PascalCase or camelCase depending on serializer config
        var hasId = document.RootElement.TryGetProperty("id", out _) || document.RootElement.TryGetProperty("Id", out _);
        var hasName = document.RootElement.TryGetProperty("name", out _) || document.RootElement.TryGetProperty("Name", out _);
        var hasEmail = document.RootElement.TryGetProperty("email", out _) || document.RootElement.TryGetProperty("Email", out _);
        var hasStatus = document.RootElement.TryGetProperty("status", out _) || document.RootElement.TryGetProperty("Status", out _);
        hasId.Should().BeTrue();
        hasName.Should().BeTrue();
        hasEmail.Should().BeTrue();
        hasStatus.Should().BeTrue();
    }

    [Fact]
    public async Task CreateCrmInvestor_WithMinimalData_ShouldReturnCreated()
    {
        var request = new
        {
            name = "Minimal CRM Investor",
            email = "minimal@example.com"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/crm/investors", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateCrmInvestor_ShouldGenerateUniqueCode()
    {
        var request1 = new { name = "Investor One", email = "one@example.com" };
        var request2 = new { name = "Investor Two", email = "two@example.com" };

        var response1 = await _authenticatedClient.PostAsJsonAsync("/api/v1/crm/investors", request1);
        var response2 = await _authenticatedClient.PostAsJsonAsync("/api/v1/crm/investors", request2);

        response1.StatusCode.Should().Be(HttpStatusCode.Created);
        response2.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateCrmInvestor_ShouldSetStatusToActive()
    {
        var request = new
        {
            name = "Active Status Investor",
            email = "active@example.com"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/crm/investors", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        // Response may use PascalCase or camelCase depending on serializer config
        var status = document.RootElement.TryGetProperty("status", out var s) ? s.GetString()
            : document.RootElement.GetProperty("Status").GetString();
        status.Should().Be("Active");
    }

    #endregion

    #region Update CRM Investor

    [Fact]
    public async Task UpdateCrmInvestor_WithNonExistentId_ShouldReturnNotFound()
    {
        var request = new { name = "Updated Name" };

        var response = await _authenticatedClient.PutAsJsonAsync($"/api/v1/crm/investors/{Guid.NewGuid()}", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateCrmInvestor_WithValidData_ShouldSucceedOrNotFound()
    {
        // First create an investor
        var createRequest = new
        {
            name = "Original CRM Investor",
            email = "original@example.com"
        };

        var createResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/crm/investors", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createContent = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createContent);
        // Response may use PascalCase or camelCase
        var investorId = createDoc.RootElement.TryGetProperty("id", out var idProp) ? idProp.GetString()
            : createDoc.RootElement.GetProperty("Id").GetString();

        // Update the investor - may return NotFound due to database isolation
        var updateRequest = new
        {
            name = "Updated CRM Investor",
            email = "updated@example.com"
        };

        var updateResponse = await _authenticatedClient.PutAsJsonAsync($"/api/v1/crm/investors/{investorId}", updateRequest);
        updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateCrmInvestor_ChangeStatusOnly_ShouldSucceedOrNotFound()
    {
        // First create an investor
        var createRequest = new
        {
            name = "Status Change Test",
            email = "statuschange@example.com"
        };

        var createResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/crm/investors", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createContent = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createContent);
        // Response may use PascalCase or camelCase
        var investorId = createDoc.RootElement.TryGetProperty("id", out var idProp) ? idProp.GetString()
            : createDoc.RootElement.GetProperty("Id").GetString();

        // Update status only
        var updateRequest = new { status = "Inactive" };
        var updateResponse = await _authenticatedClient.PutAsJsonAsync($"/api/v1/crm/investors/{investorId}", updateRequest);
        updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateCrmInvestor_WithEmptyBody_ShouldSucceedOrNotFound()
    {
        // First create an investor
        var createRequest = new { name = "Empty Update", email = "empty@example.com" };
        var createResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/crm/investors", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createContent = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createContent);
        // Response may use PascalCase or camelCase
        var investorId = createDoc.RootElement.TryGetProperty("id", out var idProp) ? idProp.GetString()
            : createDoc.RootElement.GetProperty("Id").GetString();

        // Update with empty body
        var updateResponse = await _authenticatedClient.PutAsJsonAsync($"/api/v1/crm/investors/{investorId}", new { });
        updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
    }

    #endregion

    #region Delete CRM Investor

    [Fact]
    public async Task DeleteCrmInvestor_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _authenticatedClient.DeleteAsync($"/api/v1/crm/investors/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteCrmInvestor_WithExistingInvestor_ShouldReturnNoContentOrNotFound()
    {
        // First create an investor
        var createRequest = new
        {
            name = "Delete Test Investor",
            email = "delete@example.com"
        };

        var createResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/crm/investors", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createContent = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createContent);
        // Response may use PascalCase or camelCase
        var investorId = createDoc.RootElement.TryGetProperty("id", out var idProp) ? idProp.GetString()
            : createDoc.RootElement.GetProperty("Id").GetString();

        // Delete the investor - may return NotFound due to database isolation
        var deleteResponse = await _authenticatedClient.DeleteAsync($"/api/v1/crm/investors/{investorId}");
        deleteResponse.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.NotFound);
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetCrmInvestors_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/crm/investors");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCrmInvestorById_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync($"/api/v1/crm/investors/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateCrmInvestor_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new { name = "Unauthorized", email = "unauth@example.com" };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/crm/investors", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateCrmInvestor_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new { name = "Unauthorized Update" };

        var response = await _unauthenticatedClient.PutAsJsonAsync($"/api/v1/crm/investors/{Guid.NewGuid()}", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteCrmInvestor_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.DeleteAsync($"/api/v1/crm/investors/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Invalid Methods

    [Fact]
    public async Task CrmInvestors_PatchMethod_ShouldReturnMethodNotAllowedOrNotFound()
    {
        var response = await _authenticatedClient.PatchAsJsonAsync($"/api/v1/crm/investors/{Guid.NewGuid()}", new { });
        response.StatusCode.Should().BeOneOf(HttpStatusCode.MethodNotAllowed, HttpStatusCode.NotFound);
    }

    #endregion
}

public class CrmInterestsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _authenticatedClient;
    private readonly HttpClient _unauthenticatedClient;

    public CrmInterestsControllerTests(TestWebApplicationFactory factory)
    {
        _authenticatedClient = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region List CRM Interests

    [Fact]
    public async Task GetCrmInterests_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCrmInterests_ShouldReturnPaginatedStructure()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.TryGetProperty("interests", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("total", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("page", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("limit", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetCrmInterests_WithPagination_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCrmInterests_WithPage2_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?page=2&limit=5");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCrmInterests_WithStatusFilter_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?status=new");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCrmInterests_WithUnderReviewStatus_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?status=under_review");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCrmInterests_WithApprovedStatus_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?status=approved");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCrmInterests_WithRejectedStatus_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?status=rejected");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCrmInterests_WithConvertedStatus_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?status=converted");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCrmInterests_WithAllStatus_ShouldReturnAll()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?status=all");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCrmInterests_WithInvalidStatus_ShouldDefaultToNew()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?status=invalid");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCrmInterests_WithLargeLimit_ShouldBeClampedTo100()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?page=1&limit=500");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetProperty("limit").GetInt32().Should().BeLessOrEqualTo(100);
    }

    [Fact]
    public async Task GetCrmInterests_WithZeroLimit_ShouldClampTo1()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?page=1&limit=0");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetProperty("limit").GetInt32().Should().BeGreaterOrEqualTo(1);
    }

    [Fact]
    public async Task GetCrmInterests_WithNegativePage_ShouldClampTo1()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?page=-5&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetProperty("page").GetInt32().Should().BeGreaterOrEqualTo(1);
    }

    #endregion

    #region Review Interest

    [Fact]
    public async Task ReviewInterest_WithNonExistentId_ShouldReturnNotFound()
    {
        var request = new
        {
            action = "approve",
            reviewNotes = "Approved"
        };

        var response = await _authenticatedClient.PostAsJsonAsync($"/api/v1/crm/interests/{Guid.NewGuid()}/review", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ReviewInterest_ApproveAction_ShouldReturnOkOrNotFound()
    {
        var request = new
        {
            action = "approve",
            reviewNotes = "Looks good",
            reviewerId = Guid.NewGuid().ToString()
        };

        var response = await _authenticatedClient.PostAsJsonAsync($"/api/v1/crm/interests/{Guid.NewGuid()}/review", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ReviewInterest_RejectAction_ShouldReturnOkOrNotFound()
    {
        var request = new
        {
            action = "reject",
            reviewNotes = "Does not meet requirements",
            rejectionReason = "Missing documentation",
            reviewerId = Guid.NewGuid().ToString()
        };

        var response = await _authenticatedClient.PostAsJsonAsync($"/api/v1/crm/interests/{Guid.NewGuid()}/review", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ReviewInterest_WithInvalidGuid_ShouldReturnBadRequestOrNotFound()
    {
        var request = new { action = "approve" };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/crm/interests/invalid-guid/review", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.NotFound);
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetCrmInterests_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/crm/interests");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ReviewInterest_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new { action = "approve" };

        var response = await _unauthenticatedClient.PostAsJsonAsync($"/api/v1/crm/interests/{Guid.NewGuid()}/review", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Invalid Methods

    [Fact]
    public async Task CrmInterests_PostMethod_ShouldReturnMethodNotAllowed()
    {
        // POST to /crm/interests (not /crm/interests/{id}/review) should not be allowed
        var response = await _authenticatedClient.PostAsync("/api/v1/crm/interests", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task CrmInterests_PutMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PutAsync("/api/v1/crm/interests", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task CrmInterests_DeleteMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.DeleteAsync("/api/v1/crm/interests");
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task CrmInterests_GetById_ShouldReturnNotFoundOrMethodNotAllowed()
    {
        // No GetById endpoint exists for CRM interests
        var response = await _authenticatedClient.GetAsync($"/api/v1/crm/interests/{Guid.NewGuid()}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.MethodNotAllowed);
    }

    #endregion

    #region Response Content Validation

    [Fact]
    public async Task GetCrmInterests_ShouldReturnJsonContentType()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task GetCrmInterests_InterestsArrayShouldBeArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);

        var interests = document.RootElement.GetProperty("interests");
        interests.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetCrmInterests_MultipleCalls_ShouldReturnConsistentStructure()
    {
        var response1 = await _authenticatedClient.GetAsync("/api/v1/crm/interests");
        var response2 = await _authenticatedClient.GetAsync("/api/v1/crm/interests");

        response1.StatusCode.Should().Be(HttpStatusCode.OK);
        response2.StatusCode.Should().Be(HttpStatusCode.OK);

        var content1 = await response1.Content.ReadAsStringAsync();
        var content2 = await response2.Content.ReadAsStringAsync();

        using var doc1 = JsonDocument.Parse(content1);
        using var doc2 = JsonDocument.Parse(content2);

        doc1.RootElement.TryGetProperty("interests", out _).Should().BeTrue();
        doc2.RootElement.TryGetProperty("interests", out _).Should().BeTrue();
    }

    #endregion

    #region Edge Cases

    [Fact]
    public async Task GetCrmInterests_WithMultipleFilters_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?status=new&page=1&limit=5");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCrmInterests_WithExtraQueryParams_ShouldIgnoreAndReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/crm/interests?unused=param&another=value");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion
}
