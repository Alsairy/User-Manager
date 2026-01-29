namespace UserManager.Domain.Enums;

public enum PackageStatus
{
    Draft = 0,
    PendingCeo = 1,
    CeoApproved = 2,
    PendingMinister = 3,
    MinisterApproved = 4,
    RejectedCeo = 5,
    RejectedMinister = 6
}
