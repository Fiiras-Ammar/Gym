terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "servicenetworking.googleapis.com",
    "vpcaccess.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

# VPC for Cloud SQL
resource "google_compute_network" "vpc" {
  name                    = "gym-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.apis]
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "gym-repo"
  description   = "Docker repository for Gym application"
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

# Cloud SQL PostgreSQL
resource "google_sql_database_instance" "main" {
  name             = "gym-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro"
    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name  = "allow-all"
        value = "0.0.0.0/0"
      }
    }
  }
  deletion_protection = false
}

resource "google_sql_database" "app" {
  name     = "gymdb"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "app" {
  name     = "gym_user"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

# Cloud Run Backend Service
resource "google_cloud_run_service" "backend" {
  name     = "gym-backend"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/gym-repo/backend:latest"
        ports {
          container_port = 8080
        }
        env {
          name  = "DATABASE_URL"
          value = "postgres://${google_sql_user.app.name}:${var.db_password}@/${google_sql_database.app.name}?host=/cloudsql/${var.project_id}:${var.region}:${google_sql_database_instance.main.name}"
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "run.googleapis.com/cloudsql-instances" = "${var.project_id}:${var.region}:${google_sql_database_instance.main.name}"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Cloud Run Frontend Service
resource "google_cloud_run_service" "frontend" {
  name     = "gym-frontend"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/gym-repo/frontend:latest"
        ports {
          container_port = 8080
        }
        env {
          name  = "API_URL"
          value = google_cloud_run_service.backend.status[0].url
        }
      }
    }
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_cloud_run_service.backend]
}

# Make services public
resource "google_cloud_run_service_iam_member" "backend_public" {
  service  = google_cloud_run_service.backend.name
  location = google_cloud_run_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_service.frontend.name
  location = google_cloud_run_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
