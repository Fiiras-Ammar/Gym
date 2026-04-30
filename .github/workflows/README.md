# CI/CD Pipeline Setup

This GitHub Actions workflow automatically builds, tests, and deploys the application to Google Cloud Run on every push to the main branch.

## Workflow Overview

```
Code Push → Run Tests → Build Images → Push to Registry → Deploy to Cloud Run
```

### Jobs:
1. **test-frontend**: Runs linter and tests for the React frontend
2. **test-backend**: Runs Django checks for the backend
3. **build-and-deploy**: Builds Docker images and deploys to Cloud Run (only on main branch)

## Required GitHub Secrets

Configure these secrets in your GitHub repository (`Settings → Secrets and variables → Actions`):

| Secret | Description | How to Get It |
|--------|-------------|---------------|
| `WIF_PROVIDER` | Workload Identity Provider resource name | Create Workload Identity Federation pool |
| `GCP_SERVICE_ACCOUNT` | Service account email for GitHub Actions | Create dedicated SA with Cloud Run deploy permissions |
| `MONGO_URI` | MongoDB connection string | Your existing MongoDB Atlas URI |

## GCP Setup Instructions

### 1. Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable iamcredentials.googleapis.com
```

### 2. Create Workload Identity Federation Pool

```bash
# Create the pool
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create the provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

### 3. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployer"

# Grant permissions
gcloud projects add-iam-policy-binding gymx3-494520 \
  --member="serviceAccount:github-actions@gymx3-494520.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding gymx3-494520 \
  --member="serviceAccount:github-actions@gymx3-494520.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Allow GitHub Actions to impersonate this SA
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@gymx3-494520.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"
```

### 4. Get Workload Identity Provider Resource Name

```bash
gcloud iam workload-identity-pools providers describe github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)"
```

Copy this value to the `WIF_PROVIDER` secret.

## Alternative: Using Service Account Key (Less Secure)

If Workload Identity Federation is not available, you can use a service account key:

1. Create and download a service account key JSON
2. Add it as `GCP_SA_KEY` secret
3. Modify the workflow to use:
   ```yaml
   - uses: google-github-actions/auth@v2
     with:
       credentials_json: ${{ secrets.GCP_SA_KEY }}
   ```

## Pipeline Triggers

- **Push to main/master**: Full pipeline (tests + build + deploy)
- **Pull Request to main/master**: Tests only (no deployment)

## Monitoring Deployments

View workflow runs in GitHub:
- Go to `Actions` tab in your repository
- Click on a workflow run to see detailed logs

## Rollback

To rollback to a previous version:
```bash
gcloud run services update-traffic gym-backend --to-revisions LATEST=0,PREVIOUS_REVISION=100 --region europe-west4
gcloud run services update-traffic gym-frontend --to-revisions LATEST=0,PREVIOUS_REVISION=100 --region europe-west4
```
