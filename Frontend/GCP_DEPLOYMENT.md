# Frontend - GCP Deployment Guide

## Project Configuration
- **Project ID**: gymx3-494520
- **Region**: europe-west4 (Netherlands)
- **Service Name**: gym-frontend
- **URL**: https://gym-frontend-34130610305.europe-west4.run.app

---

## Important Commands

### Build & Deploy
```bash
# Build frontend image locally
docker build -t europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/frontend:latest -f infrastructure/docker/frontend.Dockerfile .

# Push to Artifact Registry
docker push europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/frontend:latest

# Deploy to Cloud Run
gcloud run deploy gym-frontend \
  --image europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/frontend:latest \
  --region europe-west4 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

### Cloud Build (Recommended)
```bash
# Full build + deploy from project root
gcloud builds submit --config cloudbuild.yaml
```

### Local Development
```bash
# Install dependencies
npm ci

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Configuration Changes Made

### 1. Frontend Dockerfile Updates
```dockerfile
# Using Node 20 (not 18) for @supabase/glob compatibility
FROM node:20-alpine as builder

# Added execution permissions fix
RUN chmod -R +x node_modules/.bin
```

### 2. Environment Variables (.env)
```bash
# Changed from localhost to relative path
VITE_API_URL=/api
```

### 3. API Client (src/lib/api.ts)
```typescript
const API_URL = import.meta.env.VITE_API_URL || "/api";
```

### 4. Nginx Configuration (infrastructure/docker/nginx.conf)
```nginx
listen 8080;  # Changed from 80 for Cloud Run
server_name _;  # Wildcard for Cloud Run

location /api/ {
    proxy_pass https://gym-backend-34130610305.europe-west4.run.app;
    proxy_set_header Host gym-backend-34130610305.europe-west4.run.app;
}
```

---

## Problem Solving

### "vite: Permission denied" (Status 126)
```dockerfile
# Added to Dockerfile
RUN chmod -R +x node_modules/.bin
```

### Build Fails with Node 18
```dockerfile
# Use Node 20 instead
FROM node:20-alpine as builder
```

### API Calls Failing (CORS)
- Check backend `ALLOWED_HOSTS` includes frontend URL
- Verify `CORS_ALLOWED_ORIGINS` in backend settings
- Check browser console for exact error

### Port Issues in Cloud Run
```bash
# Frontend must listen on 8080
gcloud run deploy gym-frontend --port 8080 ...
```

---

## View Logs
```bash
# Cloud Run logs
gcloud logging read "resource.labels.service_name=gym-frontend" --limit=50

# Cloud Build logs
gcloud builds list
gcloud builds log [BUILD_ID]
```

---

## Troubleshooting Checklist

| Issue | Solution |
|-------|----------|
| White screen | Check API_URL, verify build succeeded |
| 404 on refresh | Nginx try_files config working |
| CORS errors | Check backend ALLOWED_HOSTS/CORS settings |
| Build fails | Use Node 20, check chmod permissions |
| Image not found | Verify Artifact Registry push succeeded |
