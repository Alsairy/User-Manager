namespace UserManager.Api.Models.Roles;

public record AssignPermissionsRequest(IReadOnlyList<string> PermissionKeys);
