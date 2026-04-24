# TrustPay Loans CRM — Full Setup Guide

## 📁 Project Structure
```
trustpay-crm/
├── backend/               ← FastAPI (Python)
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   ├── .env               ← YOUR CONFIG HERE
│   ├── models/
│   │   └── models.py
│   ├── schemas/
│   │   └── schemas.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── partners.py
│   │   ├── targets.py
│   │   ├── chat.py
│   │   └── dashboard.py
│   ├── services/
│   │   ├── email_service.py
│   │   └── ai_service.py
│   └── utils/
│       └── auth.py
└── frontend/              ← React
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx
        ├── index.js
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   └── api.js
        ├── components/
        │   └── Layout.jsx
        └── pages/
            ├── Login.jsx
            ├── AIChat.jsx
            ├── admin/
            │   ├── AdminDashboard.jsx
            │   ├── AdminPartners.jsx
            │   └── AdminTargets.jsx
            └── partner/
                ├── PartnerDashboard.jsx
                ├── PartnerTargets.jsx
                └── PartnerProfile.jsx
```

---

## ✅ STEP 1 — Prerequisites

Install these before starting:

| Tool        | Version  | Download |
|-------------|----------|----------|
| Python      | 3.10+    | python.org |
| Node.js     | 18+      | nodejs.org |
| PostgreSQL  | 14+      | postgresql.org |
| Git         | any      | git-scm.com |

---

## ✅ STEP 2 — Database Setup (PostgreSQL)

```sql
-- Open psql or pgAdmin and run:
CREATE DATABASE trustpay_crm;
CREATE USER trustpay_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE trustpay_crm TO trustpay_user;
```

Or use the default postgres user and just create the database:
```bash
psql -U postgres -c "CREATE DATABASE trustpay_crm;"
```

---

## ✅ STEP 3 — Backend Setup

### Do you need a virtual environment?
**YES — highly recommended.** Here's how:

```bash
cd trustpay-crm/backend

# Create virtual environment
python -m venv venv

# Activate it:
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Your terminal should now show (venv) prefix
```

### Install Python packages:
```bash
pip install -r requirements.txt
```

### Configure your .env file:
Edit `backend/.env` and fill in YOUR values:

```env
# ── DATABASE ──────────────────────────────────
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/trustpay_crm

# ── JWT SECRET (change this!) ─────────────────
SECRET_KEY=your-super-secret-key-min-32-characters-long

# ── EMAIL (Gmail) ─────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM=TrustPay Loans <youremail@gmail.com>

# ── AI (choose one) ───────────────────────────
AI_PROVIDER=gemini              # or "openai"
GEMINI_API_KEY=your-gemini-key  # get from aistudio.google.com
OPENAI_API_KEY=sk-your-key      # get from platform.openai.com

# ── OTHER ─────────────────────────────────────
FRONTEND_URL=http://localhost:3000
UPLOAD_DIR=uploads
```

### How to get Gmail App Password:
1. Go to myaccount.google.com → Security
2. Enable 2-Factor Authentication
3. Go to "App passwords" → Generate one for "Mail"
4. Use that 16-character password in SMTP_PASSWORD

### How to get Gemini API Key (FREE):
1. Go to https://aistudio.google.com
2. Click "Get API Key" → Create API Key
3. Copy and paste into GEMINI_API_KEY

### Start the backend:
```bash
# Make sure you're in the backend/ folder with venv activated
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Create the first Admin account:
```bash
curl -X POST http://localhost:8000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@trustpay.com","password":"Admin@123","role":"admin"}'
```

Or open http://localhost:8000/docs and use the Swagger UI.

---

## ✅ STEP 4 — Frontend Setup

```bash
# Open a NEW terminal
cd trustpay-crm/frontend

# Install Node packages
npm install

