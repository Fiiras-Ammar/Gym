"""API Views for all endpoints."""
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from users.models import User, Profile, UserRole
from nutrition.models import Product, ConsumptionLog, Settings
from workouts.models import ExerciseCategory, WorkoutDay, WorkoutDayExercise, WorkoutCompletion
from weight.models import WeightLog
from .serializers import (
    UserSerializer, UserCreateSerializer, ProfileSerializer,
    SettingsSerializer, ProductSerializer, ConsumptionLogSerializer,
    ConsumptionLogCreateSerializer, ConsumptionLogWithProductSerializer,
    ExerciseCategorySerializer, WorkoutDaySerializer, WorkoutDayExerciseSerializer,
    WorkoutCompletionSerializer, WeightLogSerializer,
    ChangePasswordSerializer, ChangeEmailSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login that returns user data along with tokens."""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            # Get user from the validated token
            try:
                user = User.objects.get(email=request.data.get('email'))
                user_data = UserSerializer(user).data
                response.data['user'] = user_data
            except User.DoesNotExist:
                # User was authenticated but not found (shouldn't happen)
                pass

        return response


class UserViewSet(viewsets.ModelViewSet):
    """User management endpoints."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # Allow anyone to register (create user)
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return User.objects.all()
        return User.objects.filter(id=user.id)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current authenticated user."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password."""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Wrong old password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password updated successfully'})

    @action(detail=False, methods=['post'])
    def change_email(self, request):
        """Change user email."""
        serializer = ChangeEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        new_email = serializer.validated_data['new_email']
        
        if User.objects.filter(email=new_email).exclude(id=user.id).exists():
            return Response(
                {'error': 'Email already in use'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.email = new_email
        user.save()
        return Response({'message': 'Email updated successfully'})


class ProfileViewSet(viewsets.ModelViewSet):
    """Profile management endpoints."""
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Profile.objects.all()
        return Profile.objects.filter(user=user)

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user's profile."""
        profile, _ = Profile.objects.get_or_create(
            user=request.user,
            defaults={'display_name': request.user.email.split('@')[0]}
        )
        
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SettingsViewSet(viewsets.ModelViewSet):
    """User settings endpoints."""
    serializer_class = SettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Settings.objects.filter(user=self.request.user)

    def get_object(self):
        settings, _ = Settings.objects.get_or_create(
            user=self.request.user,
            defaults={
                'calorie_goal': 2000,
                'protein_goal': 150,
                'carbs_goal': 250,
                'fat_goal': 65
            }
        )
        return settings

    def list(self, request, *args, **kwargs):
        """Return current user's settings."""
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    """Product management endpoints."""
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Product.objects.all()
        return Product.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        """Upload image for a product."""
        import os
        import uuid as uuid_lib
        from django.conf import settings
        
        product = self.get_object()
        
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['image']
        
        # Validate file size (5MB limit)
        if file.size > 5 * 1024 * 1024:
            return Response({'error': 'Image must be under 5MB'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save file
        ext = os.path.splitext(file.name)[1]
        filename = f"{product.id}/{uuid_lib.uuid4()}{ext}"
        filepath = os.path.join(settings.MEDIA_ROOT, 'products', filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        
        # Build URL
        image_url = f"{settings.MEDIA_URL}products/{filename}"
        product.image_url = image_url
        product.save()
        
        return Response({'image_url': image_url})


class ConsumptionLogViewSet(viewsets.ModelViewSet):
    """Consumption log endpoints."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list' or self.action == 'retrieve':
            return ConsumptionLogWithProductSerializer
        return ConsumptionLogCreateSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = ConsumptionLog.objects.all()
        
        if user.is_admin:
            pass
        else:
            queryset = queryset.filter(user=user)
        
        # Filter by date range if provided
        date_from = self.request.query_params.get('from')
        date_to = self.request.query_params.get('to')
        
        if date_from:
            try:
                dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                queryset = queryset.filter(consumed_at__gte=dt)
            except ValueError:
                pass
        
        if date_to:
            try:
                dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                queryset = queryset.filter(consumed_at__lte=dt)
            except ValueError:
                pass
        
        return queryset.order_by('-consumed_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's consumption logs."""
        user = request.user
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        logs = ConsumptionLog.objects.filter(
            user=user,
            consumed_at__gte=today_start,
            consumed_at__lte=today_end
        ).order_by('-consumed_at')
        
        serializer = ConsumptionLogWithProductSerializer(logs, many=True)
        return Response(serializer.data)


class ExerciseCategoryViewSet(viewsets.ModelViewSet):
    """Exercise category endpoints."""
    serializer_class = ExerciseCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return ExerciseCategory.objects.all()
        return ExerciseCategory.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WorkoutDayViewSet(viewsets.ModelViewSet):
    """Workout day endpoints."""
    serializer_class = WorkoutDaySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = WorkoutDay.objects.all()
        if user.is_admin:
            return queryset.all()
        return queryset.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WorkoutDayExerciseViewSet(viewsets.ModelViewSet):
    """Workout day exercise endpoints."""
    serializer_class = WorkoutDayExerciseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = WorkoutDayExercise.objects.all()
        if user.is_admin:
            return queryset.all()
        return queryset.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WorkoutCompletionViewSet(viewsets.ModelViewSet):
    """Workout completion endpoints."""
    serializer_class = WorkoutCompletionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return WorkoutCompletion.objects.all()
        return WorkoutCompletion.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's workout completions."""
        user = request.user
        today = timezone.now().date()
        
        completions = WorkoutCompletion.objects.filter(
            user=user,
            completed_at__date=today
        )
        
        serializer = self.get_serializer(completions, many=True)
        return Response(serializer.data)


class WeightLogViewSet(viewsets.ModelViewSet):
    """Weight log endpoints."""
    serializer_class = WeightLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return WeightLog.objects.all()
        return WeightLog.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """Upload user avatar."""
    if 'avatar' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['avatar']
    profile, _ = Profile.objects.get_or_create(user=request.user)
    
    # Save file and generate URL
    # For simplicity, storing the file path - in production, use proper storage
    import os
    import uuid as uuid_lib
    from django.conf import settings
    
    ext = os.path.splitext(file.name)[1]
    filename = f"{request.user.id}/{uuid_lib.uuid4()}{ext}"
    filepath = os.path.join(settings.MEDIA_ROOT, 'avatars', filename)
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)
    
    # Build URL
    avatar_url = f"{settings.MEDIA_URL}avatars/{filename}"
    profile.avatar_url = avatar_url
    profile.save()
    
    return Response({'avatar_url': avatar_url})


@api_view(['GET'])
def health_check(request):
    """Health check endpoint."""
    return Response({'status': 'healthy'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def food_lookup(request):
    """Lookup food by barcode or name using Open Food Facts or USDA."""
    import requests
    
    mode = request.GET.get('mode')
    query = request.GET.get('query')
    
    if not mode or not query:
        return Response({'error': 'mode and query required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if mode == 'barcode':
        # Open Food Facts lookup
        try:
            url = f"https://world.openfoodfacts.org/api/v0/product/{query}.json"
            response = requests.get(url, timeout=10)
            data = response.json()
            
            if data.get('status') == 1 and data.get('product'):
                product = data['product']
                nutriments = product.get('nutriments', {})
                
                return Response({
                    'found': True,
                    'product': {
                        'name': product.get('product_name', 'Unknown'),
                        'brand': product.get('brands', ''),
                        'barcode': query,
                        'calories': nutriments.get('energy-kcal_100g', 0) or nutriments.get('energy-kcal', 0),
                        'protein': nutriments.get('proteins_100g', 0),
                        'carbs': nutriments.get('carbohydrates_100g', 0),
                        'fat': nutriments.get('fat_100g', 0),
                        'unit': 'g',
                        'image_url': product.get('image_url'),
                    }
                })
            else:
                return Response({'found': False})
        except Exception as e:
            return Response({'found': False, 'error': str(e)})
    
    elif mode == 'name':
        # Name-based lookup using USDA API
        try:
            import os
            api_key = os.getenv('USDA_API_KEY', 'DEMO_KEY')
            url = f"https://api.nal.usda.gov/fdc/v1/foods/search?query={query}&api_key={api_key}&pageSize=1"
            response = requests.get(url, timeout=10)
            data = response.json()
            
            if data.get('foods') and len(data['foods']) > 0:
                food = data['foods'][0]
                nutrients = food.get('foodNutrients', [])
                
                # Extract macros
                calories = 0
                protein = 0
                carbs = 0
                fat = 0
                
                for n in nutrients:
                    name = n.get('nutrientName', '').lower()
                    value = n.get('value', 0)
                    
                    if 'energy' in name and 'kcal' in n.get('unitName', '').lower():
                        calories = value
                    elif 'protein' in name:
                        protein = value
                    elif 'carbohydrate' in name:
                        carbs = value
                    elif 'total lipid' in name or ('fat' in name and 'fatty acids' not in name):
                        fat = value
                
                return Response({
                    'found': True,
                    'product': {
                        'name': food.get('description', query).title(),
                        'brand': food.get('brandOwner', 'USDA Data'),
                        'barcode': food.get('gtinUpc', ''),
                        'calories': round(calories),
                        'protein': round(protein, 1),
                        'carbs': round(carbs, 1),
                        'fat': round(fat, 1),
                        'unit': 'g',
                        'image_url': None,
                    }
                })
            else:
                return Response({'found': False})
        except Exception as e:
            return Response({'found': False, 'error': str(e)})
    
    return Response({'error': 'Invalid mode'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_users(request):
    """Admin user management endpoint."""
    if not request.user.is_admin:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        users = User.objects.all()
        data = []
        for user in users:
            profile = getattr(user, 'profile', None)
            is_admin = user.roles.filter(role='admin').exists()
            data.append({
                'id': str(user.id),
                'email': user.email,
                'display_name': profile.display_name if profile else None,
                'is_admin': is_admin,
                'created_at': user.date_joined.isoformat(),
            })
        return Response({'users': data})
    
    elif request.method == 'POST':
        action = request.data.get('action')
        
        if action == 'create':
            email = request.data.get('email')
            password = request.data.get('password')
            display_name = request.data.get('display_name')
            is_admin = request.data.get('is_admin', False)
            
            if not email or not password:
                return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if User.objects.filter(email=email).exists():
                return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
            user = User.objects.create_user(email=email, username=email, password=password)
            
            if display_name:
                profile, _ = Profile.objects.get_or_create(user=user)
                profile.display_name = display_name
                profile.save()
            
            if is_admin:
                UserRole.objects.create(user=user, role='admin')
            
            return Response({'message': 'User created', 'user_id': str(user.id)})
        
        elif action == 'delete':
            user_id = request.data.get('user_id')
            if not user_id:
                return Response({'error': 'User ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = User.objects.get(id=user_id)
                if user == request.user:
                    return Response({'error': 'Cannot delete yourself'}, status=status.HTTP_400_BAD_REQUEST)
                user.delete()
                return Response({'message': 'User deleted'})
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
