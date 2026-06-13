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

The Gym & Macro Scanner provides a rich set of features divided into two primary domains: **Nutrition/Diet Tracking** and **Gym/Workout Planning**, backed by secure user controls and automated external integrations.

### 1. Nutrition & Daily Macro Tracking
*   **Daily Dashboard (`Today`)**: A visually engaging summary dashboard displaying today's calorie consumption mapped against a personalized, editable daily goal, complete with interactive progress bars and color-coded status tracks.
*   **Macronutrient Goal Bars**: Monitored targets for Protein, Carbs, and Fat utilizing custom, matching progress bars to track daily macros at a glance.
*   **Interactive Daily Meal Logs**: View a chronologically grouped log of all items eaten today. Displays the product name, amount consumed (in grams or milliliters), calculated calorie count, and log timestamp.
*   **Inline Log Editing & Deletion**: Click on any logged meal to edit its consumption weight in a modal instantly, recalculating daily macros on-the-fly. Remove logs easily using an inline delete trigger.
*   **14-Day History Details**: Under the `History` page, browse a 14-day history, enabling users to expand/collapse daily reports to inspect specific meals and overall historical progress.

### 2. Kitchen Inventory Management (`Kitchen`)
*   **User Kitchen Registry**: A personal pantry database where you save frequently eaten foods. Each entry keeps track of calories, macros, measurement unit (g or ml), and custom images.
*   **Calorie Density Calculations**: All kitchen items store nutritional facts standardized per 100g or 100ml. The app automatically calculates exact calories and macros consumed when logging any customized portion.
*   **Pantry Search**: Live filtering search bar to instantly query items in the kitchen by name or brand.
*   **Product Editor & Image Uploader**: Edit any kitchen product's name, brand, macros, and unit. Includes a secure file uploader supporting custom product images (up to 5MB) stored on the backend.
*   **Rapid Meal Logger**: Click any kitchen item to open a quick modal, input the portion size, and immediately log it to your day.

### 3. Barcode Scanning & Food Database Lookup
*   **Camera Barcode Scanner**: Built-in camera scanning overlay utilizing the device camera to read packaged product barcodes.
*   **Open Food Facts API Lookup**: Queries the community-driven Open Food Facts database using barcodes to retrieve ingredient names, brands, images, and full macro breakdowns.
*   **Smart Scan Fallback**: If a scanned barcode is not found in Open Food Facts, the app alerts the user and pre-fills the barcode value into the Custom Product tab, allowing rapid manual registry.
*   **USDA FoodData Central Lookup**: Query fresh produce (fruits, vegetables, meat) by name under the "Produce" tab, retrieving official government nutritional values automatically.
*   **Custom Product Creation**: Easily add custom items manually, specifying portion metrics (per 100g/ml) and custom names.
*   **Interactive Preview Cards**: Displays structured nutritional panels with colored macro cards for validation before adding items to the kitchen registry.

### 4. Workout Splits & Exercise Planner
*   **Weekly Gym Splits**: Define custom training days (e.g., "Monday - Push", "Leg Day") and schedule them to specific weekdays or leave them unscheduled.
*   **Split Grouping Categories**: Organize workout days under custom workout categories (e.g., Push, Pull, Legs, Chest, Cardio) with color tags.
*   **ExerciseDB API Search**: Search a global exercise database with thousands of activities, filterable by name, target muscle, or equipment type.
*   **GIF & Video Instruction Guides**: Exercises in your workouts display live autoplay looping videos/GIFs showing correct exercise mechanics.
*   **Interactive Step-by-Step Tutorials**: Click the Book icon on any exercise to read structured, numbered instructions, body part tags, target muscles, and equipment requirements.
*   **Log Workout Completions**: Mark an active workout day as completed with a single tap, logging timestamp metrics to track consistency.

### 5. Bodyweight Logging
*   **Weight Logs**: Track bodyweight history in kilograms over time with optional notes.
*   **Progress Indicators**: View weight change metrics showing weight deltas (gain/loss in kg) relative to the previous log.

### 6. Biometric Authentication & Security
*   **Face ID / Windows Hello Passkeys**: Setup secure, passwordless authentication using standard WebAuthn biometric login (Face ID, Touch ID, Windows Hello).
*   **Stateless JWT Security**: Highly secure JWT token-based authentication with token rotation (Access/Refresh cycles) to verify identity.

### 7. User Management & Admin Controls
*   **Profile Customization**: Personalize display names, upload profile avatars/photos directly, and change emails or passwords.
*   **Administrative Dashboard**: Exclusive control panel for administrators to register new users, toggle admin privileges, view all registered accounts, and cleanly delete users alongside all their personal data.

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