# Start the React app
npm start
```

Frontend will open at: **http://localhost:3000**

---

## ✅ STEP 5 — First Login

1. Go to http://localhost:3000
2. Login with: `admin@trustpay.com` / `Admin@123`
3. You're now in the Admin dashboard!

---

## 🔧 All npm/pip Packages Summary

### Backend (pip):
```
fastapi              — Web framework
uvicorn              — ASGI server
sqlalchemy           — ORM / database
alembic              — DB migrations
psycopg2-binary      — PostgreSQL driver
python-jose          — JWT tokens
passlib[bcrypt]      — Password hashing
python-multipart     — File uploads
pydantic[email]      — Data validation
pydantic-settings    — Config from .env
httpx                — HTTP client
aiofiles             — Async file ops
Pillow               — Image handling
openai               — OpenAI GPT API
google-generativeai  — Gemini AI API
aiosmtplib           — Async email sending
jinja2               — Email templates
email-validator      — Email validation
python-dotenv        — .env file loading
```

### Frontend (npm):
```
react                — UI framework
react-dom            — DOM rendering
react-router-dom     — Client-side routing
axios                — HTTP requests
recharts             — Charts/graphs
react-hot-toast      — Toast notifications
lucide-react         — Icons
date-fns             — Date formatting
```

---

## 🚀 Features Summary

| Feature | Details |
|---------|---------|
| Admin Login | JWT-based secure auth |
| Add Partner | Full KYC form + auto onboarding email |
| View Partners | Table with search, full detail view |
| Edit Partner | Update all fields |
| Delete Partner | Removes user + partner records |
| Assign Target | With reward, date, image upload |
| Update Progress | Auto sends email to partner |
| Target Completed | Auto sends reward email with image |
| Partner Login | View own targets and profile |
| AI Chat (Admin) | Context of all partners, analytics |
| AI Chat (Partner) | Context of own data, finance help |
| Email Automation | Onboarding, progress, reward emails |
| File Upload | Reward images (e.g. Phuket trip poster) |
| Dashboard Charts | Bar chart, pie chart, performance table |

---

## 🌐 API Endpoints Reference

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/login | Public |
| POST | /api/auth/create-admin | Public (first time) |
| GET | /api/auth/me | Any auth |
| GET | /api/partners/ | Admin |
| POST | /api/partners/ | Admin |
| PUT | /api/partners/{id} | Admin |
| DELETE | /api/partners/{id} | Admin |
| GET | /api/partners/me/profile | Partner |
| GET | /api/targets/ | Admin |
| POST | /api/targets/ | Admin |
| POST | /api/targets/with-image | Admin |
| PUT | /api/targets/{id} | Admin |
| DELETE | /api/targets/{id} | Admin |
| GET | /api/targets/me | Partner |
| POST | /api/chat/ | Any auth |
| GET | /api/chat/history | Any auth |
| GET | /api/dashboard/admin-stats | Admin |
| GET | /api/dashboard/partner-stats | Partner |

Full interactive docs at: http://localhost:8000/docs

---

## 🐛 Troubleshooting

**"psycopg2 install fails"**
```bash
pip install psycopg2-binary  # use binary version, not psycopg2
```

**"Module not found" errors**
```bash
# Make sure venv is activated:
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

**"CORS error" in browser**
- Make sure backend is running on port 8000
- Make sure frontend proxy is set in package.json ("proxy": "http://localhost:8000")

**Emails not sending**
- Check SMTP credentials in .env
- Gmail: must use App Password, not your real Gmail password
- Test with: `python -c "import aiosmtplib; print('OK')"`

**AI not responding**
- Check GEMINI_API_KEY or OPENAI_API_KEY is set correctly
- The system will fall back to basic replies if AI key is missing

---

## 🔒 Production Checklist

- [ ] Change SECRET_KEY to a random 64-character string
- [ ] Set strong database password
- [ ] Remove /api/auth/create-admin route (or add protection)
- [ ] Use HTTPS
- [ ] Set FRONTEND_URL to your actual domain
- [ ] Use environment variables, not .env file
- [ ] Run with: `uvicorn main:app --workers 4`
