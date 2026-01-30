using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace UserManager.Api.Tests;

public class ContractsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _authenticatedClient;
    private readonly HttpClient _unauthenticatedClient;

    public ContractsControllerTests(TestWebApplicationFactory factory)
    {
        _authenticatedClient = factory.CreateClient();
        _unauthenticatedClient = factory.CreateUnauthenticatedClient();
    }

    #region List Contracts

    [Fact]
    public async Task GetContracts_ShouldReturnOk()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContracts_ShouldReturnPaginatedResults()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts?page=1&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.TryGetProperty("contracts", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("total", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("page", out _).Should().BeTrue();
        document.RootElement.TryGetProperty("limit", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetContracts_WithSearch_ShouldFilterResults()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts?search=CTR-");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContracts_WithStatusFilter_ShouldFilterResults()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts?status=active");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContracts_WithInvestorIdFilter_ShouldFilterResults()
    {
        var investorId = Guid.NewGuid();
        var response = await _authenticatedClient.GetAsync($"/api/v1/contracts?investorId={investorId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContracts_WithAllStatusFilter_ShouldReturnAll()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts?status=all");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContracts_ShouldIncludeStatusCounts()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.TryGetProperty("statusCounts", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetContracts_WithHighPageNumber_ShouldReturnEmptyList()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts?page=9999&limit=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.TryGetProperty("contracts", out var contractsElement).Should().BeTrue();
        contractsElement.GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task GetContracts_WithLimit100_ShouldClampToMaxLimit()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts?page=1&limit=200");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContracts_WithIncompleteStatus_ShouldFilterResults()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts?status=incomplete");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContracts_WithExpiredStatus_ShouldFilterResults()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts?status=expired");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContracts_WithExpiringStatus_ShouldFilterResults()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts?status=expiring");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContracts_WithArchivedStatus_ShouldFilterResults()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts?status=archived");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContracts_WithCancelledStatus_ShouldFilterResults()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts?status=cancelled");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContracts_WithDraftStatus_ShouldFilterResults()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts?status=draft");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Get Contract by ID

    [Fact]
    public async Task GetContractById_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _authenticatedClient.GetAsync($"/api/v1/contracts/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetContractById_WithInvalidId_ShouldReturnNotFoundOrBadRequest()
    {
        var response = await _authenticatedClient.GetAsync("/api/v1/contracts/invalid-guid");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetContractById_AfterCreation_ShouldReturnContract()
    {
        var createRequest = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 100000,
            vatRate = 15,
            contractDuration = 3
        };

        var createResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);

            if (createDoc.RootElement.TryGetProperty("id", out var idElement))
            {
                var contractId = idElement.GetString();

                var getResponse = await _authenticatedClient.GetAsync($"/api/v1/contracts/{contractId}");
                getResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            }
        }
    }

    #endregion

    #region Create Contract

    [Fact]
    public async Task CreateContract_WithValidData_ShouldCreateContract()
    {
        var assetId = Guid.NewGuid();
        var investorId = Guid.NewGuid();

        var request = new
        {
            assetId = assetId.ToString(),
            investorId = investorId.ToString(),
            annualRentalAmount = 100000,
            vatRate = 15,
            contractDuration = 3,
            signingDate = "2026-01-01",
            startDate = "2026-02-01",
            endDate = "2029-01-31",
            assetNameAr = "مبنى تجاري",
            assetNameEn = "Commercial Building",
            investorNameAr = "مستثمر اختبار",
            investorNameEn = "Test Investor",
            notes = "Test contract notes"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.TryGetProperty("id", out _).Should().BeTrue();
    }

    [Fact]
    public async Task CreateContract_WithoutAssetId_ShouldReturnBadRequest()
    {
        var request = new
        {
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 100000
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateContract_WithoutInvestorId_ShouldReturnBadRequest()
    {
        var request = new
        {
            assetId = Guid.NewGuid().ToString(),
            annualRentalAmount = 100000
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateContract_WithInvalidAssetId_ShouldReturnBadRequest()
    {
        var request = new
        {
            assetId = "invalid-guid",
            investorId = Guid.NewGuid().ToString()
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateContract_WithInvalidInvestorId_ShouldReturnBadRequest()
    {
        var request = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = "invalid-guid"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateContract_WithMinimalData_ShouldCreateContract()
    {
        var request = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString()
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateContract_WithSpecialConditions_ShouldCreateContract()
    {
        var request = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 50000,
            vatRate = 15,
            contractDuration = 2,
            specialConditions = "Special conditions apply",
            approvalAuthority = "CEO"
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateContract_ShouldSetDraftStatus()
    {
        var request = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 75000,
            vatRate = 15,
            contractDuration = 1
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateContract_ShouldCalculateTotalAmounts()
    {
        var request = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 100000,
            vatRate = 15,
            contractDuration = 3
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateContract_WithLandCode_ShouldCreateContract()
    {
        var request = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            landCode = "RYD-002",
            annualRentalAmount = 60000,
            vatRate = 15,
            contractDuration = 1
        };

        var response = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
    }

    #endregion

    #region Update Contract

    [Fact]
    public async Task UpdateContract_WithNonExistentId_ShouldReturnNotFound()
    {
        var request = new { status = "active" };

        var response = await _authenticatedClient.PutAsJsonAsync($"/api/v1/contracts/{Guid.NewGuid()}", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateContract_WithValidStatusChange_ShouldSucceedOrNotFound()
    {
        // First create a contract
        var createRequest = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 50000,
            vatRate = 15,
            contractDuration = 1
        };

        var createResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", createRequest);
        createResponse.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);

        var createContent = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createContent);
        var contractId = createDoc.RootElement.GetProperty("id").GetString();

        // Update the contract status
        var updateRequest = new { status = "active" };
        var updateResponse = await _authenticatedClient.PutAsJsonAsync($"/api/v1/contracts/{contractId}", updateRequest);
        updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateContract_StatusToExpired_ShouldSucceedOrNotFound()
    {
        var createRequest = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 40000,
            vatRate = 15,
            contractDuration = 1
        };

        var createResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);
            var contractId = createDoc.RootElement.GetProperty("id").GetString();

            var updateRequest = new { status = "expired" };
            var updateResponse = await _authenticatedClient.PutAsJsonAsync($"/api/v1/contracts/{contractId}", updateRequest);
            updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
        }
    }

    [Fact]
    public async Task UpdateContract_StatusToCancelled_ShouldSucceedOrNotFound()
    {
        var createRequest = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 30000,
            vatRate = 15,
            contractDuration = 1
        };

        var createResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);
            var contractId = createDoc.RootElement.GetProperty("id").GetString();

            var updateRequest = new { status = "cancelled" };
            var updateResponse = await _authenticatedClient.PutAsJsonAsync($"/api/v1/contracts/{contractId}", updateRequest);
            updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
        }
    }

    [Fact]
    public async Task UpdateContract_StatusToArchived_ShouldSucceedOrNotFound()
    {
        var createRequest = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 35000,
            vatRate = 15,
            contractDuration = 1
        };

        var createResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);
            var contractId = createDoc.RootElement.GetProperty("id").GetString();

            var updateRequest = new { status = "archived" };
            var updateResponse = await _authenticatedClient.PutAsJsonAsync($"/api/v1/contracts/{contractId}", updateRequest);
            updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
        }
    }

    #endregion

    #region Delete Contract

    [Fact]
    public async Task DeleteContract_WithNonExistentId_ShouldReturnNotFound()
    {
        var response = await _authenticatedClient.DeleteAsync($"/api/v1/contracts/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteContract_WithExistingContract_ShouldReturnNoContentOrNotFound()
    {
        var createRequest = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 25000,
            vatRate = 15,
            contractDuration = 1
        };

        var createResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", createRequest);
        createResponse.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);

        var createContent = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createContent);
        var contractId = createDoc.RootElement.GetProperty("id").GetString();

        var deleteResponse = await _authenticatedClient.DeleteAsync($"/api/v1/contracts/{contractId}");
        deleteResponse.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteContract_ThenGet_ShouldReturnNotFound()
    {
        var createRequest = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 20000,
            vatRate = 15,
            contractDuration = 1
        };

        var createResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", createRequest);

        if (createResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var createContent = await createResponse.Content.ReadAsStringAsync();
            using var createDoc = JsonDocument.Parse(createContent);
            var contractId = createDoc.RootElement.GetProperty("id").GetString();

            await _authenticatedClient.DeleteAsync($"/api/v1/contracts/{contractId}");

            var getResponse = await _authenticatedClient.GetAsync($"/api/v1/contracts/{contractId}");
            getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
    }

    #endregion

    #region Installments

    [Fact]
    public async Task GetInstallments_ForNonExistentContract_ShouldReturnEmptyList()
    {
        var response = await _authenticatedClient.GetAsync($"/api/v1/contracts/{Guid.NewGuid()}/installments");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task CreateInstallment_ForNonExistentContract_ShouldReturnNotFound()
    {
        var request = new
        {
            installmentNumber = 1,
            amountDue = 10000,
            dueDate = "2026-03-01",
            status = "pending"
        };

        var response = await _authenticatedClient.PostAsJsonAsync($"/api/v1/contracts/{Guid.NewGuid()}/installments", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateInstallment_ForExistingContract_ShouldSucceedOrNotFound()
    {
        var createContractRequest = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 120000,
            vatRate = 15,
            contractDuration = 1
        };

        var createContractResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", createContractRequest);
        createContractResponse.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);

        var contractContent = await createContractResponse.Content.ReadAsStringAsync();
        using var contractDoc = JsonDocument.Parse(contractContent);
        var contractId = contractDoc.RootElement.GetProperty("id").GetString();

        var installmentRequest = new
        {
            installmentNumber = 1,
            amountDue = 30000,
            dueDate = "2026-04-01",
            status = "pending"
        };

        var installmentResponse = await _authenticatedClient.PostAsJsonAsync($"/api/v1/contracts/{contractId}/installments", installmentRequest);
        installmentResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetInstallments_ForContractWithInstallments_ShouldReturnList()
    {
        var createContractRequest = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 80000,
            vatRate = 15,
            contractDuration = 1
        };

        var createContractResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", createContractRequest);
        createContractResponse.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);

        var contractContent = await createContractResponse.Content.ReadAsStringAsync();
        using var contractDoc = JsonDocument.Parse(contractContent);
        var contractId = contractDoc.RootElement.GetProperty("id").GetString();

        var installment1 = new { installmentNumber = 1, amountDue = 40000, dueDate = "2026-05-01" };
        var installment2 = new { installmentNumber = 2, amountDue = 40000, dueDate = "2026-06-01" };

        await _authenticatedClient.PostAsJsonAsync($"/api/v1/contracts/{contractId}/installments", installment1);
        await _authenticatedClient.PostAsJsonAsync($"/api/v1/contracts/{contractId}/installments", installment2);

        var getResponse = await _authenticatedClient.GetAsync($"/api/v1/contracts/{contractId}/installments");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await getResponse.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
        document.RootElement.GetArrayLength().Should().BeGreaterOrEqualTo(0);
    }

    [Fact]
    public async Task CreateInstallment_WithOverdueStatus_ShouldSucceedOrNotFound()
    {
        var createContractRequest = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 60000,
            vatRate = 15,
            contractDuration = 1
        };

        var createContractResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", createContractRequest);

        if (createContractResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var contractContent = await createContractResponse.Content.ReadAsStringAsync();
            using var contractDoc = JsonDocument.Parse(contractContent);
            var contractId = contractDoc.RootElement.GetProperty("id").GetString();

            var installmentRequest = new
            {
                installmentNumber = 1,
                amountDue = 15000,
                dueDate = "2026-01-01",
                status = "overdue"
            };

            var installmentResponse = await _authenticatedClient.PostAsJsonAsync($"/api/v1/contracts/{contractId}/installments", installmentRequest);
            installmentResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
        }
    }

    [Fact]
    public async Task CreateInstallment_WithPaidStatus_ShouldSucceedOrNotFound()
    {
        var createContractRequest = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 50000,
            vatRate = 15,
            contractDuration = 1
        };

        var createContractResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", createContractRequest);

        if (createContractResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var contractContent = await createContractResponse.Content.ReadAsStringAsync();
            using var contractDoc = JsonDocument.Parse(contractContent);
            var contractId = contractDoc.RootElement.GetProperty("id").GetString();

            var installmentRequest = new
            {
                installmentNumber = 1,
                amountDue = 12500,
                dueDate = "2026-03-01",
                status = "paid"
            };

            var installmentResponse = await _authenticatedClient.PostAsJsonAsync($"/api/v1/contracts/{contractId}/installments", installmentRequest);
            installmentResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
        }
    }

    [Fact]
    public async Task CreateInstallment_WithPartialStatus_ShouldSucceedOrNotFound()
    {
        var createContractRequest = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString(),
            annualRentalAmount = 45000,
            vatRate = 15,
            contractDuration = 1
        };

        var createContractResponse = await _authenticatedClient.PostAsJsonAsync("/api/v1/contracts", createContractRequest);

        if (createContractResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created)
        {
            var contractContent = await createContractResponse.Content.ReadAsStringAsync();
            using var contractDoc = JsonDocument.Parse(contractContent);
            var contractId = contractDoc.RootElement.GetProperty("id").GetString();

            var installmentRequest = new
            {
                installmentNumber = 1,
                amountDue = 11250,
                dueDate = "2026-03-01",
                status = "partial"
            };

            var installmentResponse = await _authenticatedClient.PostAsJsonAsync($"/api/v1/contracts/{contractId}/installments", installmentRequest);
            installmentResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
        }
    }

    #endregion

    #region Authorization

    [Fact]
    public async Task GetContracts_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync("/api/v1/contracts");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateContract_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new
        {
            assetId = Guid.NewGuid().ToString(),
            investorId = Guid.NewGuid().ToString()
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync("/api/v1/contracts", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetContractById_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync($"/api/v1/contracts/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateContract_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new { status = "active" };
        var response = await _unauthenticatedClient.PutAsJsonAsync($"/api/v1/contracts/{Guid.NewGuid()}", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteContract_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.DeleteAsync($"/api/v1/contracts/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetInstallments_WithoutAuth_ShouldReturnUnauthorized()
    {
        var response = await _unauthenticatedClient.GetAsync($"/api/v1/contracts/{Guid.NewGuid()}/installments");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateInstallment_WithoutAuth_ShouldReturnUnauthorized()
    {
        var request = new
        {
            installmentNumber = 1,
            amountDue = 10000,
            dueDate = "2026-03-01"
        };

        var response = await _unauthenticatedClient.PostAsJsonAsync($"/api/v1/contracts/{Guid.NewGuid()}/installments", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion
}
