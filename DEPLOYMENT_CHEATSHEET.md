# Quick Deployment Cheatsheet

## One-Command Deploy (After Setup)
```powershell
cd infrastructure/terraform-cloudrun; terraform apply -auto-approve
```

**This provisions ALL infrastructure + builds + deploys in one command**

## Complete Fresh Deploy (New Project)
```powershell
# 1. Set project
gcloud config set project gymx3-494520

# 2. Enable all APIs
gcloud services enable compute.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com servicenetworking.googleapis.com logging.googleapis.com

# 3. Add all IAM policies (copy from infrastructure/COMMANDS_AND_POLICIES.md)

# 4. Authenticate
gcloud auth application-default login

# 5. Single command deploy - provisions infrastructure + builds + deploys
cd infrastructure/terraform-cloudrun; terraform init; terraform apply -auto-approve
```

## Quick Diagnostics
```bash
# Check if services are running
gcloud run services list --region europe-west4

# View recent errors
gcloud logging read "severity>=ERROR" --limit=20

# Check build status
gcloud builds list --limit=5

# View backend logs
gcloud logging read "resource.labels.service_name=gym-backend" --limit=20

# View frontend logs
gcloud logging read "resource.labels.service_name=gym-frontend" --limit=20
```

## Update Single Service
```bash
# Redeploy just backend
gcloud run deploy gym-backend --image europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/backend:latest --region europe-west4

# Redeploy just frontend
gcloud run deploy gym-frontend --image europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/frontend:latest --region europe-west4
```

## Rollback
```bash
# List revisions
gcloud run revisions list --service gym-backend --region europe-west4

# Rollback to previous
gcloud run services update-traffic gym-backend --to-revisions [REVISION]=100 --region europe-west4
```

## Cleanup (Delete Everything)
```bash
# Delete Cloud Run services
gcloud run services delete gym-backend --region europe-west4 --quiet
gcloud run services delete gym-frontend --region europe-west4 --quiet

# Delete Cloud SQL
gcloud sql instances delete gym-db --quiet

# Delete Artifact Registry
gcloud artifacts repositories delete gym-repo --location=europe-west4 --quiet

# Terraform destroy
cd infrastructure/terraform-cloudrun
terraform destroy -auto-approve
```
