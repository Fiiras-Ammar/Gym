"""API Serializers for all models."""
from rest_framework import serializers
from users.models import User, Profile, UserRole
from nutrition.models import Product, ConsumptionLog, Settings
from workouts.models import ExerciseCategory, WorkoutDay, WorkoutDayExercise, WorkoutCompletion
from weight.models import WeightLog


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'display_name', 'avatar_url', 'created_at', 'updated_at']


class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ['id', 'role', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    roles = UserRoleSerializer(many=True, read_only=True)
    is_admin = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'profile', 'roles', 'is_admin', 'date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = ['id', 'calorie_goal', 'protein_goal', 'carbs_goal', 'fat_goal', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand', 'barcode', 'calories', 'protein',
            'carbs', 'fat', 'unit', 'category', 'image_url', 'created_at'
        ]
        read_only_fields = ['user']


class ConsumptionLogSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ConsumptionLog
        fields = [
            'id', 'product', 'product_id', 'amount',
            'consumed_at', 'created_at'
        ]
        read_only_fields = ['user']


class ConsumptionLogCreateSerializer(serializers.ModelSerializer):
    product_id = serializers.UUIDField(write_only=True)
    consumed_at = serializers.DateTimeField(required=False)

    class Meta:
        model = ConsumptionLog
        fields = ['id', 'product_id', 'amount', 'consumed_at', 'created_at']
        read_only_fields = ['user']

    def create(self, validated_data):
        if 'consumed_at' not in validated_data:
            from django.utils import timezone
            validated_data['consumed_at'] = timezone.now()
        return super().create(validated_data)


class ConsumptionLogWithProductSerializer(serializers.ModelSerializer):
    """Serializer for consumption logs with nested product - matching Supabase format."""
    products = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = ConsumptionLog
        fields = [
            'id', 'product_id', 'products', 'amount',
            'consumed_at', 'created_at'
        ]


class ExerciseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseCategory
        fields = ['id', 'name', 'color', 'created_at']
        read_only_fields = ['user']


class WorkoutDayExerciseSerializer(serializers.ModelSerializer):
    workout_day_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = WorkoutDayExercise
        fields = [
            'id', 'workout_day_id', 'exercise_id', 'name', 'gif_url',
            'video_url', 'body_part', 'target', 'equipment', 'position', 'created_at'
        ]
        read_only_fields = ['user']


class WorkoutDaySerializer(serializers.ModelSerializer):
    exercises = WorkoutDayExerciseSerializer(many=True, read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    category = ExerciseCategorySerializer(read_only=True)

    class Meta:
        model = WorkoutDay
        fields = ['id', 'name', 'day_of_week', 'category_id', 'category', 'exercises', 'created_at']
        read_only_fields = ['user']


class WorkoutCompletionSerializer(serializers.ModelSerializer):
    workout_day_id = serializers.UUIDField(write_only=True)
    workout_day = WorkoutDaySerializer(read_only=True)
    completed_at = serializers.DateTimeField(required=False)

    class Meta:
        model = WorkoutCompletion
        fields = ['id', 'workout_day_id', 'workout_day', 'completed_at', 'created_at']
        read_only_fields = ['user']

    def create(self, validated_data):
        if 'completed_at' not in validated_data:
            from django.utils import timezone
            validated_data['completed_at'] = timezone.now()
        return super().create(validated_data)


class WeightLogSerializer(serializers.ModelSerializer):
    logged_at = serializers.DateTimeField(required=False)

    class Meta:
        model = WeightLog
        fields = ['id', 'weight_kg', 'logged_at', 'note', 'created_at']
        read_only_fields = ['user']

    def create(self, validated_data):
        if 'logged_at' not in validated_data:
            from django.utils import timezone
            validated_data['logged_at'] = timezone.now()
        return super().create(validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)


class ChangeEmailSerializer(serializers.Serializer):
    new_email = serializers.EmailField(required=True)
