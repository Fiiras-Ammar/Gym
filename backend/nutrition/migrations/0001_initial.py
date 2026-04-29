# Generated initial migration

import uuid
from decimal import Decimal
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('brand', models.CharField(blank=True, max_length=255, null=True)),
                ('barcode', models.CharField(blank=True, max_length=255, null=True, unique=True)),
                ('calories', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=10)),
                ('protein', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=10)),
                ('carbs', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=10)),
                ('fat', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=10)),
                ('unit', models.CharField(default='g', max_length=10)),
                ('category', models.CharField(blank=True, max_length=50, null=True)),
                ('image_url', models.URLField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='products', to='users.user')),
            ],
            options={
                'db_table': 'products',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Settings',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('calorie_goal', models.DecimalField(decimal_places=2, default=Decimal('2000'), max_digits=10)),
                ('protein_goal', models.DecimalField(decimal_places=2, default=Decimal('150'), max_digits=10)),
                ('carbs_goal', models.DecimalField(decimal_places=2, default=Decimal('250'), max_digits=10)),
                ('fat_goal', models.DecimalField(decimal_places=2, default=Decimal('65'), max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='settings', to='users.user')),
            ],
            options={
                'db_table': 'settings',
            },
        ),
        migrations.CreateModel(
            name='ConsumptionLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('consumed_at', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='consumption_logs', to='nutrition.product')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='consumption_logs', to='users.user')),
            ],
            options={
                'db_table': 'consumption_logs',
                'ordering': ['-consumed_at'],
            },
        ),
        migrations.AddIndex(
            model_name='consumptionlog',
            index=models.Index(fields=['-consumed_at'], name='idx_logs_consumed_at'),
        ),
    ]
