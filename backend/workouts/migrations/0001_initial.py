# Generated initial migration

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExerciseCategory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('color', models.CharField(default='primary', max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='exercise_categories', to='users.user')),
            ],
            options={
                'db_table': 'exercise_categories',
                'ordering': ['name'],
                'verbose_name_plural': 'Exercise Categories',
            },
        ),
        migrations.CreateModel(
            name='WorkoutDay',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('day_of_week', models.SmallIntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='workouts.exercisecategory')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workout_days', to='users.user')),
            ],
            options={
                'db_table': 'workout_days',
                'ordering': ['created_at'],
            },
        ),
        migrations.CreateModel(
            name='WorkoutDayExercise',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('exercise_id', models.CharField(max_length=100)),
                ('name', models.CharField(max_length=255)),
                ('gif_url', models.URLField(blank=True, null=True)),
                ('video_url', models.URLField(blank=True, null=True)),
                ('body_part', models.CharField(blank=True, max_length=100, null=True)),
                ('target', models.CharField(blank=True, max_length=100, null=True)),
                ('equipment', models.CharField(blank=True, max_length=100, null=True)),
                ('position', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workout_day_exercises', to='users.user')),
                ('workout_day', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='exercises', to='workouts.workoutday')),
            ],
            options={
                'db_table': 'workout_day_exercises',
                'ordering': ['position'],
            },
        ),
        migrations.AddIndex(
            model_name='workoutdayexercise',
            index=models.Index(fields=['workout_day'], name='idx_workout_day_exercises_day'),
        ),
        migrations.CreateModel(
            name='WorkoutCompletion',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('completed_at', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workout_completions', to='users.user')),
                ('workout_day', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='completions', to='workouts.workoutday')),
            ],
            options={
                'db_table': 'workout_completions',
                'ordering': ['-completed_at'],
            },
        ),
        migrations.AddIndex(
            model_name='workoutcompletion',
            index=models.Index(fields=['workout_day'], name='idx_workout_completions_day'),
        ),
        migrations.AddIndex(
            model_name='workoutcompletion',
            index=models.Index(fields=['-completed_at'], name='idx_workout_completions_at'),
        ),
    ]
