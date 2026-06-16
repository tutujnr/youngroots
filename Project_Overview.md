# 🌱 YoungRoots — AYSRHR Platform
## Project Overview

> **Adolescent & Youth Sexual and Reproductive Health & Rights · AI-Powered · Privacy-First · Rights-Based**

| Field | Detail |
|---|---|
| **Document Title** | YoungRoots AYSRHR Platform — Project Overview |
| **Version** | 1.0 |
| **Date** | May 2026 |
| **Status** | Active Development |
| **Classification** | Internal / Confidential |
| **Primary Stack** | Django 4.2 · React 18 · PostgreSQL/PostGIS · Claude AI · Redis · Celery |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Context & Problem Statement](#2-platform-context--problem-statement)
3. [Platform Modules](#3-platform-modules)
4. [System Architecture](#4-system-architecture)
5. [API Endpoint Reference](#5-api-endpoint-reference)
6. [Privacy & Security Framework](#6-privacy--security-framework)
7. [Technology Stack](#7-technology-stack)
8. [Role-Based Access Control](#8-role-based-access-control)
9. [MVP Implementation Roadmap](#9-mvp-implementation-roadmap)
10. [Deployment & Infrastructure](#10-deployment--infrastructure)
11. [Language & Accessibility](#11-language--accessibility)
12. [Demo Credentials & Test Data](#12-demo-credentials--test-data)
13. [Future Development Priorities](#13-future-development-priorities)

---

## 1. Executive Summary

YoungRoots is a comprehensive, AI-powered digital platform purpose-built to empower young people to access sexual and reproductive health (SRH) services, exercise their rights, and report violations — safely, privately, and anonymously. It addresses the persistent barriers that prevent adolescents and youth from accessing sexual and reproductive health and rights (SRHR) services: stigma, distance, lack of privacy, and information gaps.

Built on a Django REST API backend and a React single-page application frontend, the platform integrates Anthropic's Claude AI to power **Yara** — a multilingual, non-judgmental AI health guide. The system serves youth users, trained advocates, and system administrators through role-based access, while ensuring all sensitive data is encrypted and anonymous reporting is fully privacy-preserving.

> **Mission Statement**
>
> To ensure every young person — regardless of location, gender, or background — can safely access SRHR information, find verified health services, report rights violations anonymously, and receive dignified support through a rights-based, technology-enabled platform.

---

## 2. Platform Context & Problem Statement

### 2.1 The Problem

Young people between the ages of 10 and 24 face severe barriers in accessing SRHR services across sub-Saharan Africa:

- Stigma and judgement from healthcare providers deterring service-seeking
- Lack of age-appropriate, accurate information in local languages
- Geographic inaccessibility of youth-friendly health facilities
- Absence of safe, anonymous channels to report GBV or rights violations
- No structured system for tracking case outcomes and service referrals
- Inadequate data on service gaps for evidence-based advocacy

### 2.2 Target Beneficiaries

| User Group | Profile | Platform Value |
|---|---|---|
| **Youth Users** | Ages 10–24, primary beneficiaries | Anonymous service access, AI guide, reporting |
| **Advocates** | Trained social workers, case managers | Case management, referrals, dashboard |
| **Administrators** | Platform operators, programme staff | Full system management, reporting, analytics |

---

## 3. Platform Modules

YoungRoots is structured around six core modules, each corresponding to a distinct Django application and React page set.

### Module 1 — 🗺️ Service Locator

Find verified youth-friendly SRHR clinics, HIV testing, GBV support, counselling, and legal aid using location-based search with geospatial filtering.

**Tech:** Django GIS · PostGIS · GeoDjango · React Leaflet · OpenStreetMap

### Module 2 — 🤖 AI AYSRHR Assistant

Yara — a Claude-powered AI guide providing accurate, empathetic, youth-friendly SRHR information across all topics and six African languages. Anonymous, session-based, and rate-limited.

**Tech:** Anthropic Claude API · Django REST · React chat UI · Session anonymisation

### Module 3 — 🔒 Anonymous Reporting

Fully anonymous, encrypted reporting of rights violations, GBV, and service barriers. No IP logging. Case IDs issued for follow-up without any identity linkage.

**Tech:** Field encryption (Fernet) · Rate limiting · Django REST · Anonymous tokens

### Module 4 — 📋 Case Tracking & Referral Support

Structured referral pathways, step-by-step case tracking, advocate assignment, and follow-up support — all accessible via case ID without login.

**Tech:** Referral model · CaseStep workflow · Celery auto-assignment · REST API

### Module 5 — 📊 Advocacy & Data Dashboard

Aggregated, anonymised analytics: reporting trends, service gap mapping, AI question patterns, and case resolution metrics for advocates and policy teams.

**Tech:** Django ORM aggregation · Redis cache · Recharts · Celery periodic tasks

### Module 6 — ⚙️ Admin Management Panel

Role-based administration of users, service listings, incoming reports, referrals, and system settings with a full audit trail.

**Tech:** Django Admin · SimpleJWT · Role guards · django-simple-history

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / Mobile App                      │
│         React 18 SPA (Vite) · Zustand · Axios              │
│              react-leaflet · Recharts · i18next             │
└────────────────────────┬────────────────────────────────────┘
                         │  HTTPS REST API
┌────────────────────────▼────────────────────────────────────┐
│               Django 4.2 + DRF · Gunicorn                   │
│    6 Django Apps · JWT + Anonymous Token Auth               │
│          Rate Limiting · Field Encryption                    │
└──────────┬─────────────────┬───────────────┬───────────────┘
           │                 │               │
┌──────────▼──────┐ ┌────────▼───────┐ ┌────▼──────────────┐
│ PostgreSQL      │ │ Redis          │ │ Anthropic         │
│ + PostGIS       │ │ Cache + Celery │ │ Claude API        │
│ Primary DB +    │ │ Background     │ │ AI Assistant      │
│ GIS index       │ │ Tasks          │ │ (Yara)            │
└─────────────────┘ └────────────────┘ └───────────────────┘
```

### 4.2 Backend — Django Application Structure

| App | Key Models | Key Responsibilities |
|---|---|---|
| `apps.accounts` | User, AnonymousToken | Auth, roles, JWT, anonymous sessions |
| `apps.locator` | Service, ServiceReview, Country | GIS service search, verification, reviews |
| `apps.ai_assistant` | ConversationSession, AIMessage | Claude API, topic detection, session privacy |
| `apps.reports` | Report, ReportNote | Encrypted anonymous reports, case IDs |
| `apps.referrals` | Referral, CaseStep | Referral pathways, guided step tracking |
| `apps.dashboard` | *(computed — no own models)* | Aggregated analytics, cached metrics |

### 4.3 Frontend — React Page Structure

| Page / Component | Purpose |
|---|---|
| `Home.jsx` | Landing page: hero, live stats, module navigation grid |
| `Login.jsx` | JWT login + one-click anonymous session creation |
| `ServiceLocator.jsx` | Category filters, keyword search, map pins, service detail modal |
| `AIAssistant.jsx` | Live chat with Yara, quick-question buttons, session management |
| `ReportForm.jsx` | Anonymous report form with type, urgency, support-needed fields |
| `CaseTracker.jsx` | Case ID lookup, progress bar, step badges, referral list |
| `Dashboard.jsx` | KPI cards, bar chart, trend chart, topic breakdown (advocate+) |
| `AdminPanel.jsx` | Tabbed admin: Users, Services, Reports, Roles, Settings (admin only) |

### 4.4 Project File Structure

```
youngroots/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── youngroots/
│   │   ├── settings.py          # Full Django config
│   │   ├── urls.py              # Root URL routing
│   │   ├── middleware.py        # Anonymous session + privacy
│   │   ├── pagination.py        # Standard pagination
│   │   ├── celery.py            # Celery + Beat scheduler
│   │   └── wsgi.py
│   └── apps/
│       ├── accounts/            # Auth, users, roles
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── permissions.py
│       │   ├── authentication.py
│       │   └── admin.py
│       ├── locator/             # Service Locator (GeoDjango)
│       │   ├── models.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── admin.py
│       │   └── management/commands/seed_data.py
│       ├── ai_assistant/        # AI Chat (Claude)
│       │   ├── models.py        # Includes views + AI logic
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── admin.py
│       ├── reports/             # Anonymous Reporting
│       │   ├── models.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── tasks.py         # Celery background tasks
│       │   └── admin.py
│       ├── referrals/           # Case Tracking & Referrals
│       │   ├── models.py        # Includes views + workflow
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── admin.py
│       └── dashboard/           # Advocacy Dashboard
│           ├── analytics.py     # Metrics engine + views
│           ├── views.py
│           ├── urls.py
│           └── admin.py
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── main.jsx
        ├── App.jsx              # Router + lazy loading + route guards
        ├── index.css
        ├── pages/
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── ServiceLocator.jsx
        │   ├── AIAssistant.jsx
        │   ├── ReportForm.jsx
        │   ├── CaseTracker.jsx
        │   ├── Dashboard.jsx
        │   ├── AdminPanel.jsx
        │   └── NotFound.jsx
        ├── components/layout/
        │   └── Layout.jsx       # Navbar + lang switcher + footer
        ├── context/
        │   └── authStore.js     # Zustand (JWT + anonymous auth)
        ├── hooks/
        │   ├── useServices.js   # Service fetching with debounce
        │   └── useCase.js       # Case lookup + step management
        └── utils/
            ├── api.js           # Axios client + all API methods
            └── i18n.js          # EN / SW / FR / PT translations
```

---

## 5. API Endpoint Reference

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/anonymous/` | Start anonymous session | None |
| `POST` | `/api/v1/auth/login/` | JWT login | None |
| `POST` | `/api/v1/auth/register/` | Register new user | None |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh JWT access token | Refresh token |
| `GET` | `/api/v1/auth/profile/` | Get / update current user profile | JWT |
| `GET` | `/api/v1/services/` | List / search services (geo-enabled) | None |
| `GET` | `/api/v1/services/{id}/` | Get service detail | None |
| `POST` | `/api/v1/services/{id}/review/` | Submit anonymous service review | None |
| `POST` | `/api/v1/services/{id}/verify/` | Verify a service listing | Admin |
| `POST` | `/api/v1/ai/chat/` | Send message to Yara AI | None / Anon |
| `POST` | `/api/v1/ai/recommend/` | Get AI service recommendation | None |
| `POST` | `/api/v1/reports/submit/` | Submit anonymous report | None |
| `GET` | `/api/v1/reports/lookup/{case_id}/` | Look up report by case ID | None |
| `GET` | `/api/v1/reports/admin/` | List all reports | Advocate+ |
| `PATCH` | `/api/v1/reports/admin/{id}/` | Update report status | Advocate+ |
| `POST` | `/api/v1/reports/admin/{id}/notes/` | Add internal note to report | Advocate+ |
| `GET` | `/api/v1/referrals/case/{case_id}/` | Full case detail + steps + referrals | None (case ID) |
| `POST` | `/api/v1/referrals/case/{case_id}/referral/` | Create referral for a case | Advocate+ |
| `PATCH` | `/api/v1/referrals/steps/{id}/` | Mark a case step complete | Advocate+ |
| `GET` | `/api/v1/dashboard/metrics/` | Aggregated anonymised metrics | Advocate+ |
| `GET` | `/api/v1/dashboard/summary/` | Public landing page stats | None |
| `GET` | `/api/schema/` | OpenAPI schema | None |
| `GET` | `/api/docs/` | Swagger UI documentation | None |

### Geospatial Search Parameters

The `/api/v1/services/` endpoint supports location-based filtering:

```
GET /api/v1/services/?lat=-1.286&lng=36.817&radius=10&category=clinic&is_free=true
```

| Parameter | Type | Description |
|---|---|---|
| `lat` | float | User latitude (decimal degrees) |
| `lng` | float | User longitude (decimal degrees) |
| `radius` | float | Search radius in kilometres (default: 10) |
| `category` | string | Filter by service type |
| `is_free` | boolean | Show only free services |
| `search` | string | Keyword search across name, description, region |

---

## 6. Privacy & Security Framework

Privacy is the foundational design principle of YoungRoots. Every technical decision considers the safety of the young people using the platform.

| Feature | Implementation | Benefit |
|---|---|---|
| **Anonymous sessions** | UUID tokens, no account needed | Youth can use all core features without identity |
| **No IP logging** | `AnonymousSessionMiddleware` strips server headers | Reports cannot be traced to a device or location |
| **Field encryption** | Fernet symmetric encryption on report text | Report content unreadable if DB is compromised |
| **AI chat privacy** | Messages auto-deleted after 24h via Celery | No long-term storage of health conversations |
| **Rate limiting** | AI: 30/hr · Reports: 10/hr · Anon: 20/hr | Prevents abuse and spam submissions |
| **JWT with rotation** | 2hr access + 7d refresh, blacklisted on rotation | Short-lived tokens reduce theft exposure |
| **Audit trail** | `django-simple-history` on Report, Referral | Full staff-facing change log for accountability |
| **HTTPS & HSTS** | `Strict-Transport-Security` in production | Prevents network-level interception |
| **Secure cookies** | `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | Mitigates XSS and CSRF attack vectors |
| **Header sanitisation** | Removes `Server` and `X-Powered-By` headers | Reduces fingerprinting and recon surface |

### Celery Privacy Tasks

| Task | Schedule | Purpose |
|---|---|---|
| `purge_old_ai_messages` | Daily at 2am | Deletes AI messages older than 24 hours |
| `auto_assign_reports` | Every 30 minutes | Assigns new reports to available advocates |
| `generate_weekly_dashboard_snapshot` | Sunday midnight | Pre-computes cached dashboard metrics |
| `notify_crisis_report` | On submission | Alerts on-call advocates for crisis-level reports |

---

## 7. Technology Stack

### Backend

| Technology | Version | Role |
|---|---|---|
| Django | 4.2 LTS | Web framework, ORM, admin interface |
| Django REST Framework | 3.15 | REST API, serialisation, authentication |
| GeoDjango + PostGIS | Latest | Geospatial service search and proximity queries |
| Celery | 5.3 | Background task processing |
| Redis | 7 | Cache store and Celery message broker |
| SimpleJWT | 5.3 | JWT authentication with refresh token rotation |
| django-simple-history | 3.5 | Audit trail for reports and referrals |
| drf-spectacular | 0.27 | Auto-generated OpenAPI schema + Swagger UI |
| django-encrypted-model-fields | 0.6 | Field-level encryption for sensitive data |
| django-ratelimit | 4.1 | Request rate limiting per IP and user |

### AI

| Technology | Version | Role |
|---|---|---|
| Anthropic Claude API | claude-sonnet-4 | Yara AI assistant engine |
| anthropic Python SDK | 0.28 | API client with error handling |

### Database

| Technology | Version | Role |
|---|---|---|
| PostgreSQL | 16 | Primary relational database |
| PostGIS | 3.4 | Geospatial extension for proximity search |

### Frontend

| Technology | Version | Role |
|---|---|---|
| React | 18 | Component-based SPA framework |
| Vite | 5 | Build tool with HMR and code splitting |
| Zustand | 4.5 | Lightweight global state management |
| Axios | 1.7 | HTTP client with interceptors |
| react-query | 3.x | Server state caching and synchronisation |
| react-leaflet | 4.2 | Interactive maps with OpenStreetMap tiles |
| Recharts | 2.12 | Dashboard charts and data visualisations |
| i18next | 23 | Internationalisation (EN/SW/FR/PT) |
| react-hook-form + zod | Latest | Type-safe form validation |
| react-hot-toast | 2.4 | Toast notifications |

### Infrastructure

| Technology | Version | Role |
|---|---|---|
| Docker + Docker Compose | Latest | Containerised full-stack deployment |
| Gunicorn | 22 | WSGI production server |
| nginx | Alpine | Reverse proxy + static asset serving |
| WhiteNoise | 6.7 | Django static file serving |

---

## 8. Role-Based Access Control

| Permission | Youth / Anon | Advocate | Admin | Super Admin |
|---|---|---|---|---|
| Use AI guide | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Find services | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Submit report | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Track own case | ✅ By case ID | ✅ Yes | ✅ Yes | ✅ Yes |
| View all reports | ❌ No | Assigned only | ✅ Yes | ✅ Yes |
| Create referrals | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| Add case notes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| View dashboard | Public summary | Limited | ✅ Full | ✅ Full |
| Manage services | ❌ No | Suggest only | ✅ Yes | ✅ Yes |
| Manage users | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Assign roles | ❌ No | ❌ No | Limited | ✅ Full |
| System settings | ❌ No | ❌ No | ❌ No | ✅ Yes |

### Permission Classes (Django)

```python
# apps/accounts/permissions.py

IsAdminUser          # role in ['admin', 'super_admin']
IsSuperAdmin         # role == 'super_admin'
IsAdvocateOrAdmin    # role in ['advocate', 'admin', 'super_admin']
IsOwnerOrAdmin       # object owner OR any admin role
AnonymousTokenAuthentication  # X-Anonymous-Token header auth
```

---

## 9. MVP Implementation Roadmap

### Phase 1 — Core Backend (Weeks 1–4)
- Django project setup with all app scaffolding and configuration
- Custom User model with anonymous session support
- Service Locator API with geospatial proximity search
- Anonymous report submission with field encryption
- Basic case tracking with CaseStep model

### Phase 2 — AI + Case Management (Weeks 5–8)
- Claude AI integration — Yara assistant with topic detection
- Referral system with structured pathway steps
- Dashboard analytics engine with Redis caching
- Celery tasks: crisis alerts, data purge, auto-assignment
- Admin panel with audit trail

### Phase 3 — Frontend SPA (Weeks 9–12)
- React SPA with all 8 pages and lazy loading
- Zustand auth store with JWT and anonymous flows
- i18n for English, Swahili, French, Portuguese
- Responsive layout with mobile-first design
- Docker Compose full-stack deployment

### Phase 4 — Hardening & Pilot Launch (Weeks 13–16)
- Live map integration with Leaflet + OpenStreetMap
- SMS notifications via Africa's Talking / Twilio
- Penetration testing and security audit
- Progressive Web App (offline support)
- Load testing and performance tuning
- Pilot deployment with partner organisations

### Phase 5 — Expansion (Weeks 17–20)
- USSD interface for feature phones
- Additional language packs (Amharic, Yoruba, Hausa, Zulu)
- Multi-country service data ingestion
- Analytics data exports for donor reporting
- SDK for third-party NGO embedding

---

## 10. Deployment & Infrastructure

### 10.1 Docker Compose Services

| Service | Image / Port | Description |
|---|---|---|
| `db` | `postgis/postgis:16-3.4` · 5432 | PostgreSQL + PostGIS for geospatial queries |
| `redis` | `redis:7-alpine` · 6379 | Cache store and Celery message broker |
| `backend` | Custom · 8000 | Django + Gunicorn, auto-migrates and seeds on start |
| `celery_worker` | Shared backend image | Background tasks: crisis alerts, data purge |
| `celery_beat` | Shared backend image | Scheduler: auto-assign reports, weekly snapshots |
| `frontend` | `nginx:alpine` · 3000 | React SPA via nginx with API proxy to backend |

### 10.2 Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/youngroots.git
cd youngroots

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit .env — add SECRET_KEY, DB_PASSWORD, ANTHROPIC_API_KEY, FIELD_ENCRYPTION_KEY

# 3. Start the full stack
docker compose up --build

# 4. Access the platform
# App:  http://localhost:3000
# API:  http://localhost:8000
# Docs: http://localhost:8000/api/docs/
```

### 10.3 Local Development (No Docker)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # Fill in values
createdb youngroots_db
psql youngroots_db -c "CREATE EXTENSION postgis;"
python manage.py migrate
python manage.py seed_data     # Load demo services + users
python manage.py runserver

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                    # http://localhost:3000

# Celery worker (separate terminal)
cd backend
celery -A youngroots worker --loglevel=info

# Celery beat scheduler (separate terminal)
celery -A youngroots beat --loglevel=info
```

### 10.4 Key Environment Variables

```bash
# backend/.env
SECRET_KEY=your-very-long-random-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

DB_NAME=youngroots_db
DB_USER=youngroots_user
DB_PASSWORD=your-db-password
DB_HOST=localhost

REDIS_URL=redis://127.0.0.1:6379/0
ANTHROPIC_API_KEY=sk-ant-your-key-here
FIELD_ENCRYPTION_KEY=your-fernet-key-here   # Generate with Fernet.generate_key()
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

## 11. Language & Accessibility

YoungRoots is designed for low-bandwidth environments and multilingual African youth.

**Supported Languages**

| Code | Language | Coverage |
|---|---|---|
| `en` | English | Full — all UI, AI responses, emails |
| `sw` | Swahili | Full — all UI, AI responses |
| `fr` | French | Full — all UI, AI responses |
| `pt` | Portuguese | Full — all UI, AI responses |
| `am` | Amharic | Planned — Phase 5 |
| `yo` | Yoruba | Planned — Phase 5 |

**Accessibility & Performance Principles**

- AI assistant (Yara) auto-detects and responds in the user's written language — no configuration required
- Vite build with manual chunking keeps initial JS bundle under 200KB (gzip)
- nginx gzip compression enabled for all text, CSS, and JS assets
- Images served with `Cache-Control: public, immutable` with 1-year expiry
- Offline PWA support planned in Phase 4 via service worker
- USSD fallback interface planned in Phase 5 for feature phones without data
- All forms and pages target WCAG 2.1 AA colour contrast compliance
- Semantic HTML with ARIA labels throughout all React components

---

## 12. Demo Credentials & Test Data

| Role | Email | Password | Access Level |
|---|---|---|---|
| Super Admin | `admin@youngroots.demo` | `AdminPass2024!` | Full system access |
| Advocate | `advocate@youngroots.demo` | `AdvocatePass2024!` | Cases + Dashboard |
| Youth User | *(anonymous — no email)* | *(one click from Login page)* | Core features |

**Seed Data (loaded via `python manage.py seed_data`)**

- 5 verified sample services across Nairobi (clinic, HIV testing, GBV, mental health, family planning)
- 6 countries pre-loaded (Kenya, Uganda, Tanzania, Ghana, South Africa, Nigeria)
- 3 sample reports at various stages (new, active, resolved) with case steps
- All demo users with correct role assignments

> ⚠️ **Security Note:** Demo credentials are for development and testing only.
> Change all passwords and `SECRET_KEY` before any production deployment.
> Rotate `FIELD_ENCRYPTION_KEY` securely and never commit `.env` to version control.

---

## 13. Future Development Priorities

### Short-Term (Phase 4–5)
- Live interactive map with Leaflet + OpenStreetMap tile layer and real GPS search
- SMS notifications via Africa's Talking or Twilio for crisis report alerts
- Progressive Web App (PWA) with offline caching for low-connectivity environments
- USSD interface for youth on feature phones without smartphones
- Additional language packs: Amharic, Yoruba, Hausa, Zulu

### Medium-Term
- Multi-country service data partnerships with Ministry of Health networks and NGO directories
- Peer-support moderated forum with anonymised group Q&A
- Service provider portal for self-updating listings and availability
- Analytics data export (CSV / PDF) for advocacy and donor reporting
- Formal security audit and penetration testing by an independent firm
- Integration with DHIS2 national health information systems

### Long-Term
- SDK for third-party NGOs to embed the AI assistant and service locator
- Predictive service gap identification using ML on reporting patterns
- Gamified health literacy modules for youth engagement
- Telemedicine integration with partner clinics for remote consultations
- Cross-platform mobile apps (React Native) for iOS and Android

---

## Appendix A — Report Type Definitions

| Code | Label | Description |
|---|---|---|
| `access_denied` | Denied Access to Services | Refused care, turned away, age discrimination |
| `gbv` | Gender-Based Violence | Physical, sexual, emotional, or economic violence |
| `discrimination` | Discrimination by Provider | Stigma, prejudice, or unprofessional conduct |
| `rights_violation` | Rights Violation / Forced Procedure | Non-consensual medical procedures |
| `confidentiality` | Confidentiality Breach | Unauthorised disclosure of health information |
| `other` | Other Concern | Any other SRHR-related concern |

## Appendix B — Case Step Pathway

All reports follow a standard 6-step resolution pathway:

| Step | Title | Description |
|---|---|---|
| 1 | Report received | Report safely received and encrypted |
| 2 | Advocate assigned | Trained advocate assigned to case |
| 3 | Case assessment | Situation reviewed to determine best support |
| 4 | Referral to service | Connected to appropriate support service |
| 5 | Follow-up support | Advocate checks progress with the reporter |
| 6 | Case resolved | Case closed with reporter's consent |

## Appendix C — Service Categories

| Code | Label | Examples |
|---|---|---|
| `clinic` | Health Clinic | Youth clinics, SRH outreach centres |
| `hiv` | HIV Testing | VCT centres, ART clinics |
| `gbv` | GBV Support | Recovery centres, safe houses |
| `counselling` | Counselling | Psychological support, peer counselling |
| `mental` | Mental Health | Psychiatry, crisis lines |
| `family` | Family Planning | Contraception, antenatal care |
| `legal` | Legal Aid | Human rights lawyers, KNCHR offices |
| `pharmacy` | Pharmacy | Emergency contraception, ARV dispensing |

---

*Built with ❤️ for young people · Privacy by design · Rights at the centre*

*YoungRoots AYSRHR Platform · Version 1.0 · May 2026 · Internal / Confidential*
