using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class PortalAssetsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _authenticatedClient;
    private readonly HttpClient _unauthenticatedClient;

    public PortalAssetsControllerTests(TestWebApplicationFactory factory)
    {
        _authenticatedClient = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region List Portal Assets

    [Fact]
    public async Task GetPortalAssets_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/assets");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetPortalAssets_ShouldReturnPaginatedStructure()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/assets");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);

        document.RootElement.TryGetProperty("assets", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("total", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("page", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("limit", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetPortalAssets_WithPagination_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/assets?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetPortalAssets_WithPage2_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/assets?page=2&limit=5");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetPortalAssets_WithLargeLimit_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/assets?page=1&limit=100");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetPortalAssets_WithDefaultPagination_ShouldUseDefaultLimit()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/assets");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);

        var limit = document.RootElement.GetProperty("limit").GetInt32();
        limit.Should().Be(12); // Default limit
    }

    #endregion

    #region Get Portal Asset by ID

    [Fact]
    public async Task GetPortalAssetById_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _authenticatedClient.GetAsync($"/api/v1/portal/assets/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetPortalAssetById_WithInvalidGuid_ShouldReturnBadRequestOrNotFound()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/assets/invalid-guid");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetPortalAssets_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/portal/assets");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetPortalAssetById_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync($"/api/v1/portal/assets/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Invalid Methods

    [Fact]
    public async Task PortalAssets_PostMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PostAsync("/api/v1/portal/assets", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task PortalAssets_PutMethod_ShouldReturnMethodNotAllowedOrNotFound()
    {
        var response = await _authenticatedClient.PutAsJsonAsync($"/api/v1/portal/assets/{Guid.NewGuid()}", new { });
        response.StatusCode.Should().BeOneOf(HttpStatusCode.MethodNotAllowed, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PortalAssets_DeleteMethod_ShouldReturnMethodNotAllowedOrNotFound()
    {
        var response = await _authenticatedClient.DeleteAsync($"/api/v1/portal/assets/{Guid.NewGuid()}");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.MethodNotAllowed, HttpStatusCode.NotFound);
    }

    #endregion
}

public class PortalInterestsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _authenticatedClient;
    private readonly HttpClient _unauthenticatedClient;

    public PortalInterestsControllerTests(TestWebApplicationFactory factory)
    {
        _authenticatedClient = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region List Portal Interests

    [Fact]
    public async Task GetPortalInterests_WithoutInvestorAccountId_ShouldReturnEmptyArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/interests");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
        document.RootElement.GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task GetPortalInterests_WithInvestorAccountId_ShouldReturnOk()
    {
        var investorAccountId = Guid.NewGuid().ToString();
        var response = await _authenticatedClient.GetAsync($"/api/v1/portal/interests?investorAccountId={investorAccountId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetPortalInterests_WithEmptyInvestorAccountId_ShouldReturnEmptyArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/interests?investorAccountId=");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task GetPortalInterests_WithWhitespaceInvestorAccountId_ShouldReturnEmptyArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/interests?investorAccountId=%20");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetArrayLength().Should().Be(0);
    }

    #endregion

    #region Create Portal Interest

    [Fact]
    public async Task CreatePortalInterest_WithValidData_ShouldReturnOk()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            assetId = Guid.NewGuid().ToString(),
            investmentPurpose = "commercial_development",
            proposedUseDescription = "Test description",
            investmentAmountRange = "1m_5m",
            expectedTimeline = "short_term",
            additionalComments = "Test comments"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/interests", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();
        document.RootElement.TryGetProperty("id", out _).Should().BeTrue();
    }

    [Fact]
    public async Task CreatePortalInterest_WithoutInvestorAccountId_ShouldReturnBadRequest()
    {
        var request = new
        {
            assetId = Guid.NewGuid().ToString(),
            investmentPurpose = "commercial_development"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/interests", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreatePortalInterest_WithoutAssetId_ShouldReturnBadRequest()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            investmentPurpose = "commercial_development"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/interests", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreatePortalInterest_WithAllPurposeTypes_ShouldReturnOk()
    {
        var purposes = new[] { "commercial_development", "residential_project", "mixed_use", "educational_facility", "healthcare_facility", "retail_center", "industrial_warehouse", "other" };

        foreach (var purpose in purposes)
        {
            var request = new
            {
                investorAccountId = Guid.NewGuid().ToString(),
                assetId = Guid.NewGuid().ToString(),
                investmentPurpose = purpose
            };

            var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/interests", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK, $"Purpose '{purpose}' should be valid");
        }
    }

    [Fact]
    public async Task CreatePortalInterest_WithAllAmountRanges_ShouldReturnOk()
    {
        var ranges = new[] { "under_1m", "1m_5m", "5m_10m", "10m_50m", "50m_100m", "over_100m" };

        foreach (var range in ranges)
        {
            var request = new
            {
                investorAccountId = Guid.NewGuid().ToString(),
                assetId = Guid.NewGuid().ToString(),
                investmentAmountRange = range
            };

            var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/interests", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK, $"Amount range '{range}' should be valid");
        }
    }

    [Fact]
    public async Task CreatePortalInterest_WithAllTimelines_ShouldReturnOk()
    {
        var timelines = new[] { "immediate", "short_term", "mid_term", "long_term", "over_2_years" };

        foreach (var timeline in timelines)
        {
            var request = new
            {
                investorAccountId = Guid.NewGuid().ToString(),
                assetId = Guid.NewGuid().ToString(),
                expectedTimeline = timeline
            };

            var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/interests", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK, $"Timeline '{timeline}' should be valid");
        }
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetPortalInterests_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/portal/interests");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreatePortalInterest_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            assetId = Guid.NewGuid().ToString()
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/portal/interests", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion
}

public class PortalFavoritesControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _authenticatedClient;
    private readonly HttpClient _unauthenticatedClient;

    public PortalFavoritesControllerTests(TestWebApplicationFactory factory)
    {
        _authenticatedClient = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region List Portal Favorites

    [Fact]
    public async Task GetPortalFavorites_WithoutInvestorAccountId_ShouldReturnBadRequest()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/favorites");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetPortalFavorites_WithInvestorAccountId_ShouldReturnOk()
    {
        var investorAccountId = Guid.NewGuid().ToString();
        var response = await _authenticatedClient.GetAsync($"/api/v1/portal/favorites?investorAccountId={investorAccountId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetPortalFavorites_ShouldReturnArray()
    {
        var investorAccountId = Guid.NewGuid().ToString();
        var response = await _authenticatedClient.GetAsync($"/api/v1/portal/favorites?investorAccountId={investorAccountId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    #endregion

    #region Add Favorite

    [Fact]
    public async Task AddFavorite_WithValidData_ShouldReturnOk()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            assetId = Guid.NewGuid().ToString()
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/favorites", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task AddFavorite_WithoutInvestorAccountId_ShouldReturnBadRequest()
    {
        var request = new
        {
            assetId = Guid.NewGuid().ToString()
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/favorites", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddFavorite_WithoutAssetId_ShouldReturnBadRequest()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString()
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/favorites", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddFavorite_DuplicateShouldNotFail()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            assetId = Guid.NewGuid().ToString()
        };

        // Add same favorite twice
        var response1 = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/favorites", request);
        var response2 = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/favorites", request);

        response1.StatusCode.Should().Be(HttpStatusCode.OK);
        response2.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Remove Favorite

    [Fact]
    public async Task RemoveFavorite_WithValidData_ShouldReturnOk()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            assetId = Guid.NewGuid().ToString()
        };

        var response = await _authenticatedClient.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/v1/portal/favorites")
        {
            Content = JsonContent.Create(request)
        });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task RemoveFavorite_WithoutInvestorAccountId_ShouldReturnBadRequest()
    {
        var request = new
        {
            assetId = Guid.NewGuid().ToString()
        };

        var response = await _authenticatedClient.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/v1/portal/favorites")
        {
            Content = JsonContent.Create(request)
        });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RemoveFavorite_NonExistentFavorite_ShouldStillReturnOk()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            assetId = Guid.NewGuid().ToString()
        };

        var response = await _authenticatedClient.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/v1/portal/favorites")
        {
            Content = JsonContent.Create(request)
        });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Check Favorite

    [Fact]
    public async Task CheckFavorite_WithValidParams_ShouldReturnOk()
    {
        var investorAccountId = Guid.NewGuid().ToString();
        var assetId = Guid.NewGuid().ToString();

        var response = await _authenticatedClient.GetAsync($"/api/v1/portal/favorites/check?investorAccountId={investorAccountId}&assetId={assetId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.TryGetProperty("isFavorite", out _).Should().BeTrue();
    }

    [Fact]
    public async Task CheckFavorite_WithoutParams_ShouldReturnFalse()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/favorites/check");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetProperty("isFavorite").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task CheckFavorite_WithOnlyInvestorAccountId_ShouldReturnFalse()
    {
        var response = await _authenticatedClient.GetAsync($"/api/v1/portal/favorites/check?investorAccountId={Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetProperty("isFavorite").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task CheckFavorite_WithOnlyAssetId_ShouldReturnFalse()
    {
        var response = await _authenticatedClient.GetAsync($"/api/v1/portal/favorites/check?assetId={Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetProperty("isFavorite").GetBoolean().Should().BeFalse();
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetPortalFavorites_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync($"/api/v1/portal/favorites?investorAccountId={Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AddFavorite_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            assetId = Guid.NewGuid().ToString()
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/portal/favorites", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RemoveFavorite_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            assetId = Guid.NewGuid().ToString()
        };

        var response = await _unauthenticatedClient.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/v1/portal/favorites")
        {
            Content = JsonContent.Create(request)
        });
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CheckFavorite_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync($"/api/v1/portal/favorites/check?investorAccountId={Guid.NewGuid()}&assetId={Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion
}

public class PortalIstifadaControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _authenticatedClient;
    private readonly HttpClient _unauthenticatedClient;

    public PortalIstifadaControllerTests(TestWebApplicationFactory factory)
    {
        _authenticatedClient = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region List Istifada Requests

    [Fact]
    public async Task GetIstifadaRequests_WithoutInvestorAccountId_ShouldReturnEmptyArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/istifada");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
        document.RootElement.GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task GetIstifadaRequests_WithInvestorAccountId_ShouldReturnOk()
    {
        var investorAccountId = Guid.NewGuid().ToString();
        var response = await _authenticatedClient.GetAsync($"/api/v1/portal/istifada?investorAccountId={investorAccountId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetIstifadaRequests_WithEmptyInvestorAccountId_ShouldReturnEmptyArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/portal/istifada?investorAccountId=");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetArrayLength().Should().Be(0);
    }

    #endregion

    #region Create Istifada Request

    [Fact]
    public async Task CreateIstifadaRequest_WithValidData_ShouldReturnOk()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            assetId = Guid.NewGuid().ToString(),
            programType = "educational_services",
            programTitle = "Test Program",
            programDescription = "Test description",
            targetBeneficiaries = "Students",
            startDate = "2026-03-01",
            endDate = "2026-09-01",
            budgetEstimate = "50000"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/istifada", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();
        document.RootElement.TryGetProperty("id", out _).Should().BeTrue();
    }

    [Fact]
    public async Task CreateIstifadaRequest_WithoutInvestorAccountId_ShouldReturnBadRequest()
    {
        var request = new
        {
            assetId = Guid.NewGuid().ToString(),
            programType = "educational_services"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/istifada", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateIstifadaRequest_WithMinimalData_ShouldReturnOk()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString()
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/istifada", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateIstifadaRequest_WithAllProgramTypes_ShouldReturnOk()
    {
        var programTypes = new[] { "educational_services", "community_programs", "sports_activities", "cultural_events", "other" };

        foreach (var programType in programTypes)
        {
            var request = new
            {
                investorAccountId = Guid.NewGuid().ToString(),
                programType
            };

            var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/istifada", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK, $"Program type '{programType}' should be valid");
        }
    }

    [Fact]
    public async Task CreateIstifadaRequest_WithInvalidProgramType_ShouldDefaultToOther()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            programType = "invalid_type"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/istifada", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateIstifadaRequest_WithValidDates_ShouldReturnOk()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            startDate = "2026-06-01",
            endDate = "2026-12-31"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/istifada", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateIstifadaRequest_WithInvalidDateFormat_ShouldUseDefaults()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString(),
            startDate = "invalid-date",
            endDate = "also-invalid"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/portal/istifada", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetIstifadaRequests_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/portal/istifada");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateIstifadaRequest_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new
        {
            investorAccountId = Guid.NewGuid().ToString()
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/portal/istifada", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Invalid Methods

    [Fact]
    public async Task Istifada_PutMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PutAsJsonAsync("/api/v1/portal/istifada", new { });
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task Istifada_DeleteMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.DeleteAsync("/api/v1/portal/istifada");
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    #endregion
}
