FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV DJANGO_SETTINGS_MODULE=macroscanner.settings.production
ENV PORT=8080

EXPOSE 8080

# Run migrations and start server
CMD sh -c "python manage.py migrate --noinput && gunicorn --bind 0.0.0.0:8080 macroscanner.wsgi:application"
