from django.contrib import admin
from .models import Product, ConsumptionLog, Settings


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'calories', 'protein', 'carbs', 'fat', 'user', 'created_at')
    list_filter = ('category', 'unit', 'created_at')
    search_fields = ('name', 'brand', 'barcode')
    date_hierarchy = 'created_at'


@admin.register(ConsumptionLog)
class ConsumptionLogAdmin(admin.ModelAdmin):
    list_display = ('product', 'amount', 'consumed_at', 'user', 'created_at')
    list_filter = ('consumed_at', 'created_at')
    search_fields = ('product__name',)
    date_hierarchy = 'consumed_at'


@admin.register(Settings)
class SettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'calorie_goal', 'protein_goal', 'carbs_goal', 'fat_goal')
    search_fields = ('user__email',)
