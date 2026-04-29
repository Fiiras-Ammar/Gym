"""Workouts models - Exercise Categories, Workout Days, Exercises, Completions."""
import uuid
from django.db import models
from users.models import User


class ExerciseCategory(models.Model):
    """Categories for workout days (Push, Pull, Legs, etc.)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercise_categories')
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=50, default='primary')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'exercise_categories'
        ordering = ['name']
        verbose_name_plural = 'Exercise Categories'

    def __str__(self):
        return self.name


class WorkoutDay(models.Model):
    """Workout days (e.g., "Monday - Push", "Leg Day")."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_days')
    name = models.CharField(max_length=255)
    day_of_week = models.SmallIntegerField(null=True, blank=True)  # 0=Sun, 1=Mon, ..., 6=Sat
    category = models.ForeignKey(ExerciseCategory, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'workout_days'
        ordering = ['created_at']

    def __str__(self):
        return self.name


class WorkoutDayExercise(models.Model):
    """Exercises within a workout day (sourced from ExerciseDB)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_day_exercises')
    workout_day = models.ForeignKey(WorkoutDay, on_delete=models.CASCADE, related_name='exercises')
    exercise_id = models.CharField(max_length=100)  # External ExerciseDB ID
    name = models.CharField(max_length=255)
    gif_url = models.URLField(null=True, blank=True)
    video_url = models.URLField(null=True, blank=True)
    body_part = models.CharField(max_length=100, null=True, blank=True)
    target = models.CharField(max_length=100, null=True, blank=True)
    equipment = models.CharField(max_length=100, null=True, blank=True)
    position = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'workout_day_exercises'
        ordering = ['position']
        indexes = [
            models.Index(fields=['workout_day'], name='idx_workout_day_exercises_day'),
        ]

    def __str__(self):
        return f"{self.name} ({self.workout_day.name})"


class WorkoutCompletion(models.Model):
    """Mark a workout day as done."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_completions')
    workout_day = models.ForeignKey(WorkoutDay, on_delete=models.CASCADE, related_name='completions')
    completed_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'workout_completions'
        ordering = ['-completed_at']
        indexes = [
            models.Index(fields=['workout_day'], name='idx_workout_completions_day'),
            models.Index(fields=['-completed_at'], name='idx_workout_completions_at'),
        ]

    def __str__(self):
        return f"{self.workout_day.name} completed at {self.completed_at}"
