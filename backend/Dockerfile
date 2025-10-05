# Backend Dockerfile za Django aplikaciju
FROM python:3.11-slim

# Postavi working directory
WORKDIR /app

# Kopiraj requirements.txt prvo (za bolju Docker cache)
COPY requirements.txt .

# Instaliraj Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Kopiraj sve backend fajlove
COPY . .

# Kreiraj media direktorijum
RUN mkdir -p media/images media/logos

# Postavi environment varijable
ENV PYTHONPATH=/app
ENV DJANGO_SETTINGS_MODULE=imagecropper.settings

# Ekspozuj port
EXPOSE 8000

# Pokreni Django server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]