from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Profile, UserRole


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'is_active', 'is_staff', 'created_at')
    list_filter = ('is_active', 'is_staff', 'roles__role')
    search_fields = ('email', 'username')
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ()}),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.prefetch_related('roles')

    def is_admin(self, obj):
        return obj.is_admin
    is_admin.boolean = True

    def created_at(self, obj):
        return obj.date_joined


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'display_name', 'created_at', 'updated_at')
    search_fields = ('user__email', 'display_name')
    list_filter = ('created_at',)


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'created_at')
    list_filter = ('role',)
    search_fields = ('user__email',)
