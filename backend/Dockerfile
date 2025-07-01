# backend/Dockerfile
FROM python:3.10-slim

# 1. Set a working directory
WORKDIR /app

# 2. Install system deps (for psycopg2, pandas, etc.)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Copy requirements and install Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy the rest of the backend code
COPY backend/etl_pipeline.py backend/main.py backend/config.yaml ./

# 5. Expose port and launch uvicorn on startup
EXPOSE 8000
CMD ["uvicorn", "etl_pipeline:app", "--host", "0.0.0.0", "--port", "8000"]
