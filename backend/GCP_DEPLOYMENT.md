# Backend - GCP Deployment Guide

## Project Configuration
- **Project ID**: gymx3-494520
- **Region**: europe-west4 (Netherlands)
- **Service Name**: gym-backend
- **URL**: https://gym-backend-34130610305.europe-west4.run.app

---

## Important Commands

### Build & Deploy
```bash
# Build backend image locally (if Docker running)
docker build -t europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/backend:latest -f infrastructure/docker/backend.Dockerfile .

# Push to Artifact Registry
docker push europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/backend:latest

# Deploy to Cloud Run
gcloud run deploy gym-backend \
  --image europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/backend:latest \
  --region europe-west4 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="MONGO_URI=$MONGO_URI,DJANGO_SETTINGS_MODULE=macroscanner.settings"
```

### Cloud Build (Recommended)
```bash
# Full build + deploy from project root
gcloud builds submit --config cloudbuild.yaml
```

### View Logs
```bash
# Cloud Run logs
gcloud logging read "resource.labels.service_name=gym-backend" --limit=50

# Live tail
gcloud app logs tail -s gym-backend
```

### Update Environment Variables
```bash
gcloud run services update gym-backend \
  --region europe-west4 \
  --set-env-vars="DEBUG=False,SECRET_KEY=your-secret-key"
```

---

## IAM Policies Added

| Service Account | Role | Purpose |
|----------------|------|---------|
| 34130610305@cloudbuild.gserviceaccount.com | roles/run.admin | Deploy Cloud Run |
| 34130610305@cloudbuild.gserviceaccount.com | roles/cloudsql.client | Access Cloud SQL |
| 34130610305@cloudbuild.gserviceaccount.com | roles/storage.objectAdmin | Cloud Build storage |
| 34130610305@cloudbuild.gserviceaccount.com | roles/artifactregistry.writer | Push images |
| 34130610305-compute@developer.gserviceaccount.com | roles/artifactregistry.writer | Push images |
| 34130610305-compute@developer.gserviceaccount.com | roles/logging.logWriter | Write logs |

---

## Problem Solving

### Permission Denied (Artifact Registry)
```bash
# Add writer permission
gcloud projects add-iam-policy-binding gymx3-494520 \
  --member=serviceAccount:34130610305@cloudbuild.gserviceaccount.com \
  --role=roles/artifactregistry.writer
```

### Image Not Found
```bash
# List available images
gcloud artifacts docker images list europe-west4-docker.pkg.dev/gymx3-494520/gym-repo

# Verify build succeeded
gcloud builds list --limit=5
```

### Cloud Run Deployment Fails
```bash
# Check service status
gcloud run services describe gym-backend --region europe-west4

# View revision details
gcloud run revisions list --service gym-backend --region europe-west4
```

### Database Connection Issues
- Check `MONGO_URI` environment variable is set
- Verify MongoDB Atlas IP whitelist includes GCP IPs
- Check logs: `gcloud logging read "resource.labels.service_name=gym-backend"`

---

## Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| MONGO_URI | (set via gcloud or environment variable) | MongoDB connection string |
| DJANGO_SETTINGS_MODULE | macroscanner.settings | Django settings path |
| DEBUG | False | Production mode |
| SECRET_KEY | (set via gcloud) | Django secret |

---

## API Endpoints

Base URL: `https://gym-backend-34130610305.europe-west4.run.app/api`

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/login/ | POST | User login |
| /api/auth/register/ | POST | User registration |
| /api/users/me/ | GET | Current user profile |
| /api/nutrition/ | GET/POST | Nutrition entries |
| /api/workouts/ | GET/POST | Workout entries |
| /api/weight/ | GET/POST | Weight entries |
