# 🌱 YoungRoots — AYSRHR Platform

A safe, private, AI-powered platform empowering young people to access sexual and reproductive health services, information, and rights-based support.

---

## 📁 Project Structure

```
youngroots/
├── backend/                        # Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example                ← Copy to .env and fill in values
│   ├── youngroots/
│   │   ├── settings.py             # Full Django settings
│   │   ├── urls.py                 # Root URL configuration
│   │   ├── middleware.py           # Anonymous session + privacy middleware
│   │   ├── pagination.py           # Standard pagination
│   │   ├── celery.py               # Celery + Beat scheduler
│   │   └── wsgi.py
│   └── apps/
│       ├── accounts/               # Auth, users, roles, anonymous sessions
│       │   ├── models.py           #   User model + AnonymousToken
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── permissions.py      #   IsAdminUser, IsAdvocateOrAdmin, IsOwnerOrAdmin
│       │   ├── authentication.py   #   Anonymous token auth backend
│       │   └── admin.py
│       ├── locator/                # Service Locator (GeoDjango)
│       │   ├── models.py           #   Service, ServiceReview, Country
│       │   ├── views.py            #   ServiceViewSet with geospatial search
│       │   ├── urls.py
│       │   ├── admin.py
│       │   └── management/
│       │       └── commands/
│       │           └── seed_data.py  # Demo data seeder
│       ├── ai_assistant/           # AI Chat (Claude/Anthropic)
│       │   ├── models.py           #   ConversationSession, AIMessage + all views
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── admin.py
│       ├── reports/                # Anonymous Reporting
│       │   ├── models.py           #   Report, ReportNote (encrypted fields)
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── tasks.py            #   Celery: crisis alerts, auto-assign, data purge
│       │   └── admin.py
│       ├── referrals/              # Case Tracking & Referrals
│       │   ├── models.py           #   Referral, CaseStep + all views
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── admin.py
│       └── dashboard/              # Advocacy Dashboard
│           ├── analytics.py        #   All metrics computation + views
│           ├── views.py
│           ├── urls.py
│           └── admin.py
│
└── frontend/                       # React + Vite SPA
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── main.jsx                # Entry point
        ├── App.jsx                 # Router + lazy loading
        ├── index.css
        ├── pages/
        │   ├── Home.jsx            # Landing page with module grid
        │   ├── Login.jsx           # Login + anonymous session
        │   ├── ServiceLocator.jsx  # Service search + map + detail modal
        │   ├── AIAssistant.jsx     # Full AI chat with Yara
        │   ├── ReportForm.jsx      # Anonymous report submission
        │   ├── CaseTracker.jsx     # Case lookup + step progress
        │   ├── Dashboard.jsx       # Charts + KPI cards
        │   ├── AdminPanel.jsx      # Full admin with sidebar tabs
        │   └── NotFound.jsx
        ├── components/
        │   └── layout/
        │       └── Layout.jsx      # Navbar + language switcher + footer
        ├── context/
        │   └── authStore.js        # Zustand auth store (JWT + anonymous)
        ├── hooks/
        │   ├── useServices.js      # Service fetching with debounce
        │   └── useCase.js          # Case lookup and step management
        └── utils/
            ├── api.js              # Centralised Axios client + all API methods
            └── i18n.js             # i18next (EN, SW, FR, PT)
```

---

## 🚀 Quick Start

### Option A — Docker Compose (recommended)

```bash
# 1. Clone and enter project
git clone https://github.com/your-org/youngroots.git
cd youngroots

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env — add SECRET_KEY, DB_PASSWORD, ANTHROPIC_API_KEY

# 3. Start everything
docker compose up --build

# App: http://localhost:3000
# API: http://localhost:8000
# Docs: http://localhost:8000/api/docs/
```

### Option B — Local development

#### Backend

```bash
cd backend

# Create & activate virtualenv
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install deps
pip install -r requirements.txt

# Configure env
cp .env.example .env
# Fill in: SECRET_KEY, DB credentials, ANTHROPIC_API_KEY

# Set up PostgreSQL + PostGIS (required for geospatial)
createdb youngroots_db
psql youngroots_db -c "CREATE EXTENSION postgis;"

# Run migrations
python manage.py migrate

# Seed demo data
python manage.py seed_data

# Start dev server
python manage.py runserver
```

#### Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
```

#### Celery (background tasks)

```bash
cd backend
celery -A youngroots worker --loglevel=info    # Worker
celery -A youngroots beat --loglevel=info      # Scheduler
```

---

## 🔑 Demo Login Credentials

| Role        | Email                        | Password           |
|-------------|------------------------------|--------------------|
| Super Admin | admin@youngroots.demo        | AdminPass2024!     |
| Advocate    | advocate@youngroots.demo     | AdvocatePass2024!  |
| Youth User  | *(use anonymous session)*    | *(no account needed)* |

---

## 🔒 Privacy & Security Features

| Feature                            | Implementation                              |
|------------------------------------|---------------------------------------------|
| Anonymous sessions                 | UUID token, no IP logging                   |
| Report encryption                  | Field-level encryption (Fernet)             |
| AI chat privacy                    | Messages deleted after 24h (Celery task)    |
| No user tracking                   | AnonymousSessionMiddleware strips Server headers |
| Rate limiting                      | AI: 30/hr · Reports: 10/hr · Anon: 20/hr   |
| JWT auth                           | 2hr access + 7d refresh with rotation       |
| Audit trail                        | django-simple-history on Reports, Referrals |
| HTTPS enforcement                  | Strict HSTS in production                   |

---

## 📡 API Endpoints

| Method | Endpoint                        | Description                    | Auth         |
|--------|---------------------------------|--------------------------------|--------------|
| POST   | /api/v1/auth/anonymous/         | Start anonymous session        | None         |
| POST   | /api/v1/auth/login/             | JWT login                      | None         |
| GET    | /api/v1/services/               | List/search services           | None         |
| POST   | /api/v1/ai/chat/                | AI chat message                | None/Anon    |
| POST   | /api/v1/reports/submit/         | Submit anonymous report        | None         |
| GET    | /api/v1/reports/lookup/{id}/    | Look up case by ID             | None         |
| GET    | /api/v1/referrals/case/{id}/    | Full case detail + steps       | None         |
| GET    | /api/v1/dashboard/metrics/      | Aggregated analytics           | Advocate+    |
| GET    | /api/v1/dashboard/summary/      | Public summary stats           | None         |

Full interactive docs at `/api/docs/`

---

## 🌍 Localisation

Supported languages: **English · Swahili · French · Portuguese**
Language files: `frontend/src/utils/i18n.js`
Add a new language by adding an entry in the `resources` object.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/add-sms-alerts`
3. Commit: `git commit -m 'Add SMS alerts for crisis reports'`
4. Push: `git push origin feature/add-sms-alerts`
5. Open a Pull Request

---

Built with ❤️ for young people. Privacy by design. Rights at the centre.
