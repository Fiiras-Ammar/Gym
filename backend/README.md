# Macro Scanner - Django Backend

This Django backend replaces the Supabase and Lovable cloud backend with a Python REST API.

## Project Structure

```
backend/
├── macroscanner/          # Main Django project settings
│   ├── settings.py        # Django settings
│   ├── urls.py           # Root URL configuration
│   ├── wsgi.py           # WSGI application
│   └── asgi.py           # ASGI application
├── users/                 # User authentication, profiles, roles
│   ├── models.py         # User, Profile, UserRole models
│   ├── signals.py        # Auto-create profile/role on signup
│   └── admin.py          # Admin configuration
├── nutrition/            # Products, consumption logs, settings
│   ├── models.py         # Product, ConsumptionLog, Settings models
│   └── signals.py        # Auto-create settings on signup
├── workouts/             # Exercise categories, workout days, exercises
│   └── models.py         # ExerciseCategory, WorkoutDay, etc.
├── weight/               # Weight tracking
│   └── models.py         # WeightLog model
├── api/                  # REST API endpoints
│   ├── serializers.py    # DRF serializers
│   ├── views.py          # API views and viewsets
│   ├── urls.py           # API routing
│   └── exercisedb_views.py # ExerciseDB integration
├── manage.py             # Django management script
├── requirements.txt      # Python dependencies
└── .env                  # Environment variables
```

## Features

- **JWT Authentication** - Secure token-based authentication
- **Multi-app architecture** - Separated concerns across 5 Django apps
- **ExerciseDB integration** - Public API for exercise data
- **User management** - Profiles, roles (admin/user), avatar uploads
- **Nutrition tracking** - Products, consumption logs, macro goals
- **Workout management** - Categories, workout days, exercises, completions
- **Weight tracking** - Bodyweight logging

## Setup

### 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- `SECRET_KEY` - Generate a new secret key
- `DEBUG` - Set to `False` in production
- `ALLOWED_HOSTS` - Add your domain

### 3. Run migrations

```bash
python manage.py migrate
```

### 4. Create superuser

```bash
python manage.py createsuperuser
```

### 5. Run development server

```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/api/`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Login with email/password (returns JWT tokens + user data)
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/logout/` - Blacklist refresh token

### Users
- `GET /api/users/me/` - Get current user
- `POST /api/users/change_password/` - Change password
- `POST /api/users/change_email/` - Change email
- `GET/PUT/PATCH /api/profiles/me/` - Get/update profile
- `POST /api/upload-avatar/` - Upload avatar

### Nutrition
- `GET/POST /api/products/` - List/create products
- `GET/PUT/DELETE /api/products/{id}/` - Retrieve/update/delete product
- `GET/POST /api/consumption-logs/` - List/create consumption logs
- `GET /api/consumption-logs/today/` - Get today's logs
- `GET/PUT /api/settings/` - Get/update user settings

### Workouts
- `GET/POST /api/exercise-categories/` - List/create categories
- `GET/POST /api/workout-days/` - List/create workout days
- `GET/POST /api/workout-exercises/` - List/create exercises
- `GET/POST /api/workout-completions/` - List/create completions
- `GET /api/workout-completions/today/` - Get today's completions

### Weight
- `GET/POST /api/weight-logs/` - List/create weight logs

### External APIs
- `GET /api/exercises/search/?q={query}` - Search ExerciseDB
- `GET /api/exercises/{id}/` - Get exercise details

### Health Check
- `GET /api/health/` - Check API status

## Database Schema

The Django models replicate the Supabase schema with these main entities:

- **users_user** - Custom user model (replaces Supabase Auth)
- **profiles** - User profiles with display name and avatar
- **user_roles** - Admin/user roles
- **settings** - User nutrition goals
- **products** - Food products with macros
- **consumption_logs** - Product consumption records
- **exercise_categories** - Workout categories (Push, Pull, Legs, etc.)
- **workout_days** - Workout day definitions
- **workout_day_exercises** - Exercises in workout days
- **workout_completions** - Completed workout records
- **weight_logs** - Bodyweight tracking

## Switching Frontend to Django Backend

Update your frontend `.env`:

```
VITE_API_URL=http://127.0.0.1:8000/api
```

Replace Supabase client calls with fetch/axios to the Django API endpoints. The response formats are designed to match the Supabase structure for easier migration.
