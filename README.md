# UserManager API (.NET 8)

This repository now contains the **.NET 8 API only**. Legacy Node/React code has been removed.

## Structure
- `server-dotnet/` — API, domain, infrastructure, workflows, and tests
- `.github/workflows/` — CI and security checks
- `docker-compose.yml` — local SQL Server + API

## Prerequisites
- .NET SDK 8.x
- SQL Server (local) or Docker Desktop

## Quick Start (Local)
```bash
docker compose up -d db
dotnet run --project server-dotnet/src/Api/UserManager.Api.csproj
```

## Migrations
Run migrations via the migrations host:
```bash
dotnet run --project server-dotnet/src/MigrationsHost/UserManager.MigrationsHost.csproj
```

## Configuration
Copy `.env.example` and set the environment variables for your environment.  
Key variables:
- `ConnectionStrings__Default`
- `ConnectionStrings__Elsa`
- `Jwt__SigningKey`
- `Seed__Enabled`

## Health Endpoints
- `GET /health` — overall health
- `GET /health/ready` — readiness
- `GET /health/live` — liveness

## Documentation
- `DEPLOYMENT.md`
- `RUNBOOK.md`
- `PRODUCTION_CHECKLIST.md`
