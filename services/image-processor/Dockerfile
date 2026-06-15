FROM python:3.11-slim

WORKDIR /app

# Hardened system updates with retry loop configurations and repository fallbacks
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get update -y || (sleep 5 && apt-get update -y) && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the default u2net model into the image during compilation.
# This eliminates runtime cold-start latencies.
RUN python -c "from rembg import new_session; new_session('u2net')"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]