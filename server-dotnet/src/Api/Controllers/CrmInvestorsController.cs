using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Api.Models.Crm;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Api.Controllers;

[ApiController]
[Route("api/v1/crm/investors")]
[Authorize]
public class CrmInvestorsController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public CrmInvestorsController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("investors:read")]
    public async Task<ActionResult<IReadOnlyList<InvestorResponse>>> List(CancellationToken cancellationToken)
    {
        var investors = await _dbContext.Investors
            .OrderBy(i => i.NameEn)
            .Select(i => new InvestorResponse(i.Id, i.NameEn, i.Email ?? string.Empty, i.Status.ToString()))
            .ToListAsync(cancellationToken);

        return Ok(investors);
    }

    [HttpGet("{id:guid}")]
    [HasPermission("investors:read")]
    public async Task<ActionResult<InvestorResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var investor = await _dbContext.Investors.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (investor is null)
        {
            return NotFound();
        }

        return Ok(new InvestorResponse(investor.Id, investor.NameEn, investor.Email ?? string.Empty, investor.Status.ToString()));
    }

    [HttpPost]
    [HasPermission("investors:create")]
    public async Task<ActionResult<InvestorResponse>> Create([FromBody] CreateInvestorRequest request, CancellationToken cancellationToken)
    {
        var investor = new Investor
        {
            InvestorCode = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..18],
            NameEn = request.Name.Trim(),
            NameAr = request.Name.Trim(),
            Email = request.Email.Trim(),
            Status = InvestorStatus.Active
        };

        await _dbContext.Investors.AddAsync(investor, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = investor.Id },
            new InvestorResponse(investor.Id, investor.NameEn, investor.Email ?? string.Empty, investor.Status.ToString()));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("investors:update")]
    public async Task<ActionResult<InvestorResponse>> Update(Guid id, [FromBody] UpdateInvestorRequest request, CancellationToken cancellationToken)
    {
        var investor = await _dbContext.Investors.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (investor is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            investor.NameEn = request.Name.Trim();
            investor.NameAr = request.Name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            investor.Email = request.Email.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Status) &&
            Enum.TryParse<InvestorStatus>(request.Status, true, out var status))
        {
            investor.Status = status;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new InvestorResponse(investor.Id, investor.NameEn, investor.Email ?? string.Empty, investor.Status.ToString()));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("investors:delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var investor = await _dbContext.Investors.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (investor is null)
        {
            return NotFound();
        }

        _dbContext.Investors.Remove(investor);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
