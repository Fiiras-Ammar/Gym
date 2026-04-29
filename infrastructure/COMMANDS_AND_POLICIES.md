# Infrastructure - Commands, Policies & Troubleshooting

## Project: Gymx3
- **Project ID**: gymx3-494520
- **Region**: europe-west4
- **Services**: Cloud Run + Cloud SQL + Artifact Registry

---

## Required APIs Enabled

```bash
gcloud services enable compute.googleapis.com
ngcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable servicenetworking.googleapis.com
gcloud services enable vpcaccess.googleapis.com
gcloud services enable logging.googleapis.com
```

---

## IAM Policies Added (Complete List)

### Cloud Build Service Account
```bash
gcloud projects add-iam-policy-binding gymx3-494520 \
  --member=serviceAccount:34130610305@cloudbuild.gserviceaccount.com \
  --role=roles/run.admin

gcloud projects add-iam-policy-binding gymx3-494520 \
  --member=serviceAccount:34130610305@cloudbuild.gserviceaccount.com \
  --role=roles/cloudsql.client

gcloud projects add-iam-policy-binding gymx3-494520 \
  --member=serviceAccount:34130610305@cloudbuild.gserviceaccount.com \
  --role=roles/storage.objectAdmin

gcloud projects add-iam-policy-binding gymx3-494520 \
  --member=serviceAccount:34130610305@cloudbuild.gserviceaccount.com \
  --role=roles/artifactregistry.writer
```

### Compute Service Account
```bash
gcloud projects add-iam-policy-binding gymx3-494520 \
  --member=serviceAccount:34130610305-compute@developer.gserviceaccount.com \
  --role=roles/storage.objectAdmin

gcloud projects add-iam-policy-binding gymx3-494520 \
  --member=serviceAccount:34130610305-compute@developer.gserviceaccount.com \
  --role=roles/artifactregistry.writer

gcloud projects add-iam-policy-binding gymx3-494520 \
  --member=serviceAccount:34130610305-compute@developer.gserviceaccount.com \
  --role=roles/logging.logWriter
```

---

## Terraform Commands

### Initial Setup
```bash
cd infrastructure/terraform-cloudrun

# Initialize
gcloud config set project gymx3-494520
gcloud auth application-default login
terraform init

# Deploy infrastructure
terraform apply -auto-approve
```

### Troubleshooting Terraform
```bash
# View state
terraform state list

# Remove stuck resource
terraform state rm [RESOURCE_NAME]

# Clean slate (WARNING: destroys everything)
terraform destroy -auto-approve
rm terraform.tfstate*
terraform init
terraform apply -auto-approve
```

---

## Cloud Build Commands

### Build & Deploy
```bash
# From project root
gcloud builds submit --config cloudbuild.yaml
```

### View Build History
```bash
gcloud builds list --limit=10
gcloud builds log [BUILD_ID]
```

### Retry Failed Build
```bash
# Get build ID from failed build
gcloud builds list --filter="status=FAILURE"
gcloud builds retry [BUILD_ID]
```

---

## Cloud Run Commands

### Deploy Services
```bash
# Backend
gcloud run deploy gym-backend \
  --image europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/backend:latest \
  --region europe-west4 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="MONGO_URI=mongodb+srv://..."

# Frontend
gcloud run deploy gym-frontend \
  --image europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/frontend:latest \
  --region europe-west4 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

### Service Management
```bash
# List services
gcloud run services list --region europe-west4

# Describe service
gcloud run services describe gym-backend --region europe-west4

# View revisions
gcloud run revisions list --service gym-backend --region europe-west4

# Update environment variables
gcloud run services update gym-backend \
  --region europe-west4 \
  --set-env-vars="KEY=value"
```

---

## Artifact Registry Commands

```bash
# List repositories
gcloud artifacts repositories list --location=europe-west4

# List images
gcloud artifacts docker images list europe-west4-docker.pkg.dev/gymx3-494520/gym-repo

# Delete old images (cleanup)
gcloud artifacts docker images delete europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/backend:latest
```

---

## Problem Solving Matrix

| Error | Cause | Solution |
|-------|-------|----------|
| `SERVICE_DISABLED` | API not enabled | `gcloud services enable [API]` |
| `403 artifactregistry.repositories.uploadArtifacts` | Missing IAM | Add `roles/artifactregistry.writer` |
| `403 storage.objects.get` | Cloud Build storage | Add `roles/storage.objectAdmin` |
| `Image not found` | Build failed | Check `gcloud builds list` |
| `Insufficient quota` | SSD limit | Use `pd-standard` disks |
| `SERVICE_DISABLED` (Cloud Run) | API not enabled | `gcloud services enable run.googleapis.com` |

---

## Complete Deployment Steps

```bash
# 1. Set project
gcloud config set project gymx3-494520

# 2. Enable APIs
gcloud services enable compute.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com servicenetworking.googleapis.com logging.googleapis.com

# 3. Add IAM policies (see above)

# 4. Deploy infrastructure
cd infrastructure/terraform-cloudrun
terraform init
terraform apply -auto-approve

# 5. Build and deploy application
cd ../..
gcloud builds submit --config cloudbuild.yaml

# 6. Verify deployment
gcloud run services list --region europe-west4
```

---

## URLs After Deployment

| Service | URL |
|---------|-----|
| Backend | https://gym-backend-34130610305.europe-west4.run.app |
| Frontend | https://gym-frontend-34130610305.europe-west4.run.app |
| GCP Console | https://console.cloud.google.com/run?project=gymx3-494520 |
| Cloud Build History | https://console.cloud.google.com/cloud-build/builds?project=gymx3-494520 |
