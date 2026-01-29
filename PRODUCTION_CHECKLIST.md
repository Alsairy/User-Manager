# Production Checklist

## Pre-Deployment

### Infrastructure
- [ ] GCP project created with billing enabled
- [ ] Terraform state bucket created
- [ ] `terraform apply` completed successfully
- [ ] Cloud SQL instance accessible from Cloud Run
- [ ] Redis (Memorystore) accessible from Cloud Run
- [ ] Artifact Registry contains latest images

### Secrets
- [ ] `db-password` secret set in Secret Manager
- [ ] `jwt-key` secret set (min 32 characters, secure random)
- [ ] `db-connection` secret set with production connection string
- [ ] `elsa-connection` secret set
- [ ] `redis-connection` secret set
- [ ] `sendgrid-api-key` secret set (if email enabled)

### Configuration
- [ ] `ASPNETCORE_ENVIRONMENT` = Production
- [ ] `Jwt__SigningKey` is unique per environment
- [ ] `Email__Enabled` = true for production
- [ ] `Seed__Enabled` = false for production
- [ ] `AllowedHosts` configured to production domains
- [ ] CORS origins set to production frontend URL

## Security

### Authentication & Authorization
- [ ] JWT signing key is cryptographically random (min 32 chars)
- [ ] Access token expiry is 30 minutes or less
- [ ] Refresh token expiry is 7 days or less
- [ ] Account lockout enabled (5 attempts, 15 min lockout)
- [ ] All endpoints require authentication (except login, health)
- [ ] Permission-based authorization on all controllers

### Network Security
- [ ] HTTPS enforced (HSTS enabled)
- [ ] Cloud Armor WAF rules enabled
- [ ] Rate limiting configured (5 auth requests per 5 minutes)
- [ ] CORS restricted to specific origins
- [ ] VPC network for private database access

### Password & Secrets
- [ ] Password complexity enforced (12+ chars, uppercase, lowercase, digit, special)
- [ ] No secrets in source control
- [ ] All secrets use Secret Manager
- [ ] Database encryption enabled

## Database

- [ ] Migrations applied to production database
- [ ] Database backups enabled
- [ ] Point-in-time recovery enabled (production)
- [ ] Connection pooling configured
- [ ] Database user has minimum required permissions

## Monitoring & Observability

### Health Checks
- [ ] `/health/live` returns 200
- [ ] `/health/ready` returns 200 (database + Redis connected)
- [ ] Uptime checks configured in Cloud Monitoring

### Alerts
- [ ] Error rate > 1% alert configured
- [ ] P95 latency > 2s alert configured
- [ ] Uptime check failure alert configured
- [ ] Database connection failure alert configured
- [ ] Notification channels configured (email, Slack, PagerDuty)

### Logging
- [ ] Serilog configured for structured logging
- [ ] Log level set to Information (not Debug)
- [ ] Sensitive data not logged
- [ ] Audit logs stored securely

### Tracing
- [ ] OpenTelemetry OTLP endpoint configured
- [ ] Trace sampling appropriate for production
- [ ] Service name and version set correctly

## Performance

- [ ] Redis caching enabled
- [ ] Response compression enabled
- [ ] Static file caching headers set
- [ ] Database connection string includes retry policy
- [ ] Minimum instance count = 1 for production

## CI/CD

- [ ] CI pipeline passes all tests
- [ ] Security scan completed (no high/critical vulnerabilities)
- [ ] Container images scanned for vulnerabilities
- [ ] Database migration tested in staging
- [ ] Rollback procedure documented and tested

## Operations

- [ ] RUNBOOK.md reviewed and updated
- [ ] On-call rotation established
- [ ] Escalation procedures documented
- [ ] Incident response playbook ready
- [ ] DNS configured for custom domain
- [ ] SSL certificates valid (auto-renewed by Cloud Run)

## Testing

- [ ] Integration tests pass against staging
- [ ] Load testing completed
- [ ] Smoke tests pass after deployment
- [ ] Critical user flows verified manually

## Post-Deployment

- [ ] Health checks passing
- [ ] No errors in logs
- [ ] Metrics being collected
- [ ] First admin user created
- [ ] Email delivery verified
- [ ] Workflows executing correctly

## Maintenance

- [ ] Backup restoration tested quarterly
- [ ] Security patches applied monthly
- [ ] Dependencies updated quarterly
- [ ] Access reviews completed quarterly
- [ ] Logs retained per policy (365 days production)
