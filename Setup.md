# 🌱 YoungRoots — Setup Guide

> Complete installation and configuration guide for developers, DevOps engineers, and system administrators.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Setup](#2-repository-setup)
3. [Option A — Docker Compose (Recommended)](#3-option-a--docker-compose-recommended)
4. [Option B — Local Development (Manual)](#4-option-b--local-development-manual)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Database Setup](#6-database-setup)
7. [Running Background Workers](#7-running-background-workers)
8. [Frontend Setup](#8-frontend-setup)
9. [Seed Demo Data](#9-seed-demo-data)
10. [Verify the Installation](#10-verify-the-installation)
11. [Production Deployment](#11-production-deployment)
12. [Common Errors & Fixes](#12-common-errors--fixes)

---

## 1. Prerequisites

### 1.1 Required Software

| Tool | Minimum Version | Check Command | Install |
|---|---|---|---|
| **Git** | 2.x | `git --version` | [git-scm.com](https://git-scm.com) |
| **Docker** | 24.x | `docker --version` | [docs.docker.com](https://docs.docker.com/get-docker/) |
| **Docker Compose** | 2.x | `docker compose version` | Included with Docker Desktop |
| **Python** | 3.11+ | `python3 --version` | [python.org](https://python.org) *(local only)* |
| **Node.js** | 20+ | `node --version` | [nodejs.org](https://nodejs.org) *(local only)* |
| **PostgreSQL** | 15+ | `psql --version` | [postgresql.org](https://postgresql.org) *(local only)* |

### 1.2 Accounts & API Keys Required

| Service | Purpose | Get Key |
|---|---|---|
| **Anthropic** | Powers Yara AI assistant | [console.anthropic.com](https://console.anthropic.com) |

### 1.3 System Requirements

| Environment | Minimum | Recommended |
|---|---|---|
| RAM | 4 GB | 8 GB |
| Disk | 5 GB free | 20 GB free |
| CPU | 2 cores | 4 cores |
| OS | Ubuntu 22.04 / macOS 13 / Windows 11 (WSL2) | Ubuntu 22.04 LTS |

---

## 2. Repository Setup

### 2.1 Clone the Repository

```bash
git clone https://github.com/your-org/youngroots.git
cd youngroots
```

### 2.2 Verify the Structure

```bash
ls -la
# Expected output:
# backend/
# frontend/
# docker-compose.yml
# README.md
```

---

## 3. Option A — Docker Compose (Recommended)

This is the fastest way to run the full platform. Docker Compose starts all six services (PostgreSQL, Redis, Django, Celery worker, Celery beat, and React/nginx) with a single command.

### Step 1 — Configure Environment

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in the required values:

```bash
# Minimum required for Docker startup
SECRET_KEY=replace-with-a-long-random-string-at-least-50-chars
DB_PASSWORD=choose-a-strong-database-password
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
FIELD_ENCRYPTION_KEY=   # See Step 2 below
```

### Step 2 — Generate the Encryption Key

The `FIELD_ENCRYPTION_KEY` encrypts sensitive report content. Generate it once and store it securely:

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the output into `backend/.env`:

```bash
FIELD_ENCRYPTION_KEY=your-generated-fernet-key-here
```

> ⚠️ **Never regenerate this key after data has been written.** Changing it will make all existing encrypted reports unreadable.

### Step 3 — Build and Start

```bash
docker compose up --build
```

First build takes 3–5 minutes to pull base images and install dependencies. Subsequent starts take under 30 seconds.

### Step 4 — Watch the Logs

You will see the following sequence on a successful start:

```
youngroots_db       | database system is ready to accept connections
youngroots_redis    | Ready to accept connections
youngroots_backend  | Running migrations...
youngroots_backend  | Seeding demo data...
youngroots_backend  | ✅ Seed complete!
youngroots_backend  | [Gunicorn] Booting worker with pid: ...
youngroots_frontend | nginx: configuration file test is successful
```

### Step 5 — Access the Platform

| Service | URL |
|---|---|
| **Web App** | http://localhost:3000 |
| **API Root** | http://localhost:8000/api/v1/ |
| **API Docs (Swagger)** | http://localhost:8000/api/docs/ |
| **Django Admin** | http://localhost:8000/admin/ |

### Useful Docker Commands

```bash
# Run in background (detached)
docker compose up -d --build

# View live logs
docker compose logs -f

# View logs for a single service
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and delete all data (full reset)
docker compose down -v

# Restart a single service
docker compose restart backend

# Open a shell inside the backend container
docker compose exec backend bash

# Run Django management commands inside Docker
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py seed_data --reset
```

---

## 4. Option B — Local Development (Manual)

Use this approach when you need to debug the backend or frontend in isolation, or when Docker is not available.

### 4.1 Backend Setup

#### Step 1 — Create a Virtual Environment

```bash
cd backend
python3 -m venv venv

# Activate (macOS / Linux)
source venv/bin/activate

# Activate (Windows PowerShell)
venv\Scripts\Activate.ps1
```

Confirm activation — your terminal prompt should show `(venv)`.

#### Step 2 — Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

> **GeoDjango Note:** The `psycopg2-binary` and `GDAL` libraries require system-level dependencies. See [Section 6.3](#63-geodjango-system-dependencies) if you encounter GDAL errors.

#### Step 3 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env` — see [Section 5](#5-environment-variables-reference) for all options.

#### Step 4 — Set Up the Database

```bash
# Create the database (PostgreSQL must be running)
createdb youngroots_db

# Enable PostGIS extension
psql youngroots_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql youngroots_db -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;"

# Run migrations
python manage.py migrate
```

#### Step 5 — Create a Superuser

```bash
python manage.py createsuperuser
# Enter email, then password (twice)
```

#### Step 6 — Start the Development Server

```bash
python manage.py runserver
# API available at http://localhost:8000
```

### 4.2 Frontend Setup

Open a **new terminal window** (keep the backend running).

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:3000
```

Vite automatically proxies all `/api/` requests to `http://localhost:8000` (configured in `vite.config.js`).

### 4.3 Running Tests

```bash
# Backend tests
cd backend
python manage.py test apps --verbosity=2

# With coverage
pip install coverage
coverage run manage.py test apps
coverage report
coverage html   # Open htmlcov/index.html in browser

# Frontend (if test suite is added)
cd frontend
npm run test
```

---

## 5. Environment Variables Reference

All variables live in `backend/.env`. Copy from `backend/.env.example` as your starting point.

### 5.1 Core Django

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | ✅ Yes | — | Django secret key. Use 50+ random characters. |
| `DEBUG` | No | `False` | Set `True` for local development only. |
| `ALLOWED_HOSTS` | ✅ Yes | `localhost,127.0.0.1` | Comma-separated list of allowed hostnames. |

**Generate a strong SECRET_KEY:**

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(60))"
```

### 5.2 Database

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_NAME` | ✅ Yes | `youngroots_db` | PostgreSQL database name. |
| `DB_USER` | ✅ Yes | `youngroots_user` | PostgreSQL username. |
| `DB_PASSWORD` | ✅ Yes | — | PostgreSQL password. |
| `DB_HOST` | No | `localhost` | Database host. Use `db` inside Docker. |
| `DB_PORT` | No | `5432` | Database port. |

### 5.3 Redis

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_URL` | No | `redis://127.0.0.1:6379/0` | Redis connection URL. Use `redis://redis:6379/0` inside Docker. |

### 5.4 Anthropic AI

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | — | Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com). |

### 5.5 Security & Encryption

| Variable | Required | Default | Description |
|---|---|---|---|
| `FIELD_ENCRYPTION_KEY` | ✅ Yes | — | Fernet key for encrypting report content. Generate once and store securely. |
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated list of allowed frontend origins. |

### 5.6 Complete `.env.example`

```bash
# ── Core ──────────────────────────────────────────────────────
SECRET_KEY=replace-with-50-plus-random-characters
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# ── Database ──────────────────────────────────────────────────
DB_NAME=youngroots_db
DB_USER=youngroots_user
DB_PASSWORD=choose-a-strong-password
DB_HOST=localhost
DB_PORT=5432

# ── Redis ─────────────────────────────────────────────────────
REDIS_URL=redis://127.0.0.1:6379/0

# ── Anthropic AI ──────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-your-key-here

# ── Encryption ────────────────────────────────────────────────
# Generate with: python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FIELD_ENCRYPTION_KEY=your-generated-fernet-key

# ── CORS ─────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

## 6. Database Setup

### 6.1 Install PostgreSQL + PostGIS

**Ubuntu / Debian:**

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib postgis

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (Homebrew):**

```bash
brew install postgresql@16 postgis
brew services start postgresql@16
```

**Windows:** Download and install from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/). PostGIS is available via the Stack Builder included in the installer.

### 6.2 Create Database and User

```bash
# Switch to the postgres system user
sudo -u postgres psql

# Inside the psql shell:
CREATE USER youngroots_user WITH PASSWORD 'your-strong-password';
CREATE DATABASE youngroots_db OWNER youngroots_user;
\c youngroots_db
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
GRANT ALL PRIVILEGES ON DATABASE youngroots_db TO youngroots_user;
\q
```

### 6.3 GeoDjango System Dependencies

GeoDjango requires GDAL and GEOS libraries. Install them based on your OS:

**Ubuntu / Debian:**

```bash
sudo apt install -y gdal-bin libgdal-dev libgeos-dev libproj-dev binutils
```

**macOS (Homebrew):**

```bash
brew install gdal geos proj
```

**Confirm GDAL is available:**

```bash
gdal-config --version
# Expected: 3.x.x
```

If Django cannot find GDAL, add this to `backend/youngroots/settings.py`:

```python
import os
GDAL_LIBRARY_PATH = '/usr/lib/libgdal.so'   # Adjust path for your system
GEOS_LIBRARY_PATH = '/usr/lib/libgeos_c.so'
```

### 6.4 Run Migrations

```bash
cd backend
python manage.py migrate
```

Expected output shows each app's migrations applied:

```
Applying accounts.0001_initial... OK
Applying locator.0001_initial... OK
Applying ai_assistant.0001_initial... OK
Applying reports.0001_initial... OK
Applying referrals.0001_initial... OK
```

### 6.5 Database Backups

```bash
# Create a backup
pg_dump -U youngroots_user youngroots_db > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U youngroots_user youngroots_db < backup_20260501.sql

# Inside Docker
docker compose exec db pg_dump -U youngroots_user youngroots_db > backup.sql
```

---

## 7. Running Background Workers

Celery handles background tasks including crisis alerts, AI message cleanup, report auto-assignment, and dashboard pre-computation. Redis must be running before starting workers.

### 7.1 Start the Celery Worker

```bash
cd backend
source venv/bin/activate

celery -A youngroots worker \
  --loglevel=info \
  --concurrency=2 \
  --queues=default,crisis
```

### 7.2 Start the Celery Beat Scheduler

Open a **separate terminal**:

```bash
cd backend
source venv/bin/activate

celery -A youngroots beat \
  --loglevel=info \
  --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### 7.3 Scheduled Task Summary

| Task | Schedule | Description |
|---|---|---|
| `auto_assign_reports` | Every 30 min | Assigns new reports to available advocates |
| `purge_old_ai_messages` | Daily at 2am | Deletes AI messages older than 24 hours |
| `generate_weekly_dashboard_snapshot` | Sunday midnight | Pre-computes cached dashboard metrics |

### 7.4 Monitor Celery Tasks

```bash
# Install Flower (Celery monitoring UI)
pip install flower

# Start Flower dashboard
celery -A youngroots flower --port=5555
# Open: http://localhost:5555
```

### 7.5 Test a Task Manually

```bash
# Open Django shell
python manage.py shell

from apps.reports.tasks import purge_old_ai_messages
purge_old_ai_messages.delay()
# Check Celery worker terminal for task execution log
```

---

## 8. Frontend Setup

### 8.1 Install Node.js Dependencies

```bash
cd frontend
npm install
```

### 8.2 Configure API URL

By default, the Vite dev server proxies `/api/` requests to `http://localhost:8000`. To use a different backend URL, create `frontend/.env.local`:

```bash
VITE_API_URL=http://localhost:8000/api/v1
```

### 8.3 Start the Dev Server

```bash
npm run dev
# App: http://localhost:3000
# HMR (Hot Module Replacement) is enabled — changes reload instantly
```

### 8.4 Build for Production

```bash
npm run build
# Output: frontend/dist/
# Serve with nginx (see docker-compose.yml) or any static file server
```

### 8.5 Preview the Production Build Locally

```bash
npm run preview
# Preview at http://localhost:4173
```

---

## 9. Seed Demo Data

The seed command populates the database with sample services, countries, users, and reports for development and demonstration.

```bash
cd backend

# Load demo data (safe to run multiple times — uses get_or_create)
python manage.py seed_data

# Or inside Docker:
docker compose exec backend python manage.py seed_data
```

### What Gets Created

| Data | Count | Details |
|---|---|---|
| Countries | 6 | Kenya, Uganda, Tanzania, Ghana, South Africa, Nigeria |
| Services | 5 | Clinic, HIV testing, GBV support, mental health, family planning |
| Admin user | 1 | `admin@youngroots.demo` / `AdminPass2024!` |
| Advocate user | 1 | `advocate@youngroots.demo` / `AdvocatePass2024!` |
| Sample reports | 3 | New, active, and resolved — each with case steps |

### Reset and Reseed

```bash
# Clear all seed data and reload fresh
python manage.py seed_data --reset
```

---

## 10. Verify the Installation

Run through this checklist after setup to confirm everything is working.

### 10.1 Backend Health Checks

```bash
# Check Django is responding
curl http://localhost:8000/api/v1/dashboard/summary/
# Expected: {"services_listed": 5, "cases_resolved": 1, "reports_total": 3}

# Check service listings
curl http://localhost:8000/api/v1/services/
# Expected: JSON with "count" and "results" containing 5 services

# Check AI endpoint (requires ANTHROPIC_API_KEY)
curl -X POST http://localhost:8000/api/v1/ai/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what is contraception?", "language": "en"}'
# Expected: {"session_token": "...", "response": "...", ...}

# Check anonymous token generation
curl -X POST http://localhost:8000/api/v1/auth/anonymous/
# Expected: {"token": "...", "expires_at": "...", "user_id": "..."}
```

### 10.2 Frontend Checks

Open http://localhost:3000 and verify:

- [ ] Home page loads with the green hero banner
- [ ] "Find Services" navigates to the Service Locator page
- [ ] Service cards appear (5 demo services)
- [ ] "AI Guide" opens the chat with Yara
- [ ] Sending a message in chat returns a response from the AI
- [ ] "Report" page loads with the anonymous form
- [ ] Submitting a report shows a case ID (e.g. `YR-2026-4821`)
- [ ] "My Cases" page accepts the case ID and shows steps
- [ ] "Sign In" page has the anonymous session button

### 10.3 Django Admin Check

1. Open http://localhost:8000/admin/
2. Log in with `admin@youngroots.demo` / `AdminPass2024!`
3. Verify all apps appear: Accounts, Locator, Reports, Referrals, AI Assistant

### 10.4 API Documentation Check

Open http://localhost:8000/api/docs/ — the Swagger UI should list all 23 endpoints.

---

## 11. Production Deployment

### 11.1 Pre-Deployment Checklist

Before going live, complete every item on this list:

**Security**
- [ ] `DEBUG=False` in `.env`
- [ ] `SECRET_KEY` is at least 50 random characters and not the default
- [ ] `ALLOWED_HOSTS` contains only your production domain(s)
- [ ] `FIELD_ENCRYPTION_KEY` is stored in a secrets manager (not plain `.env`)
- [ ] `ANTHROPIC_API_KEY` is stored securely
- [ ] All demo passwords changed (`admin@youngroots.demo`, `advocate@youngroots.demo`)
- [ ] HTTPS certificate installed and `SECURE_SSL_REDIRECT=True`
- [ ] `CORS_ALLOWED_ORIGINS` set to your production frontend domain only

**Database**
- [ ] Production PostgreSQL with PostGIS running
- [ ] Automated daily backups configured
- [ ] Database user has minimum required privileges (not superuser)

**Infrastructure**
- [ ] Redis is password-protected in production
- [ ] Celery worker and beat are running as system services (systemd)
- [ ] Log rotation configured for `backend/logs/youngroots.log`
- [ ] Media files (`backend/media/`) stored on persistent volume or object storage

### 11.2 Production Environment Variables

Add these to your production `.env`:

```bash
DEBUG=False
SECURE_SSL_REDIRECT=True
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Database (use a managed PostgreSQL service like AWS RDS, Supabase, etc.)
DB_HOST=your-production-db-host
DB_PASSWORD=very-strong-production-password

# Use a managed Redis (ElastiCache, Upstash, etc.)
REDIS_URL=redis://:password@your-redis-host:6379/0
```

### 11.3 Collect Static Files

```bash
cd backend
python manage.py collectstatic --no-input
# Static files copied to backend/staticfiles/
# WhiteNoise serves these automatically via Gunicorn
```

### 11.4 Set Up systemd Services (Linux)

**Celery Worker — `/etc/systemd/system/youngroots-worker.service`:**

```ini
[Unit]
Description=YoungRoots Celery Worker
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/youngroots/backend
EnvironmentFile=/var/www/youngroots/backend/.env
ExecStart=/var/www/youngroots/backend/venv/bin/celery \
  -A youngroots worker --loglevel=warning --concurrency=2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Celery Beat — `/etc/systemd/system/youngroots-beat.service`:**

```ini
[Unit]
Description=YoungRoots Celery Beat
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/youngroots/backend
EnvironmentFile=/var/www/youngroots/backend/.env
ExecStart=/var/www/youngroots/backend/venv/bin/celery \
  -A youngroots beat --loglevel=warning \
  --scheduler django_celery_beat.schedulers:DatabaseScheduler
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start both services
sudo systemctl daemon-reload
sudo systemctl enable youngroots-worker youngroots-beat
sudo systemctl start youngroots-worker youngroots-beat

# Check status
sudo systemctl status youngroots-worker
```

### 11.5 nginx Configuration (Production)

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # React frontend (static files)
    root /var/www/youngroots/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Django API + admin
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    location /static/ {
        alias /var/www/youngroots/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /var/www/youngroots/backend/media/;
    }
}
```

---

## 12. Common Errors & Fixes

### Error: `GDAL_LIBRARY_PATH` not found

```
ImproperlyConfigured: Could not find the GDAL library
```

**Fix:**

```bash
# Find GDAL on your system
find /usr -name "libgdal*" 2>/dev/null

# Add to settings.py
GDAL_LIBRARY_PATH = '/usr/lib/x86_64-linux-gnu/libgdal.so.32'  # adjust version
```

---

### Error: `djngo.db.utils.OperationalError: could not connect to server`

**Fix:** PostgreSQL is not running or `.env` DB credentials are wrong.

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection manually
psql -h localhost -U youngroots_user -d youngroots_db

# If using Docker, ensure DB_HOST=db (not localhost)
```

---

### Error: `ModuleNotFoundError: No module named 'environ'`

**Fix:** Virtual environment is not activated or dependencies not installed.

```bash
source venv/bin/activate
pip install -r requirements.txt
```

---

### Error: `CORS error` in browser console

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Fix:** Add the frontend origin to `CORS_ALLOWED_ORIGINS` in `.env`:

```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

### Error: `Redis connection refused`

```
redis.exceptions.ConnectionError: Error 111 connecting to 127.0.0.1:6379
```

**Fix:**

```bash
# Start Redis locally
sudo systemctl start redis

# Or with Docker
docker run -d -p 6379:6379 redis:7-alpine

# Test connection
redis-cli ping
# Expected: PONG
```

---

### Error: `Anthropic API error` in AI chat

**Fix:** Check your API key is valid and has credits.

```bash
# Test the key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

---

### Error: `postgis extension not found`

```
django.db.utils.ProgrammingError: type "geometry" does not exist
```

**Fix:**

```bash
psql -U postgres -d youngroots_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -U postgres -d youngroots_db -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;"
```

---

### Error: `Vite proxy error` — API requests fail in dev

**Fix:** Confirm the Django backend is running on port 8000 and check `vite.config.js`:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    }
  }
}
```

---

### Error: `docker compose` command not found

```
bash: docker compose: command not found
```

**Fix:** Install Docker Desktop (includes Compose v2), or update the standalone compose plugin:

```bash
sudo apt install docker-compose-plugin
```

---

## Quick Reference Card

```bash
# ── DOCKER (full stack) ──────────────────────────────────────
docker compose up --build          # Start everything (first time)
docker compose up -d               # Start in background
docker compose down                # Stop everything
docker compose down -v             # Stop and delete all data
docker compose logs -f backend     # Watch backend logs
docker compose exec backend bash   # Shell into backend container

# ── BACKEND (local) ──────────────────────────────────────────
source venv/bin/activate           # Activate Python env
python manage.py runserver         # Start Django dev server
python manage.py migrate           # Apply database migrations
python manage.py seed_data         # Load demo data
python manage.py seed_data --reset # Wipe and reload demo data
python manage.py createsuperuser   # Create admin user
python manage.py shell             # Django interactive shell
python manage.py test apps         # Run all tests

# ── CELERY (local) ───────────────────────────────────────────
celery -A youngroots worker --loglevel=info          # Worker
celery -A youngroots beat --loglevel=info            # Scheduler
celery -A youngroots flower --port=5555              # Monitor UI

# ── FRONTEND (local) ─────────────────────────────────────────
npm install                        # Install dependencies
npm run dev                        # Start dev server (:3000)
npm run build                      # Build for production
npm run preview                    # Preview production build

# ── DATABASE ─────────────────────────────────────────────────
pg_dump -U youngroots_user youngroots_db > backup.sql   # Backup
psql -U youngroots_user youngroots_db < backup.sql       # Restore
```

---

*YoungRoots AYSRHR Platform · Setup Guide · Version 1.0 · May 2026*
*Built with ❤️ for young people · Privacy by design · Rights at the centre*
