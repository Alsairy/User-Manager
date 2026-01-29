using UserManager.Domain.Common;
using UserManager.Domain.Enums;

namespace UserManager.Domain.Entities;

public class Asset : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string AssetType { get; set; } = "land";
    public string RegionId { get; set; } = string.Empty;
    public string CityId { get; set; } = string.Empty;
    public string DistrictId { get; set; } = string.Empty;
    public string? Neighborhood { get; set; }
    public string? StreetAddress { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool LocationValidated { get; set; }
    public string? NearbyAssetsJustification { get; set; }
    public double TotalArea { get; set; }
    public double? BuiltUpArea { get; set; }
    public string? LandUseType { get; set; }
    public string? ZoningClassification { get; set; }
    public string? CurrentStatus { get; set; }
    public string? OwnershipType { get; set; }
    public string? DeedNumber { get; set; }
    public DateTime? DeedDate { get; set; }
    public List<string> OwnershipDocuments { get; set; } = new();
    public List<string> Features { get; set; } = new();
    public string? CustomFeatures { get; set; }
    public decimal? FinancialDues { get; set; }
    public string? CustodyDetails { get; set; }
    public string? AdministrativeNotes { get; set; }
    public string? RelatedReferences { get; set; }
    public string? Description { get; set; }
    public string? SpecialConditions { get; set; }
    public string? InvestmentPotential { get; set; }
    public string? Restrictions { get; set; }
    public List<string> Attachments { get; set; } = new();
    public string? RegistrationMode { get; set; }
    public string? CurrentStage { get; set; }
    public List<AssetVerifier> VerifiedBy { get; set; } = new();
    public string? RejectionReason { get; set; }
    public string? RejectionJustification { get; set; }
    public bool VisibleToInvestors { get; set; } = true;
    public int VisibilityCount { get; set; }
    public int TotalExposureDays { get; set; }
    public bool HasActiveIsnad { get; set; }
    public bool HasActiveContract { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime? SubmittedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public AssetStatus Status { get; set; } = AssetStatus.Draft;
}
