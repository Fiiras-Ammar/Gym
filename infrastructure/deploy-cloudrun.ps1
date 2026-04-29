# Cloud Run Deployment Script
param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    [string]$Region = "us-central1"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Macro Scanner Cloud Run Deployment ===" -ForegroundColor Green

# 1. GCP Auth
Write-Host "Step 1: Authenticating..." -ForegroundColor Yellow
gcloud auth login
gcloud config set project $ProjectId
gcloud auth application-default login

# 2. Terraform
Write-Host "Step 2: Provisioning infrastructure..." -ForegroundColor Yellow
Set-Location infrastructure/terraform-cloudrun

$DbPassword = Read-Host "Enter database password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DbPassword)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

terraform init
terraform apply -auto-approve -var="project_id=$ProjectId" -var="region=$Region" -var="db_password=$PlainPassword"

$backendUrl = terraform output -raw backend_url
$frontendUrl = terraform output -raw frontend_url
Set-Location ../..

# 3. Docker Build & Push
Write-Host "Step 3: Building containers..." -ForegroundColor Yellow
gcloud auth configure-docker

docker build -t gcr.io/$ProjectId/backend:latest -f infrastructure/docker/backend.Dockerfile .
docker push gcr.io/$ProjectId/backend:latest

docker build -t gcr.io/$ProjectId/frontend:latest -f infrastructure/docker/frontend.Dockerfile .
docker push gcr.io/$ProjectId/frontend:latest

# 4. Deploy to Cloud Run
Write-Host "Step 4: Deploying services..." -ForegroundColor Yellow
gcloud run deploy macro-scanner-backend `
    --image gcr.io/$ProjectId/backend:latest `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars="DATABASE_URL=postgres://macroscanner_user:${PlainPassword}@/macroscanner?host=/cloudsql/${ProjectId}:${Region}:macro-scanner-db"

gcloud run deploy macro-scanner-frontend `
    --image gcr.io/$ProjectId/frontend:latest `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars="API_URL=$backendUrl"

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan
