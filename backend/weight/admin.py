from django.contrib import admin
from .models import WeightLog


@admin.register(WeightLog)
class WeightLogAdmin(admin.ModelAdmin):
    list_display = ('weight_kg', 'logged_at', 'note', 'user', 'created_at')
    list_filter = ('logged_at',)
    search_fields = ('note',)
    date_hierarchy = 'logged_at'
