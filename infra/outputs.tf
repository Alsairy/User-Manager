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
