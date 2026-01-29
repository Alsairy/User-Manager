# Production Runbook

## Health Checks
- `GET /health/live` should return 200 when the process is running.
- `GET /health/ready` should return 200 when dependencies are healthy.

## Common Operations
**Restart API**
1. Restart the service/container.
2. Verify `/health/ready`.

**Apply Migrations**
```bash
dotnet run --project server-dotnet/src/MigrationsHost/UserManager.MigrationsHost.csproj
```

## Incident Response
1. Check logs for correlation ID and error details.
2. Validate DB connectivity.
3. If outage persists, roll back to last stable build.

## Backups
- Ensure SQL Server backups run regularly.
- Test restore procedures at least quarterly.

## Security
- Rotate `Jwt__SigningKey` and DB credentials regularly.
- Audit access logs for suspicious activity.
