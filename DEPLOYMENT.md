# 🚀 ChainProof Production Deployment & Infrastructure Guide

This guide provides step-by-step production deployment instructions for the **ChainProof Automated Container Security Platform**.

---

## 🏗️ Production Cross-Platform Architecture

```text
                                +-----------------------------+
                                |      CLIENT TIER            |
                                |                             |
                                | 1. Web: Vercel Static React |
                                | 2. Desktop: Tauri App       |
                                | 3. Mobile: Expo / React Nat |
                                +--------------+--------------+
                                               |
                                        HTTPS  | (Port 443)
                                               v
                                +-----------------------------+
                                |    REVERSE PROXY (Caddy/NG) |
                                |   Auto Let's Encrypt SSL    |
                                +--------------+--------------+
                                               |
                                        HTTP   | (Port 8000)
                                               v
                                +-----------------------------+
                                | DEDICATED LINUX SECURITY VM |
                                | FastAPI (FastAPI + Uvicorn) |
                                |                             |
                                | Volumes: /var/run/docker.sock
                                |          ./backend/data     |
                                +--------------+--------------+
                                               |
                        +----------------------+----------------------+
                        |                      |                      |
                        v                      v                      v
                Docker Daemon Socket    Syft & Scout CLI        Sigstore Cosign
```

---

## 🔒 Mandatory Docker Infrastructure Requirements

> [!CRITICAL]
> **The ChainProof scanner requires a real Docker daemon.**
> **Do NOT deploy the scanner backend as a normal Vercel serverless function.**
> Vercel only hosts the static React web frontend. Serverless environments cannot run the Docker daemon, mount `/var/run/docker.sock`, or invoke container tools like Syft and Docker Scout. The scanner backend MUST run on a Docker-capable Linux VPS/VM (Ubuntu 22.04/24.04 LTS).

---

## 📋 System Requirements for Linux VPS

- **Operating System**: Ubuntu 22.04 LTS or 24.04 LTS (x86_64)
- **Compute**: 2 vCPU minimum (4 vCPU recommended for concurrent image scans)
- **RAM**: 4 GB minimum (8 GB recommended for heavy image caching)
- **Disk**: 40 GB+ SSD (for local container image layer caching)
- **Recommended Cloud Providers**: AWS EC2, DigitalOcean Droplet, Hetzner Cloud, Linode, GCP Compute Engine

---

## 🛠️ Production Deployment (Docker Compose)

### Step 1: Provision the Server & Install Docker

SSH into your Linux VPS and install the official Docker Engine and Compose plugin:

```bash
# Update repositories
sudo apt-get update && sudo apt-get install -y curl ca-certificates gnupg git

# Add Docker's official GPG key & repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verify Docker is running:
```bash
sudo docker --version
sudo docker compose version
```

---

### Step 2: Clone the Repository & Configure Environment

```bash
cd /opt
sudo git clone https://github.com/Harikmar2005/Chainproof.git
cd Chainproof

# Configure environment variables
sudo cp backend/.env.example backend/.env
sudo nano backend/.env
```

Ensure the following variables are configured in `backend/.env`:
```ini
ENVIRONMENT=production
CORS_ORIGINS=https://your-vercel-domain.vercel.app,http://localhost:5173,tauri://localhost
AI_ANALYST_PROVIDER=deterministic

# Optional Alerting Integrations
CHAINPROOF_WEBHOOK_URL=https://hooks.slack.com/services/...
EXPO_PUSH_GATEWAY_URL=https://exp.host/--/api/v2/push/send
```

---

### Step 3: Build & Launch with Docker Compose

Review `docker-compose.yml`:
```yaml
version: "3.8"

services:
  chainproof-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: chainproof-backend
    restart: always
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      - ENVIRONMENT=production
      - CORS_ORIGINS=https://your-domain.vercel.app
      - AI_ANALYST_PROVIDER=deterministic
    volumes:
      # Mount host Docker socket for real container inspection
      - /var/run/docker.sock:/var/run/docker.sock
      # Persist historical scan reports, automations, and jobs
      - ./backend/data:/app/data
```

Build and launch the container in the background:
```bash
sudo docker compose up -d --build
```

Verify backend health:
```bash
curl -s http://127.0.0.1:8000/api/v1/health | jq .
```

---

### Step 4: Configure HTTPS Reverse Proxy with Automated SSL (Caddy)

Install Caddy (automatically manages Let's Encrypt certificates):

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy
```

Edit `/etc/caddy/Caddyfile`:
```caddy
api.yourdomain.com {
    reverse_proxy 127.0.0.1:8000 {
        header_up X-Forwarded-Proto {scheme}
        header_up Host {host}
    }
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

---

## 🌐 Web Application Deployment (Vercel)

The React web application is deployed to Vercel:

1. Connect your GitHub repository to Vercel.
2. Set the Root Directory to `frontend`.
3. Set the Environment Variable in Vercel Project Settings:
   ```ini
   VITE_API_URL=https://api.yourdomain.com
   ```
4. Deploy. The web application will immediately connect to your production Linux scanner API over HTTPS.

---

## 🔐 Security Hardening & Best Practices

1. **Docker Socket Protection**:
   - Never expose port `2375` (unencrypted Docker TCP) or port `2376` without mutual TLS certificates.
   - The Docker socket file `/var/run/docker.sock` should only be accessible by the `docker` system group.
2. **Subprocess Isolation**:
   - All tool invocations use parameter array vectors without `shell=True`.
   - Image names are validated via regex to prevent argument injection.
3. **Firewall Rules (UFW)**:
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
4. **Data Persistence**:
   - All audits, automations, jobs, notifications, and device registrations are persisted under `/opt/Chainproof/backend/data`.
   - Create nightly backups of `/opt/Chainproof/backend/data` using rsync or cron.
