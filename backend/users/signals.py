"""Signals to auto-create profile and default role on user creation."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Profile, UserRole


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create profile and default user role when a new user is created."""
    if created:
        # Create profile
        display_name = instance.email.split('@')[0] if instance.email else None
        Profile.objects.create(
            user=instance,
            display_name=display_name
        )
        # Create default user role
        UserRole.objects.create(
            user=instance,
            role='user'
        )
