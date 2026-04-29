"""Nutrition models - Products, ConsumptionLogs, and Settings."""
import uuid
from django.db import models
from users.models import User


class Product(models.Model):
    """Food products with nutritional information per 100g/ml."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    brand = models.CharField(max_length=255, null=True, blank=True)
    barcode = models.CharField(max_length=255, null=True, blank=True, unique=True)
    calories = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    protein = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    carbs = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fat = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=10, default='g')  # 'g' or 'ml'
    category = models.CharField(max_length=50, null=True, blank=True)  # 'packaged', 'produce', 'custom'
    image_url = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'products'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.brand or 'No brand'})"


class ConsumptionLog(models.Model):
    """Logs of consumed products."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consumption_logs')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='consumption_logs')
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # in grams or ml
    consumed_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'consumption_logs'
        ordering = ['-consumed_at']
        indexes = [
            models.Index(fields=['-consumed_at'], name='idx_logs_consumed_at'),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.amount}{self.product.unit} at {self.consumed_at}"


class Settings(models.Model):
    """User nutrition goals and settings."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    calorie_goal = models.DecimalField(max_digits=10, decimal_places=2, default=2000)
    protein_goal = models.DecimalField(max_digits=10, decimal_places=2, default=150)
    carbs_goal = models.DecimalField(max_digits=10, decimal_places=2, default=250)
    fat_goal = models.DecimalField(max_digits=10, decimal_places=2, default=65)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'settings'

    def __str__(self):
        return f"Settings for {self.user.email}"
