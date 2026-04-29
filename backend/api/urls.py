"""API URL configuration."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView

from .views import (
    CustomTokenObtainPairView, UserViewSet, ProfileViewSet, SettingsViewSet,
    ProductViewSet, ConsumptionLogViewSet, ExerciseCategoryViewSet,
    WorkoutDayViewSet, WorkoutDayExerciseViewSet, WorkoutCompletionViewSet,
    WeightLogViewSet, upload_avatar, health_check, admin_users, food_lookup
)
from .exercisedb_views import search_exercises, get_exercise

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'settings', SettingsViewSet, basename='settings')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'consumption-logs', ConsumptionLogViewSet, basename='consumptionlog')
router.register(r'exercise-categories', ExerciseCategoryViewSet, basename='exercisecategory')
router.register(r'workout-days', WorkoutDayViewSet, basename='workoutday')
router.register(r'workout-exercises', WorkoutDayExerciseViewSet, basename='workoutdayexercise')
router.register(r'workout-completions', WorkoutCompletionViewSet, basename='workoutcompletion')
router.register(r'weight-logs', WeightLogViewSet, basename='weightlog')

urlpatterns = [
    # Health check
    path('health/', health_check, name='health'),
    
    # JWT Authentication
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    
    # Admin
    path('admin/users/', admin_users, name='admin_users'),
    
    # Food lookup
    path('food-lookup/', food_lookup, name='food_lookup'),
    
    # Avatar upload
    path('upload-avatar/', upload_avatar, name='upload_avatar'),
    
    # ExerciseDB integration
    path('exercises/search/', search_exercises, name='exercise_search'),
    path('exercises/<str:exercise_id>/', get_exercise, name='exercise_detail'),
    
    # Router URLs
    path('', include(router.urls)),
]
