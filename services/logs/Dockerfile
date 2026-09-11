# logs (Flask + PyMongo) — auditoría, escucha en :5003.
# Imagen única: sin compilación, basta instalar deps y correr gunicorn.
FROM python:3.12-slim
WORKDIR /app
# Sin .pyc en disco + logs sin buffer (mejor para `docker logs`).
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
# Solo requirements primero → capa de pip cacheada.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && pip install --no-cache-dir gunicorn
COPY . ./
EXPOSE 5003
# Asume objeto `app` en app.py (MONGO_URI llega por entorno del compose).
CMD ["gunicorn", "-b", "0.0.0.0:5003", "app:app"]
