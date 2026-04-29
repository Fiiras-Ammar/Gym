#!/usr/bin/env python
"""
Migration script to import data from Supabase to Django.

Prerequisites:
1. Set environment variables:
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_KEY="your-service-role-key"

2. Run Django migrations first:
   python manage.py migrate

3. Run this script:
   python migrate_supabase.py
"""

import os
import sys
import django
from datetime import datetime

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "macroscanner.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

import requests
from django.db import transaction
from users.models import User, Profile, UserRole
from nutrition.models import Product, ConsumptionLog, Settings
from workouts.models import ExerciseCategory, WorkoutDay, WorkoutDayExercise, WorkoutCompletion
from weight.models import WeightLog

# Get Supabase credentials from environment
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Please set SUPABASE_URL and SUPABASE_KEY environment variables")
    sys.exit(1)


class SupabaseImporter:
    def __init__(self):
        self.headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        }
        self.base_url = f"{SUPABASE_URL}/rest/v1"

    def fetch(self, table: str, params: dict = None) -> list:
        """Fetch data from Supabase table."""
        url = f"{self.base_url}/{table}"
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def migrate_users(self):
        """Migrate users from auth.users - requires manual user creation."""
        print("\n=== Migrating Users ===")
        print("NOTE: auth.users table requires admin access.")
        print("You'll need to create users manually or use Supabase Auth Admin API.")
        print("For each user in Supabase, create them in Django using:")
        print("  python manage.py createsuperuser  (for admins)")
        print("  python manage.py shell + User.objects.create_user()  (for regular users)")

    def migrate_data(self):
        """Migrate all data tables."""
        print("\n=== Starting Migration ===")

        # Map Supabase user IDs to Django user IDs
        # You'll need to manually create this mapping
        user_mapping = {}

        print("\nAvailable Django users:")
        for user in User.objects.all():
            print(f"  - {user.email} (ID: {user.id})")
            # Create mapping: you'll need to match by email
            # user_mapping[supabase_user_id] = user.id

        if not user_mapping:
            print("\nWARNING: No user mapping configured!")
            print("Please edit this script to add user mappings.")
            print("Example: user_mapping['supabase-uuid'] = 'django-uuid'")
            return

        self._migrate_profiles(user_mapping)
        self._migrate_settings(user_mapping)
        self._migrate_products(user_mapping)
        self._migrate_consumption_logs(user_mapping)
        self._migrate_exercise_categories(user_mapping)
        self._migrate_workout_days(user_mapping)
        self._migrate_workout_exercises(user_mapping)
        self._migrate_workout_completions(user_mapping)
        self._migrate_weight_logs(user_mapping)

        print("\n=== Migration Complete ===")

    def _migrate_profiles(self, user_mapping: dict):
        """Migrate profiles."""
        print("\nMigrating profiles...")
        data = self.fetch("profiles")

        for item in data:
            django_user_id = user_mapping.get(item["user_id"])
            if not django_user_id:
                continue

            Profile.objects.update_or_create(
                user_id=django_user_id,
                defaults={
                    "display_name": item.get("display_name"),
                    "avatar_url": item.get("avatar_url"),
                },
            )

        print(f"  Migrated {len(data)} profiles")

    def _migrate_settings(self, user_mapping: dict):
        """Migrate settings."""
        print("\nMigrating settings...")
        data = self.fetch("settings")

        for item in data:
            django_user_id = user_mapping.get(item["user_id"])
            if not django_user_id:
                continue

            Settings.objects.update_or_create(
                user_id=django_user_id,
                defaults={
                    "calorie_goal": item.get("calorie_goal", 2000),
                    "protein_goal": item.get("protein_goal", 150),
                    "carbs_goal": item.get("carbs_goal", 250),
                    "fat_goal": item.get("fat_goal", 65),
                },
            )

        print(f"  Migrated {len(data)} settings")

    def _migrate_products(self, user_mapping: dict):
        """Migrate products."""
        print("\nMigrating products...")
        data = self.fetch("products")

        for item in data:
            django_user_id = user_mapping.get(item["user_id"])
            if not django_user_id:
                continue

            Product.objects.update_or_create(
                id=item["id"],
                defaults={
                    "user_id": django_user_id,
                    "name": item["name"],
                    "brand": item.get("brand"),
                    "barcode": item.get("barcode"),
                    "calories": item.get("calories", 0),
                    "protein": item.get("protein", 0),
                    "carbs": item.get("carbs", 0),
                    "fat": item.get("fat", 0),
                    "unit": item.get("unit", "g"),
                    "category": item.get("category"),
                    "image_url": item.get("image_url"),
                },
            )

        print(f"  Migrated {len(data)} products")

    def _migrate_consumption_logs(self, user_mapping: dict):
        """Migrate consumption logs."""
        print("\nMigrating consumption logs...")
        data = self.fetch("consumption_logs")

        for item in data:
            django_user_id = user_mapping.get(item["user_id"])
            if not django_user_id:
                continue

            ConsumptionLog.objects.update_or_create(
                id=item["id"],
                defaults={
                    "user_id": django_user_id,
                    "product_id": item["product_id"],
                    "amount": item["amount"],
                    "consumed_at": item["consumed_at"],
                },
            )

        print(f"  Migrated {len(data)} consumption logs")

    def _migrate_exercise_categories(self, user_mapping: dict):
        """Migrate exercise categories."""
        print("\nMigrating exercise categories...")
        data = self.fetch("exercise_categories")

        for item in data:
            django_user_id = user_mapping.get(item["user_id"])
            if not django_user_id:
                continue

            ExerciseCategory.objects.update_or_create(
                id=item["id"],
                defaults={
                    "user_id": django_user_id,
                    "name": item["name"],
                    "color": item.get("color", "primary"),
                },
            )

        print(f"  Migrated {len(data)} exercise categories")

    def _migrate_workout_days(self, user_mapping: dict):
        """Migrate workout days."""
        print("\nMigrating workout days...")
        data = self.fetch("workout_days")

        for item in data:
            django_user_id = user_mapping.get(item["user_id"])
            if not django_user_id:
                continue

            WorkoutDay.objects.update_or_create(
                id=item["id"],
                defaults={
                    "user_id": django_user_id,
                    "name": item["name"],
                    "day_of_week": item.get("day_of_week"),
                    "category_id": item.get("category_id"),
                },
            )

        print(f"  Migrated {len(data)} workout days")

    def _migrate_workout_exercises(self, user_mapping: dict):
        """Migrate workout day exercises."""
        print("\nMigrating workout day exercises...")
        data = self.fetch("workout_day_exercises")

        for item in data:
            django_user_id = user_mapping.get(item["user_id"])
            if not django_user_id:
                continue

            WorkoutDayExercise.objects.update_or_create(
                id=item["id"],
                defaults={
                    "user_id": django_user_id,
                    "workout_day_id": item["workout_day_id"],
                    "exercise_id": item["exercise_id"],
                    "name": item["name"],
                    "gif_url": item.get("gif_url"),
                    "video_url": item.get("video_url"),
                    "body_part": item.get("body_part"),
                    "target": item.get("target"),
                    "equipment": item.get("equipment"),
                    "position": item.get("position", 0),
                },
            )

        print(f"  Migrated {len(data)} workout exercises")

    def _migrate_workout_completions(self, user_mapping: dict):
        """Migrate workout completions."""
        print("\nMigrating workout completions...")
        data = self.fetch("workout_completions")

        for item in data:
            django_user_id = user_mapping.get(item["user_id"])
            if not django_user_id:
                continue

            WorkoutCompletion.objects.update_or_create(
                id=item["id"],
                defaults={
                    "user_id": django_user_id,
                    "workout_day_id": item["workout_day_id"],
                    "completed_at": item["completed_at"],
                },
            )

        print(f"  Migrated {len(data)} workout completions")

    def _migrate_weight_logs(self, user_mapping: dict):
        """Migrate weight logs."""
        print("\nMigrating weight logs...")
        data = self.fetch("weight_logs")

        for item in data:
            django_user_id = user_mapping.get(item["user_id"])
            if not django_user_id:
                continue

            WeightLog.objects.update_or_create(
                id=item["id"],
                defaults={
                    "user_id": django_user_id,
                    "weight_kg": item["weight_kg"],
                    "logged_at": item["logged_at"],
                    "note": item.get("note"),
                },
            )

        print(f"  Migrated {len(data)} weight logs")


def main():
    importer = SupabaseImporter()
    importer.migrate_users()

    print("\n" + "=" * 60)
    print("Before running data migration:")
    print("1. Create Django users (manually or via createsuperuser)")
    print("2. Edit this script to add user ID mappings")
    print("3. Run: python migrate_supabase.py")
    print("=" * 60)

    # Uncomment to run migration after configuring user mappings
    # importer.migrate_data()


if __name__ == "__main__":
    main()
