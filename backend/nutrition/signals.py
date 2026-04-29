"""Signals for nutrition app."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import User
from .models import Settings


@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    """Create default settings when a new user is created."""
    if created:
        Settings.objects.create(user=instance)
