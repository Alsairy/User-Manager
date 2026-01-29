output "api_url" {
  description = "Cloud Run API URL"
  value       = google_cloud_run_v2_service.api.uri
}

output "client_url" {
  description = "Cloud Run Client URL"
  value       = google_cloud_run_v2_service.client.uri
}

output "db_instance_name" {
  description = "Cloud SQL Instance Name"
  value       = google_sql_database_instance.main.name
}

output "db_connection_name" {
  description = "Cloud SQL Connection Name"
  value       = google_sql_database_instance.main.connection_name
}

output "artifact_registry" {
  description = "Artifact Registry URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}

output "redis_host" {
  description = "Redis Instance Host"
  value       = google_redis_instance.cache.host
}

output "redis_port" {
  description = "Redis Instance Port"
  value       = google_redis_instance.cache.port
}

output "service_account_email" {
  description = "Cloud Run Service Account Email"
  value       = google_service_account.cloud_run.email
}

output "vpc_network" {
  description = "VPC Network Name"
  value       = google_compute_network.vpc.name
}

output "waf_policy" {
  description = "Cloud Armor Security Policy Name"
  value       = google_compute_security_policy.waf.name
}

output "audit_logs_bucket" {
  description = "Audit Logs Storage Bucket"
  value       = google_storage_bucket.audit_logs.name
}
