"""ExerciseDB API integration views."""
import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

EXERCISEDB_API_BASE = "https://oss.exercisedb.dev/api/v1"
EXERCISEDB_RAW_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
EXERCISEDB_IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"


def normalize_exercise_item(item):
    """Normalize exercise data to match frontend format."""
    exercise_id = str(item.get('exerciseId', item.get('id', ''))).strip()
    name = str(item.get('name', '')).strip()
    gif_url = str(item.get('gifUrl', item.get('gif_url', ''))).strip()
    video_url_raw = item.get('videoUrl', item.get('video_url'))
    video_url = video_url_raw.strip() if isinstance(video_url_raw, str) and video_url_raw.strip() else None
    
    body_parts = item.get('bodyParts', [])
    if not body_parts and item.get('category'):
        body_parts = [item.get('category')]
    
    target_muscles = item.get('targetMuscles', [])
    if not target_muscles and item.get('primaryMuscles'):
        target_muscles = item.get('primaryMuscles', [])
    
    equipments = item.get('equipments', [])
    if not equipments and item.get('equipment'):
        equipments = [item.get('equipment')]
    
    return {
        'exerciseId': exercise_id,
        'name': name,
        'gifUrl': gif_url,
        'videoUrl': video_url,
        'bodyParts': body_parts,
        'targetMuscles': target_muscles,
        'equipments': equipments,
        'secondaryMuscles': item.get('secondaryMuscles', []),
        'instructions': item.get('instructions', []),
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_exercises(request):
    """Search exercises from ExerciseDB."""
    query = request.query_params.get('q', '')
    limit = int(request.query_params.get('limit', 25))
    
    if not query.strip():
        return Response({'results': []})
    
    try:
        url = f"{EXERCISEDB_API_BASE}/exercises/search"
        params = {
            'search': query.strip(),
            'limit': limit
        }
        
        response = requests.get(url, params=params, timeout=30)
        
        if not response.ok:
            return Response(
                {'error': 'Exercise database unavailable'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        data = response.json()
        exercises = data.get('data', [])
        
        # Normalize and filter valid exercises
        normalized = []
        for item in exercises:
            norm = normalize_exercise_item(item)
            if norm['exerciseId'] and norm['name']:
                normalized.append(norm)
        
        return Response({'results': normalized})
        
    except requests.RequestException as e:
        return Response(
            {'error': f'Failed to fetch exercises: {str(e)}'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exercise(request, exercise_id):
    """Get a single exercise by ID from ExerciseDB."""
    if not exercise_id or not exercise_id.strip():
        return Response(
            {'error': 'Exercise ID required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        url = f"{EXERCISEDB_API_BASE}/exercises/{exercise_id.strip()}"
        response = requests.get(url, timeout=30)
        
        if not response.ok:
            return Response(
                {'error': 'Exercise not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        data = response.json()
        exercise = data.get('data')
        
        if not exercise:
            return Response(
                {'error': 'Exercise not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        normalized = normalize_exercise_item(exercise)
        
        if not normalized['exerciseId']:
            return Response(
                {'error': 'Invalid exercise data'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(normalized)
        
    except requests.RequestException as e:
        return Response(
            {'error': f'Failed to fetch exercise: {str(e)}'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
