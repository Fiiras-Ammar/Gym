"""Weight models - Weight logs for bodyweight tracking."""
import uuid
from django.db import models
from users.models import User


class WeightLog(models.Model):
    """Bodyweight tracking logs."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='weight_logs')
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2)
    logged_at = models.DateTimeField()
    note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'weight_logs'
        ordering = ['-logged_at']
        indexes = [
            models.Index(fields=['-logged_at'], name='idx_weight_logs_at'),
        ]

    def __str__(self):
        return f"{self.weight_kg}kg at {self.logged_at}"
