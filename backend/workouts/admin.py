from django.contrib import admin
from .models import ExerciseCategory, WorkoutDay, WorkoutDayExercise, WorkoutCompletion


@admin.register(ExerciseCategory)
class ExerciseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'user', 'created_at')
    search_fields = ('name',)
    list_filter = ('created_at',)


@admin.register(WorkoutDay)
class WorkoutDayAdmin(admin.ModelAdmin):
    list_display = ('name', 'day_of_week', 'category', 'user', 'created_at')
    list_filter = ('day_of_week', 'created_at')
    search_fields = ('name',)


@admin.register(WorkoutDayExercise)
class WorkoutDayExerciseAdmin(admin.ModelAdmin):
    list_display = ('name', 'workout_day', 'position', 'body_part', 'user')
    list_filter = ('body_part', 'created_at')
    search_fields = ('name', 'exercise_id')


@admin.register(WorkoutCompletion)
class WorkoutCompletionAdmin(admin.ModelAdmin):
    list_display = ('workout_day', 'completed_at', 'user')
    list_filter = ('completed_at',)
    date_hierarchy = 'completed_at'
