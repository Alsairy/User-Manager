# Deployment Guide

## Build
```bash
dotnet restore server-dotnet/UserManager.sln
dotnet publish server-dotnet/src/Api/UserManager.Api.csproj -c Release -o ./out
```

## Configuration
Set required environment variables (examples in `.env.example`):
- `ConnectionStrings__Default`
- `ConnectionStrings__Elsa`
- `Jwt__SigningKey`
- `Cors__AllowedOrigins__0`

## Database Migrations
Run the migrations host in the target environment:
```bash
dotnet run --project server-dotnet/src/MigrationsHost/UserManager.MigrationsHost.csproj
```

## Docker (Optional)
```bash
docker compose up -d
```

## Rollback
If a deployment fails:
1. Roll back application to the last known-good build.
2. Roll back DB using your migration strategy or restore a snapshot.
3. Re-run health checks (`/health`, `/health/ready`).
