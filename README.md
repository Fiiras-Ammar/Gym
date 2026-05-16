# Macro Scanner / Gym Infra
Infrastructure for the Macro Scanner / Gym app — Docker containerization, Google Cloud Run orchestration, and cloud provisioning via Terraform on Google Cloud Platform (GCP).

## Architecture
| Component | Technology | GCP Service |
| :--- | :--- | :--- |
| React frontend | Docker container | Cloud Run |
| Django API | Docker container | Cloud Run |
| Database | MongoDB / SQLite | DBaaS (via MONGO_URI) |
| Container registry | — | Artifact Registry |

All core infrastructure is provisioned with a single command: `terraform apply`

## Folder structure
```text
macro-scanner-kitchen/
├── backend/                  ← Django backend API
├── Frontend/                 ← React frontend (Vite)
├── infrastructure/           ← Terraform & Docker setup
│   ├── docker/               ← Dockerfiles for backend and frontend
│   │   ├── backend.Dockerfile
│   │   └── frontend.Dockerfile
│   └── terraform-cloudrun/   ← Terraform — provisions GCP infrastructure
│       ├── main.tf           ← all GCP resources defined here
│       ├── variables.tf      ← input variables
│       ├── outputs.tf        ← Service URLs
│       └── terraform.tfvars  ← your actual values (gitignored — never commit)
└── .github/
    └── workflows/
        └── ci-cd.yml         ← CI/CD pipeline for GitHub Actions
```

## Local setup
**Prerequisites**
- Node.js (v20) installed
- Python (3.11) installed

**Backend**
1. Navigate to the `backend/` directory.
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Run migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   The API will be available at `http://localhost:8000`.

**Frontend**
1. Navigate to the `Frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## Cloud setup — GCP via Terraform
All Google Cloud infrastructure is defined as code in the `infrastructure/terraform-cloudrun/` folder and provisioned with a single Terraform command.

### Architecture provisioned
| Resource | GCP Service | Purpose |
| :--- | :--- | :--- |
| Project Services | APIs | Enables Cloud Run, Artifact Registry, Cloud Build |
| Container Registry | Artifact Registry | `gym-repo` stores Docker images |
| Backend Service | Cloud Run | `gym-backend` Runs the Django API |
| Frontend Service | Cloud Run | `gym-frontend` Runs the React app |
| IAM Policies | Cloud Run IAM | Makes services publicly accessible |

**Prerequisites**
- Terraform installed and on PATH
- Google Cloud CLI (gcloud) installed and authenticated:
  ```bash
  gcloud auth login
  gcloud config set project gymx3-494520
  ```

### First time setup
Create `infrastructure/terraform-cloudrun/terraform.tfvars` with your values — this file is gitignored and must never be committed:
```hcl
project_id = "gymx3-494520"
region     = "europe-west4"
```

### Provision all infrastructure — one command
```bash
cd infrastructure/terraform-cloudrun
terraform init      # first time only — downloads GCP provider
terraform plan      # dry run — shows what will be created
terraform apply     # provisions everything on GCP (~5 minutes)
```

### Push Docker images to Artifact Registry (Manual Approach)
Before Cloud Run can start, the images must exist in Artifact Registry. (This is automated by CI/CD, but here is the manual flow):
```bash
gcloud auth configure-docker europe-west4-docker.pkg.dev --quiet

# Build Images
docker build -t europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/backend:latest -f infrastructure/docker/backend.Dockerfile .
docker build -t europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/frontend:latest -f infrastructure/docker/frontend.Dockerfile .

# Push Images
docker push europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/backend:latest
docker push europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/frontend:latest
```

## CI/CD pipeline
The deployment flow is automated via GitHub Actions. The goal is:

`push to main` → `GitHub Actions triggers`
  → `tests run (Frontend & Backend)`
  → `build API & React images` → `push to Artifact Registry`
  → `deploy to Cloud Run` → `new version live`

This is implemented in `.github/workflows/ci-cd.yml`.

### How it works
1. **test-frontend**: Installs npm dependencies, runs linting, runs tests, and builds the static assets.
2. **test-backend**: Sets up Python, installs pip requirements, and runs Django checks.
3. **build-and-deploy**: Runs only if tests pass on the main branch. Uses Workload Identity Federation to authenticate with GCP, builds Docker images using the files in `infrastructure/docker/`, pushes them to Artifact Registry, and deploys them to Cloud Run via `gcloud run deploy`.

### Required GitHub secrets
These secrets must be set in your GitHub repository → Settings → Secrets and variables → Actions:

| Secret | Description |
| :--- | :--- |
| `WIF_PROVIDER` | The Workload Identity Federation provider string (e.g., `projects/12345/locations/global/workloadIdentityPools/...`) |
| `GCP_SERVICE_ACCOUNT` | The service account email used by GitHub Actions to deploy |
| `MONGO_URI` | The connection string to the MongoDB database |

## Tearing down GCP resources
To remove all provisioned GCP resources (Cloud Run services, Artifact Registry, etc.) and stop incurring costs:

```bash
cd infrastructure/terraform-cloudrun
terraform destroy
```
Type `yes` when prompted.
