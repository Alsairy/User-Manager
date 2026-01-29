namespace UserManager.Domain.Enums;

public enum IsnadStatus
{
    Draft = 0,
    PendingVerification = 1,
    VerificationDue = 2,
    ChangesRequested = 3,
    VerifiedFilled = 4,
    InvestmentAgencyReview = 5,
    InPackage = 6,
    PendingCeo = 7,
    PendingMinister = 8,
    Approved = 9,
    Rejected = 10,
    Cancelled = 11
}
