using UserManager.Domain.Common;

namespace UserManager.Domain.Entities;

public class Permission : EntityBase
{
    public string Key { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
