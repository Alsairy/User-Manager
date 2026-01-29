# User-Manager Infrastructure

Terraform configuration for deploying User-Manager to Google Cloud Platform.

## Architecture

- **Cloud Run**: Serverless containers for API and frontend
- **Cloud SQL**: SQL Server database
- **Memorystore (Redis)**: Caching layer
- **Secret Manager**: Secure storage for credentials
- **Cloud Armor**: WAF protection (OWASP rules)
- **VPC**: Private networking for database and Redis
- **Artifact Registry**: Docker image storage
- **Cloud Monitoring**: Dashboards and alerting
- **Cloud Build**: CI/CD pipelines (optional)

## Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. [Terraform >= 1.5](https://www.terraform.io/downloads)
3. GCP Project with billing enabled
4. Service account with owner/editor permissions

## Quick Start

### 1. Initialize

```bash
# Authenticate with GCP
gcloud auth application-default login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Create state bucket (one-time)
gsutil mb -l me-central1 gs://user-manager-tf-state
```

### 2. Configure

```bash
# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

### 3. Deploy

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply infrastructure
terraform apply
```

### 4. Set Secrets

After deployment, set the secret values:

```bash
# Database password
echo -n "YOUR_DB_PASSWORD" | gcloud secrets versions add db-password --data-file=-

# JWT signing key (min 32 characters)
echo -n "YOUR_SECURE_JWT_KEY_AT_LEAST_32_CHARS" | gcloud secrets versions add jwt-key --data-file=-

# Database connection string
echo -n "Server=PRIVATE_IP;Database=UserManager;User Id=sqlserver;Password=YOUR_DB_PASSWORD;TrustServerCertificate=True" | gcloud secrets versions add db-connection --data-file=-

# Elsa connection string
echo -n "Server=PRIVATE_IP;Database=UserManager_Elsa;User Id=sqlserver;Password=YOUR_DB_PASSWORD;TrustServerCertificate=True" | gcloud secrets versions add elsa-connection --data-file=-

# Redis connection string
echo -n "REDIS_HOST:6379" | gcloud secrets versions add redis-connection --data-file=-

# SendGrid API key
echo -n "SG.YOUR_SENDGRID_API_KEY" | gcloud secrets versions add sendgrid-api-key --data-file=-
```

### 5. Build and Deploy Containers

```bash
# Get registry URL
REGISTRY=$(terraform output -raw artifact_registry)

# Build and push API
docker build -t $REGISTRY/user-manager-api:latest -f ../Dockerfile ..
docker push $REGISTRY/user-manager-api:latest

# Build and push Client
docker build -t $REGISTRY/user-manager-client:latest -f ../Dockerfile.client ..
docker push $REGISTRY/user-manager-client:latest

# Deploy to Cloud Run
gcloud run deploy user-manager-api \
  --image $REGISTRY/user-manager-api:latest \
  --region me-central1

gcloud run deploy user-manager-client \
  --image $REGISTRY/user-manager-client:latest \
  --region me-central1
```

## Environments

| Variable | Staging | Production |
|----------|---------|------------|
| `environment` | staging | production |
| SQL availability | ZONAL | REGIONAL |
| Redis tier | BASIC | STANDARD_HA |
| Min instances | 0 | 1 |
| Max instances | 3 | 10 |
| Deletion protection | No | Yes |
| Backup PITR | No | Yes |
| Log retention | 30 days | 365 days |

## Outputs

After deployment, view important values:

```bash
terraform output api_url        # API endpoint
terraform output client_url     # Frontend endpoint
terraform output redis_host     # Redis connection
terraform output artifact_registry  # Docker registry URL
```

## Cost Estimation (Monthly)

| Resource | Staging | Production |
|----------|---------|------------|
| Cloud SQL | ~$50 | ~$150 |
| Cloud Run (API) | ~$10 | ~$50 |
| Cloud Run (Client) | ~$5 | ~$20 |
| Redis | ~$30 | ~$100 |
| VPC Connector | ~$10 | ~$10 |
| **Total** | **~$105** | **~$330** |

*Costs vary by usage. Use the [GCP Pricing Calculator](https://cloud.google.com/products/calculator) for accurate estimates.*

## Security Features

- **Cloud Armor WAF**: XSS, SQLi, LFI, RFI, RCE protection
- **Rate Limiting**: 1000 req/min per IP
- **Private VPC**: Database and Redis on private network
- **Secret Manager**: Encrypted credential storage
- **Service Account**: Least-privilege access for Cloud Run
- **Audit Logging**: Security events to Cloud Storage

## Monitoring

Access the dashboard at:
```
https://console.cloud.google.com/monitoring/dashboards?project=YOUR_PROJECT_ID
```

Alert policies are created for:
- Error rate > 1%
- P95 latency > 2s
- Uptime check failures

## Cleanup

To destroy all resources:

```bash
# WARNING: This will delete all data!
terraform destroy
```

Note: Production environments have deletion protection enabled. Disable it first:

```bash
terraform apply -var="environment=staging"
terraform destroy
```
