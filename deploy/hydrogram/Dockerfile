FROM python:3.11-slim

WORKDIR /app

COPY scripts/requirements-hydrogram.txt /app/requirements-hydrogram.txt
RUN pip install --no-cache-dir -r /app/requirements-hydrogram.txt

COPY scripts/hydrogram_listener.py /app/hydrogram_listener.py

ENV PYTHONUNBUFFERED=1
CMD ["python", "/app/hydrogram_listener.py"]
