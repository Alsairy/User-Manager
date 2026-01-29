using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Api.Controllers;

[ApiController]
[Route("api/v1/investors")]
[Authorize]
public class InvestorsController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public InvestorsController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("investors:read")]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var investors = await _dbContext.Investors
            .OrderBy(i => i.NameEn)
            .ToListAsync(cancellationToken);

        return Ok(investors.Select(MapInvestor));
    }

    [HttpPost]
    [HasPermission("investors:create")]
    public async Task<IActionResult> Create([FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var investor = new Investor
        {
            InvestorCode = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..18],
            NameEn = TryGet(payload, "nameEn") ?? TryGet(payload, "name") ?? "Investor",
            NameAr = TryGet(payload, "nameAr") ?? string.Empty,
            ContactPerson = TryGet(payload, "contactPerson"),
            Email = TryGet(payload, "email"),
            Phone = TryGet(payload, "phone"),
            CompanyRegistration = TryGet(payload, "companyRegistration"),
            TaxId = TryGet(payload, "taxId"),
            Address = TryGet(payload, "address"),
            City = TryGet(payload, "city"),
            Country = TryGet(payload, "country") ?? "Saudi Arabia",
            Status = ParseInvestorStatus(TryGet(payload, "status") ?? "active"),
            Notes = TryGet(payload, "notes")
        };

        await _dbContext.Investors.AddAsync(investor, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(MapInvestor(investor));
    }

    [HttpPatch("{id:guid}")]
    [HasPermission("investors:update")]
    public async Task<IActionResult> Update(Guid id, [FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var investor = await _dbContext.Investors.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (investor is null)
        {
            return NotFound();
        }

        if (payload.TryGetProperty("nameEn", out var nameEnValue))
        {
            investor.NameEn = nameEnValue.GetString() ?? investor.NameEn;
        }
        if (payload.TryGetProperty("nameAr", out var nameArValue))
        {
            investor.NameAr = nameArValue.GetString() ?? investor.NameAr;
        }
        if (payload.TryGetProperty("email", out var emailValue))
        {
            investor.Email = emailValue.GetString();
        }
        if (payload.TryGetProperty("phone", out var phoneValue))
        {
            investor.Phone = phoneValue.GetString();
        }
        if (payload.TryGetProperty("status", out var statusValue))
        {
            investor.Status = ParseInvestorStatus(statusValue.GetString() ?? "active");
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    private static object MapInvestor(Investor investor)
    {
        return new
        {
            id = investor.Id,
            investorCode = investor.InvestorCode,
            nameAr = investor.NameAr,
            nameEn = investor.NameEn,
            contactPerson = investor.ContactPerson,
            email = investor.Email,
            phone = investor.Phone,
            companyRegistration = investor.CompanyRegistration,
            taxId = investor.TaxId,
            address = investor.Address,
            city = investor.City,
            country = investor.Country,
            status = MapInvestorStatus(investor.Status),
            notes = investor.Notes,
            createdAt = investor.CreatedAt,
            updatedAt = investor.UpdatedAt
        };
    }

    private static string? TryGet(JsonElement payload, string property)
    {
        return payload.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    private static string MapInvestorStatus(InvestorStatus status)
    {
        return status switch
        {
            InvestorStatus.Active => "active",
            InvestorStatus.Inactive => "inactive",
            InvestorStatus.Blacklisted => "blacklisted",
            _ => "active"
        };
    }

    private static InvestorStatus ParseInvestorStatus(string value)
    {
        return value.ToLowerInvariant() switch
        {
            "inactive" => InvestorStatus.Inactive,
            "blacklisted" => InvestorStatus.Blacklisted,
            _ => InvestorStatus.Active
        };
    }
}
