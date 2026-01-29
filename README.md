# User-Manager Platform

A comprehensive business management platform built with .NET 8 and React, featuring user management, asset registration, contract management, ISNAD government workflows, investor portal, and CRM capabilities.

## Architecture

```
User-Manager/
├── server-dotnet/          # .NET 8 Backend API
│   ├── src/
│   │   ├── Api/            # REST API Controllers
│   │   ├── Application/    # CQRS Commands/Queries
│   │   ├── Domain/         # Entities, Events, Enums
│   │   ├── Infrastructure/ # EF Core, Services
│   │   ├── MigrationsHost/ # Database migrations
│   │   └── Workflows/      # Elsa 3 Workflows
│   └── tests/              # Unit & Integration tests
├── client/                 # React + TypeScript Frontend
├── infra/                  # Terraform (GCP)
└── .github/workflows/      # CI/CD Pipelines
```

## Features

- **User Management**: RBAC with permission-based authorization
- **Asset Registration**: Multi-stage approval workflows
- **Contract Management**: Installment tracking, automated reminders
- **ISNAD Workflows**: 12-stage government approval process
- **Investor Portal**: Interest submission, favorites, Istifada requests
- **CRM**: Investor pipeline management
- **Notifications**: In-app + Email (SendGrid)
- **Caching**: Redis for performance
- **Observability**: OpenTelemetry tracing + metrics

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | .NET 8, ASP.NET Core, Entity Framework Core |
| Workflows | Elsa 3.5 |
| Database | SQL Server |
| Cache | Redis |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Auth | JWT Bearer tokens |
| Observability | OpenTelemetry, Serilog |
| Infrastructure | Terraform, Google Cloud Platform |

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- SQL Server (via Docker or local)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd User-Manager
cp .env.example .env
# Edit .env with your configuration
```

### 2. Start Database

```bash
docker compose up -d db
```

### 3. Run Migrations

```bash
dotnet run --project server-dotnet/src/MigrationsHost/UserManager.MigrationsHost.csproj
```

### 4. Start Backend

```bash
cd server-dotnet
./run-local.sh
# Or manually:
# dotnet run --project src/Api/UserManager.Api.csproj
```

API available at: http://localhost:5050

### 5. Start Frontend

```bash
cd client
npm install
npm run dev
```

Frontend available at: http://localhost:5173

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ConnectionStrings__Default` | SQL Server connection | Yes |
| `ConnectionStrings__Elsa` | Elsa database connection | Yes |
| `ConnectionStrings__Redis` | Redis connection | No |
| `Jwt__SigningKey` | JWT signing key (min 32 chars) | Yes |
| `Jwt__AccessTokenMinutes` | Access token expiry (default: 30) | No |
| `Jwt__RefreshTokenDays` | Refresh token expiry (default: 7) | No |
| `Email__SendGridApiKey` | SendGrid API key | For emails |
| `Email__Enabled` | Enable email sending | No |
| `Seed__Enabled` | Enable data seeding | Development |
| `Seed__AdminEmail` | Admin user email | If seeding |
| `Seed__AdminPassword` | Admin user password | If seeding |

### appsettings.json

```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost,1433;Database=UserManager;User Id=sa;Password=YourPassword;TrustServerCertificate=True",
    "Elsa": "Server=localhost,1433;Database=UserManager_Elsa;User Id=sa;Password=YourPassword;TrustServerCertificate=True",
    "Redis": "localhost:6379"
  },
  "Jwt": {
    "SigningKey": "your-secure-signing-key-at-least-32-characters"
  }
}
```

## API Documentation

Swagger UI: http://localhost:5050/swagger

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/login` | User login |
| `POST /api/v1/auth/refresh` | Refresh token |
| `GET /api/v1/users` | List users (paginated) |
| `GET /api/v1/assets` | List assets |
| `GET /api/v1/contracts` | List contracts |
| `GET /api/v1/isnad-forms` | List ISNAD forms |
| `GET /api/v1/dashboard/stats` | Dashboard statistics |
| `GET /health/ready` | Readiness check |

## Security

- JWT authentication with refresh tokens
- Permission-based authorization (RBAC)
- Account lockout after 5 failed attempts
- Rate limiting (5 auth requests per 5 minutes)
- Password complexity requirements (12+ chars)
- CORS protection with specific origins
- Security headers (CSP, X-Frame-Options, etc.)

## Testing

```bash
cd server-dotnet

# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## Deployment

### Docker

```bash
# Build images
docker build -t user-manager-api -f Dockerfile .
docker build -t user-manager-client -f Dockerfile.client .

# Run with docker-compose
docker compose up
```

### Google Cloud Platform

See [infra/README.md](infra/README.md) for Terraform deployment.

```bash
cd infra
terraform init
terraform plan
terraform apply
```

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [RUNBOOK.md](RUNBOOK.md) - Operations runbook
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Production readiness
- [infra/README.md](infra/README.md) - Infrastructure setup

## Health Checks

| Endpoint | Description |
|----------|-------------|
| `/health` | Overall health |
| `/health/ready` | Readiness (DB + Redis) |
| `/health/live` | Liveness |

## Monitoring

- **Metrics**: OpenTelemetry + Prometheus format
- **Tracing**: OpenTelemetry (OTLP export)
- **Logging**: Serilog (structured JSON)

Configure OTLP endpoint:
```json
{
  "OpenTelemetry": {
    "OtlpEndpoint": "http://collector:4317"
  }
}
```

## License

Proprietary - All rights reserved
