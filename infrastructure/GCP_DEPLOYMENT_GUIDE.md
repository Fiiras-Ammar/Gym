# GCP Infrastructure Deployment Guide

This guide provides Cloud Run deployment for your Macro Scanner application on Google Cloud Platform using Infrastructure as Code (Terraform).

**We use Cloud Run** - Serverless, pay-per-request, auto-scaling with low complexity.

---

## Quick Start - Single Command Deploy

### Cloud Run (Serverless) - Full Infrastructure in One Command
```powershell
# From project root - provisions ALL infrastructure + builds + deploys
cd infrastructure/terraform-cloudrun; terraform apply -auto-approve
```

**This single command will:**
1. Enable all required GCP APIs
2. Create VPC network
3. Provision Cloud SQL (Postgres)
4. Create Artifact Registry
5. **Build and push Docker images** (via Cloud Build)
6. Deploy Cloud Run services (backend + frontend)
7. Configure public access (IAM)

---

## Pre-Deployment: GCP Console GUI Setup

### Step 1: Create GCP Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click project selector → **New Project**
3. Enter project name: `macro-scanner-prod`
4. Note the **Project ID** (you'll need this)

### Step 2: Enable Billing
1. Go to **Billing** → Link a billing account
2. Set up budget alerts (recommended: $50/month limit)

### Step 3: Enable APIs (GUI Method)
Navigate to **APIs & Services** → **Library** and enable:
- Compute Engine API
- Cloud SQL Admin API
- Cloud Run API
- Cloud Build API
- Artifact Registry API

**OR use gcloud CLI:**
```powershell
gcloud services enable compute.googleapis.com sqladmin.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

### Step 4: Create Service Account (for CI/CD)
1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: `terraform-deployer`
4. Roles to grant:
   - Editor
   - Cloud SQL Admin
   - Cloud Run Admin
   - Storage Admin
   - Artifact Registry Writer
5. Create and download JSON key

---

## Pre-Deployment: Local Setup

### Install Tools (Windows)
```powershell
# Install gcloud CLI
# Download: https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe

# Install Terraform
# Download: https://developer.hashicorp.com/terraform/downloads
# Extract to C:\terraform and add to PATH

# Install Docker Desktop
# Download: https://www.docker.com/products/docker-desktop

# Verify installations
gcloud --version
terraform --version
docker --version
```

### Authenticate
```powershell
# Login to GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default login

# Configure Docker
gcloud auth configure-docker
```

---

## Deployment: Cloud Run (Detailed)

### Architecture
- **Cloud Run Services**: Auto-scaling containers (provisioned by Terraform)
- **Cloud SQL**: PostgreSQL 15 (provisioned by Terraform)
- **VPC**: Private network for database connectivity (provisioned by Terraform)
- **Artifact Registry**: Docker image storage (provisioned by Terraform)
- **Cloud Build**: Triggered automatically by Terraform to build images

### Single Command IaC Deployment

```powershell
cd infrastructure/terraform-cloudrun
terraform init
terraform apply -auto-approve
```

**What happens:**
1. **APIs Enabled** - Cloud Run, Cloud SQL, VPC, Artifact Registry, Cloud Build
2. **Network** - VPC with private connectivity for Cloud SQL
3. **Database** - PostgreSQL 15 with user/database configured
4. **Registry** - Artifact Registry repository created
5. **Build** - Cloud Build triggers, builds and pushes Docker images
6. **Deploy** - Cloud Run services created with latest images
7. **Permissions** - Services made publicly accessible

### Manual Alternative (if needed)
If you need to deploy manually without Terraform managing the build:
```powershell
# Build and push images
docker build -t gcr.io/YOUR_PROJECT_ID/backend:latest -f infrastructure/docker/backend.Dockerfile .
docker push gcr.io/YOUR_PROJECT_ID/backend:latest
docker build -t gcr.io/YOUR_PROJECT_ID/frontend:latest -f infrastructure/docker/frontend.Dockerfile .
docker push gcr.io/YOUR_PROJECT_ID/frontend:latest

# Deploy to Cloud Run
gcloud run deploy gym-backend --image gcr.io/YOUR_PROJECT_ID/backend:latest --region us-central1
gcloud run deploy gym-frontend --image gcr.io/YOUR_PROJECT_ID/frontend:latest --region us-central1
```

### GCP Console GUI - Cloud Run
1. Go to **Cloud Run** in console
2. See deployed services with URLs
3. Click service name to view:
   - Logs
   - Metrics
   - Revisions
   - Variables & Secrets
4. Use **Traffic** tab for split deployments

---

## Post-Deployment Verification

### Check Services
```powershell
# Cloud Run
gcloud run services list
```

### Database Connection
```powershell
# Connect to Cloud SQL
gcloud sql connect macro-scanner-db --user=macroscanner_user

# Verify tables
\dt
```

### View Logs
**GUI:** Go to **Logging** → **Logs Explorer**

**CLI:**
```powershell
# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision"
```

---

## Cleanup & Destroy

To avoid charges, destroy infrastructure when done:

```powershell
# Cloud Run
cd infrastructure/terraform-cloudrun
terraform destroy -auto-approve

# Delete Cloud Run services manually if needed
gcloud run services delete gym-backend --region europe-west4 --quiet
gcloud run services delete gym-frontend --region europe-west4 --quiet
```

---

## Cost Estimates (Monthly)

| Resource | Cloud Run |
|----------|-----------|
| Compute | ~$0-50 (scale to 0) |
| Database | ~$7-15 |
| Storage | ~$5 |
| Network | ~$5-10 |
| **Total** | **~$20-80** |

---

## Troubleshooting

### Terraform Issues
```powershell
# Re-initialize
terraform init -reconfigure

# State issues
terraform state list
terraform state rm RESOURCE

# Lock issues
terraform force-unlock LOCK_ID
```

### Docker Issues
```powershell
# Clean build
docker system prune -a
docker build --no-cache -t ...

# Push issues
gcloud auth configure-docker
docker login gcr.io
```

### Cloud Run Issues
```powershell
# Check service
gcloud run services describe macro-scanner-backend --region us-central1

# View logs
gcloud logging read "resource.labels.service_name=macro-scanner-backend"
```

---

## Security Best Practices

1. **Use Secret Manager for credentials** (not env vars)
2. **Use private Cloud SQL** with VPC connector
3. **Enable Cloud Audit Logs**
4. **Set up IAM least privilege**

---

## Files Created

```
infrastructure/
├── terraform-cloudrun/           # Cloud Run + Cloud SQL
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.conf
├── deploy-cloudrun.ps1
└── COMMANDS_AND_POLICIES.md      # Operational commands
```

---

## Next Steps

1. Set up **Cloud Build** for CI/CD
2. Configure **Cloud Monitoring** alerts
3. Set up **Cloud CDN** for static assets
4. Configure **Cloud DNS** for custom domain
