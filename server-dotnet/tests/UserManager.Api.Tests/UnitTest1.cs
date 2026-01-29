using System.Net.Http.Json;
using System.Text.Json;

namespace UserManager.Api.Tests;

public class ApiSmokeTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ApiSmokeTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ContractsDashboard_ReturnsStats()
    {
        var response = await _client.GetAsync("/api/v1/contracts/dashboard");
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Unexpected status {(int)response.StatusCode}: {error}");
        }

        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("totalContracts", json);
        Assert.Contains("activeContracts", json);
    }

    [Fact]
    public async Task IstifadaRequest_CanCreateAndList()
    {
        var payload = new
        {
            investorAccountId = "demo-investor-001",
            programType = "educational_services",
            programTitle = "Test Istifada Program",
            programDescription = "This is a test istifada program description.",
            startDate = "2026-02-01",
            endDate = "2026-07-01"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/portal/istifada", payload);
        if (!createResponse.IsSuccessStatusCode)
        {
            var error = await createResponse.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Create failed {(int)createResponse.StatusCode}: {error}");
        }

        var listResponse = await _client.GetAsync("/api/v1/portal/istifada?investorAccountId=demo-investor-001");
        if (!listResponse.IsSuccessStatusCode)
        {
            var error = await listResponse.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"List failed {(int)listResponse.StatusCode}: {error}");
        }

        var content = await listResponse.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        Assert.True(document.RootElement.ValueKind == JsonValueKind.Array);
    }
}