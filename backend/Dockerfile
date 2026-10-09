# ==============================================================================
# ChainProof Backend Production Dockerfile
# Container Security & Software Supply-Chain Integrity Platform
# ==============================================================================
# This container communicates with the host Docker daemon socket:
# -v /var/run/docker.sock:/var/run/docker.sock
# ==============================================================================

FROM python:3.11-slim

# Prevent Python from writing .pyc files & enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies, Docker CLI, Syft, Cosign, and Docker Scout plugin
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    tar \
    gzip \
    && mkdir -p /etc/apt/keyrings \
    # Install Docker CLI
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends docker-ce-cli \
    # Install Syft (Anchore SBOM Generator)
    && curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin \
    # Install Cosign (Sigstore Digital Signature Verifier)
    && curl -fsSL "https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-$(dpkg --print-architecture)" -o /usr/local/bin/cosign \
    && chmod +x /usr/local/bin/cosign \
    # Install Docker Scout CLI plugin
    && mkdir -p /root/.docker/cli-plugins \
    && curl -fsSL https://raw.githubusercontent.com/docker/scout-cli/main/install.sh | sh -s -- \
    # Clean up APT caches
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application codebase, pre-trained ML models, and data
COPY app/ ./app/
COPY models/ ./models/
COPY data/ ./data/

# Expose FastAPI application port
EXPOSE 8000

# Launch production ASGI server
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
