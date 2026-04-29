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
            name='WeightLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('weight_kg', models.DecimalField(decimal_places=2, max_digits=5)),
                ('logged_at', models.DateTimeField()),
                ('note', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='weight_logs', to='users.user')),
            ],
            options={
                'db_table': 'weight_logs',
                'ordering': ['-logged_at'],
            },
        ),
        migrations.AddIndex(
            model_name='weightlog',
            index=models.Index(fields=['-logged_at'], name='idx_weight_logs_at'),
        ),
    ]
