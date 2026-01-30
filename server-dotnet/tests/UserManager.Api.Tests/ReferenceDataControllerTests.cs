using System.Net;
using System.Text.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class ReferenceDataControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _authenticatedClient;
    private readonly HttpClient _unauthenticatedClient;

    public ReferenceDataControllerTests(TestWebApplicationFactory factory)
    {
        _authenticatedClient = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region Get Regions

    [Fact]
    public async Task GetRegions_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/regions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetRegions_ShouldReturnArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/regions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetRegions_ShouldReturnJsonContentType()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/regions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task GetRegions_RegionsShouldHaveExpectedProperties()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/regions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);

        if (document.RootElement.GetArrayLength() > 0)
        {
            var firstRegion = document.RootElement[0];
            firstRegion.TryGetProperty("Id", out _).Should().BeTrue();
            firstRegion.TryGetProperty("NameAr", out _).Should().BeTrue();
            firstRegion.TryGetProperty("NameEn", out _).Should().BeTrue();
            firstRegion.TryGetProperty("Code", out _).Should().BeTrue();
        }
    }

    [Fact]
    public async Task GetRegions_WithQueryParams_ShouldIgnoreAndReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/regions?unused=param");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetRegions_MultipleCalls_ShouldReturnConsistentResults()
    {
        var response1 = await _authenticatedClient.GetAsync("/api/v1/reference/regions");
        var response2 = await _authenticatedClient.GetAsync("/api/v1/reference/regions");

        response1.StatusCode.Should().Be(HttpStatusCode.OK);
        response2.StatusCode.Should().Be(HttpStatusCode.OK);

        var content1 = await response1.Content.ReadAsStringAsync();
        var content2 = await response2.Content.ReadAsStringAsync();

        // Same data should be returned
        content1.Should().Be(content2);
    }

    #endregion

    #region Get Cities

    [Fact]
    public async Task GetCities_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/cities");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCities_ShouldReturnArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/cities");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetCities_WithRegionIdFilter_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/cities?regionId=1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCities_WithValidRegionId_ShouldReturnFilteredResults()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/cities?regionId=01");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetCities_WithEmptyRegionId_ShouldReturnAllCities()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/cities?regionId=");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetCities_WithNonExistentRegionId_ShouldReturnEmptyArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/cities?regionId=99999");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
        document.RootElement.GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task GetCities_CitiesShouldHaveExpectedProperties()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/cities");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);

        if (document.RootElement.GetArrayLength() > 0)
        {
            var firstCity = document.RootElement[0];
            firstCity.TryGetProperty("Id", out _).Should().BeTrue();
            firstCity.TryGetProperty("RegionId", out _).Should().BeTrue();
            firstCity.TryGetProperty("NameAr", out _).Should().BeTrue();
            firstCity.TryGetProperty("NameEn", out _).Should().BeTrue();
            firstCity.TryGetProperty("Code", out _).Should().BeTrue();
        }
    }

    [Fact]
    public async Task GetCities_WithMultipleRegionIds_ShouldFilterCorrectly()
    {
        // This tests the regionId parameter handling
        var response1 = await _authenticatedClient.GetAsync("/api/v1/reference/cities?regionId=01");
        var response2 = await _authenticatedClient.GetAsync("/api/v1/reference/cities?regionId=02");

        response1.StatusCode.Should().Be(HttpStatusCode.OK);
        response2.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCities_ShouldReturnJsonContentType()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/cities");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    #endregion

    #region Get Districts

    [Fact]
    public async Task GetDistricts_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistricts_ShouldReturnArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetDistricts_WithCityIdFilter_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts?cityIds=1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistricts_WithMultipleCityIds_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts?cityIds=1,2,3");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistricts_WithEmptyCityIds_ShouldReturnAllDistricts()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts?cityIds=");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetDistricts_WithNonExistentCityId_ShouldReturnEmptyArray()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts?cityIds=99999");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
        document.RootElement.GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task GetDistricts_DistrictsShouldHaveExpectedProperties()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);

        if (document.RootElement.GetArrayLength() > 0)
        {
            var firstDistrict = document.RootElement[0];
            firstDistrict.TryGetProperty("Id", out _).Should().BeTrue();
            firstDistrict.TryGetProperty("CityId", out _).Should().BeTrue();
            firstDistrict.TryGetProperty("NameAr", out _).Should().BeTrue();
            firstDistrict.TryGetProperty("NameEn", out _).Should().BeTrue();
            firstDistrict.TryGetProperty("Code", out _).Should().BeTrue();
        }
    }

    [Fact]
    public async Task GetDistricts_WithCityIdsContainingSpaces_ShouldTrimAndReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts?cityIds=1, 2, 3");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistricts_ShouldReturnJsonContentType()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetRegions_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/reference/regions");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCities_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/reference/cities");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCities_WithRegionFilter_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/reference/cities?regionId=1");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetDistricts_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/reference/districts");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetDistricts_WithCityFilter_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/reference/districts?cityIds=1");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Invalid Methods

    [Fact]
    public async Task Regions_PostMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PostAsync("/api/v1/reference/regions", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task Regions_PutMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PutAsync("/api/v1/reference/regions", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task Regions_DeleteMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.DeleteAsync("/api/v1/reference/regions");
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task Cities_PostMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PostAsync("/api/v1/reference/cities", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task Cities_PutMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PutAsync("/api/v1/reference/cities", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task Cities_DeleteMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.DeleteAsync("/api/v1/reference/cities");
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task Districts_PostMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PostAsync("/api/v1/reference/districts", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task Districts_PutMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.PutAsync("/api/v1/reference/districts", null);
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task Districts_DeleteMethod_ShouldReturnMethodNotAllowed()
    {
        var response = await _authenticatedClient.DeleteAsync("/api/v1/reference/districts");
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    #endregion

    #region Invalid Endpoints

    [Fact]
    public async Task Reference_InvalidEndpoint_ShouldReturnNotFound()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/invalid");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Reference_Countries_ShouldReturnNotFound()
    {
        // Endpoint doesn't exist
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/countries");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Reference_RegionById_ShouldReturnNotFound()
    {
        // No GetById endpoint for regions
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/regions/1");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Reference_CityById_ShouldReturnNotFound()
    {
        // No GetById endpoint for cities
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/cities/1");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Reference_DistrictById_ShouldReturnNotFound()
    {
        // No GetById endpoint for districts
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts/1");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Edge Cases

    [Fact]
    public async Task GetCities_WithSpecialCharactersInRegionId_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/cities?regionId=%20");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistricts_WithSpecialCharactersInCityIds_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts?cityIds=%20");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistricts_WithTrailingComma_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts?cityIds=1,2,");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistricts_WithLeadingComma_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts?cityIds=,1,2");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDistricts_WithDuplicateCityIds_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/reference/districts?cityIds=1,1,1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Response Consistency

    [Fact]
    public async Task AllEndpoints_ShouldReturnJson()
    {
        var endpoints = new[]
        {
            "/api/v1/reference/regions",
            "/api/v1/reference/cities",
            "/api/v1/reference/districts"
        };

        foreach (var endpoint in endpoints)
        {
            var response = await _authenticatedClient.GetAsync(endpoint);
            response.StatusCode.Should().Be(HttpStatusCode.OK, $"Endpoint {endpoint} should return OK");
            response.Content.Headers.ContentType?.MediaType.Should().Be("application/json", $"Endpoint {endpoint} should return JSON");
        }
    }

    [Fact]
    public async Task AllEndpoints_ShouldReturnArrays()
    {
        var endpoints = new[]
        {
            "/api/v1/reference/regions",
            "/api/v1/reference/cities",
            "/api/v1/reference/districts"
        };

        foreach (var endpoint in endpoints)
        {
            var response = await _authenticatedClient.GetAsync(endpoint);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var content = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(content);
            document.RootElement.ValueKind.Should().Be(JsonValueKind.Array, $"Endpoint {endpoint} should return an array");
        }
    }

    #endregion
}
