FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV DJANGO_SETTINGS_MODULE=macroscanner.settings.production
ENV PORT=8080

EXPOSE 8080

# Start server (migrations must be run separately via Cloud Run Jobs)
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--timeout", "60", "macroscanner.wsgi:application"]
