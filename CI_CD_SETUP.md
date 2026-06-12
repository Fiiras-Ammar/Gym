# CI/CD Pipeline Setup Documentation

This document describes the GitHub Actions CI/CD pipeline implemented for automatic deployment to Google Cloud Run.

## Overview

The pipeline automatically builds, tests, and deploys the application on every push to the `main` branch.

```
Code Push → Test Frontend → Test Backend → Build Images → Push to Registry → Deploy to Cloud Run
```

## Files Created

### 1. `.github/workflows/ci-cd.yml`
Main workflow file with 3 jobs:
- **test-frontend**: Runs ESLint, Vitest tests, and build verification
- **test-backend**: Runs Django system checks
- **build-and-deploy**: Builds Docker images and deploys to Cloud Run (only on main branch)

### 2. `.github/workflows/README.md`
Detailed setup instructions for the CI/CD pipeline.

## GCP Resources Configured

### Workload Identity Federation (Secure Authentication)
- **Pool**: `github-pool` (global)
- **Provider**: `github-provider` with OIDC
- **Attribute Condition**: `assertion.repository=='Fiiras-Ammar/Gym'`
- **State**: ACTIVE

### Service Account
- **Name**: `github-actions@gymx3-494520.iam.gserviceaccount.com`
- **Roles**:
  - `roles/run.admin` - Deploy Cloud Run services
  - `roles/artifactregistry.writer` - Push Docker images
  - `roles/iam.serviceAccountUser` - Act as runtime service account

## GitHub Secrets Required

Add these in your GitHub repo: `Settings → Secrets and variables → Actions`

| Secret Name | Value |
|-------------|-------|
| `WIF_PROVIDER` | `projects/34130610305/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | `github-actions@gymx3-494520.iam.gserviceaccount.com` |
| `MONGO_URI` | (your MongoDB connection string) |

## Setup Commands Used

### Enable APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable iamcredentials.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

### Create Workload Identity Pool
```bash
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

### Create OIDC Provider
```bash
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository=='Fiiras-Ammar/Gym'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

### Create Service Account
```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployer" \
  --description="Service account for CI/CD pipeline"
```

### Grant Permissions
```bash
gcloud projects add-iam-policy-binding gymx3-494520 \
  --member="serviceAccount:github-actions@gymx3-494520.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding gymx3-494520 \
  --member="serviceAccount:github-actions@gymx3-494520.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding gymx3-494520 \
  --member="serviceAccount:github-actions@gymx3-494520.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### Allow GitHub Actions to Impersonate Service Account
```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@gymx3-494520.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/34130610305/locations/global/workloadIdentityPools/github-pool/attribute.repository/Fiiras-Ammar/Gym"
```

## Pipeline Workflow

### Trigger Events
- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch

### Jobs

#### 1. test-frontend
- Checkout code
- Setup Node.js 20
- Install dependencies (`npm ci`)
- Run linter (`npm run lint`)
- Run tests (`npm run test`)
- Build verification (`npm run build`)

#### 2. test-backend
- Checkout code
- Setup Python 3.11
- Install dependencies (`pip install -r requirements.txt`)
- Run Django checks (`python manage.py check`)

#### 3. build-and-deploy
**Only runs on main branch after tests pass**
- Authenticate to GCP using Workload Identity Federation
- Configure Docker for Artifact Registry
- Build backend Docker image (`infrastructure/docker/backend.Dockerfile`)
- Build frontend Docker image (`infrastructure/docker/frontend.Dockerfile`)
- Push images with git SHA and `latest` tags
- Deploy `gym-backend` to Cloud Run
- Deploy `gym-frontend` to Cloud Run
- Output deployment URLs

## Images and Registry

- **Project ID**: `gymx3-494520`
- **Region**: `europe-west4`
- **Repository**: `europe-west4-docker.pkg.dev/gymx3-494520/gym-repo`
- **Backend Image**: `europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/backend`
- **Frontend Image**: `europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/frontend`

## Deployment Configuration

### Backend (gym-backend)
- Platform: Managed
- Region: europe-west4
- Authentication: Unauthenticated
- Environment Variables:
  - `MONGO_URI` (from GitHub secret)
  - `DJANGO_SETTINGS_MODULE=macroscanner.settings`

### Frontend (gym-frontend)
- Platform: Managed
- Region: europe-west4
- Authentication: Unauthenticated
- Port: 8080

## Monitoring Deployments

View pipeline runs at: `https://github.com/Fiiras-Ammar/Gym/actions`

## Verification Commands

### Check Workload Identity Pool
```bash
gcloud iam workload-identity-pools list --location="global"
```

### Check Provider
```bash
gcloud iam workload-identity-pools providers list \
  --workload-identity-pool="github-pool" \
  --location="global"
```

### Check Service Account Permissions
```bash
gcloud projects get-iam-policy gymx3-494520 \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:github-actions@gymx3-494520.iam.gserviceaccount.com"
```

## Notes

- Pipeline uses **Workload Identity Federation** (no long-lived service account keys)
- Images are tagged with both git SHA (immutable) and `latest`
- Tests must pass before deployment
- Deployment only happens on `main` branch pushes, not on pull requests
