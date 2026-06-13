# Gym & Macro Scanner Portal

A full-stack health and fitness ecosystem designed to track daily nutritional intake, manage custom gym splits, log bodyweight, and query global food and exercise databases. 

This repository houses the entire application infrastructure, provisioned via Terraform, containerized using Docker, deployed to Google Cloud Run, and automated via GitHub Actions CI/CD.

---

## Table of Contents
1. [Application Features](#application-features)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Folder Structure](#folder-structure)
4. [Third-Party API Integrations](#third-party-api-integrations)
5. [Database Schema](#database-schema)
6. [Local Development Setup](#local-development-setup)
7. [Cloud Infrastructure (GCP & Terraform)](#cloud-infrastructure-gcp--terraform)
8. [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
9. [Teardown Guide](#teardown-guide)

---

## Application Features

The Gym & Macro Scanner is split into two primary domains: **Nutrition/Diet Tracking** and **Gym/Workout Planning**.

### 1. Nutrition & Daily Macro Tracking
*   **Daily Dashboard (`Today`)**: A visual summary of today's calorie consumption and macronutrient split (Protein, Carbs, Fat) mapped against personalized, editable goals. Includes real-time progress bars and calorie burners.
*   **Kitchen Inventory (`Kitchen`)**: A user-managed registry of food items. Users can search their kitchen, add new ingredients, edit macro/calorie values per 100g/ml, upload product images, and remove products they no longer use.
*   **Meal Logging**: Easily log consumption logs of any item in your Kitchen, choosing specific quantities (in grams or milliliters) with automatic macro calculation based on the amount consumed.
*   **14-Day History Details**: View a chronological history of the last 14 days, collapsing/expanding daily reports to inspect specific meals and overall nutritional metrics.

### 2. Barcode Scanning & Food Lookup API
*   **Camera Barcode Scanner**: Built-in support to scan packaged product barcodes using your device camera, instantly retrieving nutrition facts from **Open Food Facts**.
*   **Produce Lookup**: An intelligent search tool for raw produce (fruit, vegetables, meats) that queries the **USDA FoodData Central** database.
*   **Manual Entry**: Fallback option to quickly add custom items by specifying macros and details.

### 3. Workout Splits & Exercise Planner
*   **Custom Splits & Days**: Design workout weeks (e.g., Push, Pull, Legs) and group days under specific training categories.
*   **Exercise database Search**: Built-in integration with **ExerciseDB** allowing users to search thousands of exercises by name, equipment type, target muscle, or body part.
*   **Tutorial Instructions & Videos**: View step-by-step guides, anatomy tags, and GIF animations/videos for every exercise to ensure proper form.
*   **Workout Completion**: Log active workout completions daily to track consistency over time.

### 4. Bodyweight Logging
*   **Weight Logs**: Track bodyweight in kilograms over time with optional notes.
*   **Progress Indicators**: View weight change metrics showing weight deltas (gain/loss in kg) relative to the previous log.

---

## Architecture & Tech Stack

```
                     ┌────────────────────────┐
                     │     React Frontend     │ (Vite, TypeScript, Tailwind)
                     └───────────┬────────────┘
                                 │ HTTP / JWT
                                 ▼
                     ┌────────────────────────┐
                     │   Django API Gateway   │ (Python, DRF, JWT Auth)
                     └───────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
 ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
 │  Local SQLite │       │ Open Food     │       │  ExerciseDB   │
 │   / MongoDB   │       │ Facts & USDA  │       │     & USDA    │
 └───────────────┘       └───────────────┘       └───────────────┘
```

*   **Frontend**: 
    *   **React 18** with **TypeScript**
    *   **Vite** for rapid tooling and build times
    *   **Tailwind CSS** & **shadcn/ui** (custom UI primitives like Tabs, Dialogs, Select, Badges)
    *   **TanStack Query (React Query v5)** for robust client-side state caching
    *   **Lucide React** for modern iconography
*   **Backend**: 
    *   **Django 5** with **Django REST Framework (DRF)**
    *   **SimpleJWT** for secure, token-based stateless authentication
    *   Flexible database settings (supports local SQLite or MongoDB Atlas cloud databases)
*   **Infrastructure**: 
    *   **Google Cloud Run**: Serverless container hosting for both frontend and backend
    *   **Artifact Registry**: Secure hosting for Docker images
    *   **Terraform**: Infrastructure-as-Code to provision and destroy GCP assets cleanly
    *   **GitHub Actions**: CI/CD pipeline executing tests and automated deployments

---

## Folder Structure

```text
macro-scanner-kitchen/
├── backend/                  ← Django backend API
│   ├── api/                  ← Serializers, endpoints, and external API integrations
│   ├── macroscanner/          # Main Django settings & routing
│   ├── nutrition/            ← Products, consumption logs, and macro goals models
│   ├── users/                ← User auth, profiles, roles models & signals
│   ├── weight/               ← Weight log tracking models
│   └── workouts/             ← Workout splits, exercises, and completions models
├── Frontend/                 ← React frontend
│   ├── src/
│   │   ├── components/       ← Reusable UI blocks (MacroBar, Layout, dialogs)
│   │   ├── pages/            ← Application views (Today, Workouts, Weight, Kitchen, Add...)
│   │   ├── lib/              ← API client, helpers, and state mapping
│   │   └── hooks/            ← Custom React Hooks
├── infrastructure/           ← IaC and container files
│   ├── docker/               ← Production Dockerfiles
│   │   ├── backend.Dockerfile
│   │   └── frontend.Dockerfile
│   └── terraform-cloudrun/   ← GCP terraform modules (main.tf, outputs.tf, variables.tf)
└── .github/
    └── workflows/            ← CI/CD pipeline automation
        ├── ci.yml            ← Run linter, verify build, run tests
        └── cd.yml            ← Authenticate, build images, and deploy to Cloud Run
```

---

## Third-Party API Integrations

The system interfaces with three external databases:

1.  **Open Food Facts API**: 
    *   Used for: Packaged product barcode lookups.
    *   Endpoint: `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
2.  **USDA FoodData Central API**:
    *   Used for: Name-based searches of fresh/unbranded produce items.
    *   Endpoint: `https://api.nal.usda.gov/fdc/v1/foods/search`
3.  **ExerciseDB API**:
    *   Used for: Fitness database search and exercise instructions.
    *   Endpoint: `https://oss.exercisedb.dev/api/v1`

---

## Database Schema

The database model matches the following structure:

*   **users**: Custom user model with login credentials.
*   **profiles**: Display names and user avatars.
*   **user_roles**: Determines user access privileges (Admin/User).
*   **settings**: Keeps track of daily nutritional targets (Calories, Protein, Carbs, Fat).
*   **products**: Defines items in the kitchen (nutrition info per 100g/ml, barcode, brand, name, image).
*   **consumption_logs**: Connects users to products eaten at specific dates/times.
*   **exercise_categories**: Muscle/split categories (Push, Pull, Legs).
*   **workout_days**: Individual workout days defined in a split.
*   **workout_day_exercises**: Sourced exercises assigned to workout days (stores External ExerciseDB reference, name, tutorial video link, and position).
*   **workout_completions**: Timestamps recording when a workout day was marked as completed.
*   **weight_logs**: Bodyweight logs recorded by the user.

---

## Local Development Setup

### Prerequisites
*   Node.js (v20)
*   Python (3.11)
*   Docker (Optional, for containerized testing)

### 1. Backend Setup
1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and install packages:
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    ```
3.  Set up environment configurations:
    ```bash
    cp .env.example .env
    ```
    *(Open `.env` and fill out your database settings, keys, and USDA/ExerciseDB parameters if needed)*
4.  Run migrations and start the server:
    ```bash
    python manage.py migrate
    python manage.py runserver
    ```
    The API runs at `http://localhost:8000`.

### 2. Frontend Setup
1.  Navigate to the `Frontend/` directory:
    ```bash
    cd Frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Start the Vite dev server:
    ```bash
    npm run dev
    ```
    The web app runs at `http://localhost:5173`. Make sure the frontend `.env` points to the API:
    ```text
    VITE_API_URL=http://localhost:8000/api
    ```

---

## Cloud Infrastructure (GCP & Terraform)

All cloud resources are provisioned on Google Cloud Platform via Terraform.

### Architecture provisioned
*   **Artifact Registry**: `gym-repo` repository for Docker images.
*   **Cloud Run (Frontend)**: Runs the React web application container.
*   **Cloud Run (Backend)**: Runs the Django REST API container.
*   **IAM Policies**: Cloud Run service access bindings.

### Prerequisites
*   Terraform installed
*   Google Cloud SDK authenticated:
    ```bash
    gcloud auth login
    gcloud config set project gymx3-494520
    ```

### Provisioning Command
Create `infrastructure/terraform-cloudrun/terraform.tfvars`:
```hcl
project_id = "gymx3-494520"
region     = "europe-west4"
```
Execute the provisioning plan:
```bash
cd infrastructure/terraform-cloudrun
terraform init
terraform plan
terraform apply
```

---

## CI/CD Pipeline (GitHub Actions)

Deployments are automated upon code changes pushed to the primary branch.

1.  **CI Pipeline (`ci.yml`)**:
    *   **Frontend**: Installs, lints (`eslint`), runs tests (`vitest`), and tests compilation.
    *   **Backend**: Installs dependencies and runs Django project checks (`python manage.py check`).
2.  **CD Pipeline (`cd.yml`)**:
    *   Triggered on successful CI test completion on `main` branch.
    *   Logs in via Workload Identity Federation (WIF).
    *   Builds frontend and backend containers via Docker.
    *   Pushes to Artifact Registry and redeploys Cloud Run services.

### GitHub Actions Secrets
Configure these variables in GitHub repository settings:
*   `WIF_PROVIDER`: Path to Workload Identity Federation provider.
*   `GCP_SERVICE_ACCOUNT`: Service account deploying the stack.
*   `MONGO_URI`: Production MongoDB database URI.

---

## Teardown Guide

To clean up all deployed Google Cloud resources and avoid charges:

```bash
cd infrastructure/terraform-cloudrun
terraform destroy
```
Type `yes` when prompted.
