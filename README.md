# AI Lead Automation — SaaS Platform

A production-ready SaaS web application designed for small businesses, agencies, creators, coaches, and local service providers. Captures customer enquiries, securely persists them in MySQL, qualifies and nanalyzes them using AI (intent, category, priority, executive summary), generates suggested responses with owner review/approval workflows, integrates external webhooks, and tracks real-time business conversion analytics.

---

## 🌟 Key Features

1. **Secure Authentication & Scoping**
   - User registration and login with **bcrypt** password hashing.
   - **JWT Bearer Token** authentication with protected API routes.
   - Strict data scoping: authenticated users manage their own lead records.

2. **Lead Management (CRUD)**
   - Complete pipeline to capture, view, update, filter, search, and delete leads.
   - Statuses: NEW, CONTACTED, QUALIFIED, CONVERTED, LOST.
   - Sources: WEBSITE, INSTAGRAM, WHATSAPP, MANUAL, OTHER.
   - Priorities: LOW, MEDIUM, HIGH, URGENT.

3. **AI Lead Qualification & Analysis**
   - Automatically detects service category, purchasing intent, urgency/priority, and synthesizes a concise executive summary.
   - Powered by Google Gemini LLM with an intelligent local heuristic NLP fallback.
   - Live AI status indicator (AI Provider: Gemini or AI Provider: Local Analysis).

4. **AI Suggested Response Studio**
   - Drafts high-converting, personalized customer replies based on message context and business tone (Professional, Friendly, Direct, Consultative).
   - **Human-in-the-loop**: owner reviews, edits, and approves drafts before sending.
   - Response statuses: DRAFT, EDITED, APPROVED.
   - 1-click clipboard copy with instant feedback.

5. **Inbound Webhook API (POST /webhooks/lead)**
   - Ingest leads seamlessly from external landing pages, Webflow, Typeform, Elementor, Zapier, or Make.
   - Built-in interactive Webhook simulator in the UI to test external lead capture in real time.

6. **Real-time MySQL Analytics (GET /analytics)**
   - Direct SQL calculations without hardcoded numbers or fake stats.
   - Top KPI cards: Total Leads, New Enquiries, Qualified Leads, Converted Leads, Lost Leads.
   - Qualification rate (%) and Conversion win rate (%).
   - Priority, Status, and Source distribution meters.
   - 7-Day lead volume trend chart.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **HTTP Client**: Axios (with JWT interceptors)
- **Icons**: Lucide React

### Backend
- **Framework**: Python 3.11+ + FastAPI
- **ORM**: SQLAlchemy 2.0
- **Database Driver**: PyMySQL (mysql+pymysql)
- **Validation**: Pydantic v2 + Pydantic Settings + Email Validator
- **Security**: Bcrypt + PyJWT
- **HTTP/LLM Client**: HTTPX

### Database
- **Engine**: MySQL 8.0
- **Database Name**: i_lead_automation

---

## 📁 Project Structure

`
AI-Lead-Automation/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI entry point, CORS, lifespan
│   │   ├── config.py                  # Pydantic Settings & environment loader
│   │   ├── database.py                # SQLAlchemy engine & session maker
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                # User SQL model
│   │   │   └── lead.py                # Lead SQL model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # Auth Pydantic schemas
│   │   │   ├── lead.py                # Lead Pydantic schemas
│   │   │   └── analytics.py           # Analytics Pydantic schemas
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py        # Bcrypt & JWT token logic
│   │   │   ├── ai_service.py          # Gemini AI & local fallback service
│   │   │   ├── lead_service.py        # Lead database CRUD operations
│   │   │   └── analytics_service.py   # Real MySQL metric aggregations
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── auth.py                # /auth routes
│   │       ├── leads.py               # /leads routes & AI endpoints
│   │       ├── webhooks.py            # /webhooks routes
│   │       └── analytics.py           # /analytics routes
│   ├── .env.example
│   ├── .env                           # Local environment config (git-ignored)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.js              # Axios instance with auth interceptor
│   │   ├── context/AuthContext.jsx    # React Auth context & session provider
│   │   ├── components/
│   │   │   ├── layout/                # Layout, Sidebar, Topbar
│   │   │   └── common/                # Badges, Modals, StatsCards
│   │   ├── pages/                     # Dashboard, Leads, LeadDetail, Analytics, Webhooks, Login, Register
│   │   ├── App.jsx                    # Routing & ProtectedRoute wrappers
│   │   ├── main.jsx                   # React root mount
│   │   └── index.css                  # Tailwind styles
│   ├── package.json
│   └── vite.config.js
├── README.md
└── .gitignore
`

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: 18 or higher (with npm)
- **MySQL**: 8.0 running on localhost:3306

---

### 2. MySQL Database Setup

1. Open your MySQL client (e.g. MySQL Workbench or terminal):
   `sql
   CREATE DATABASE IF NOT EXISTS ai_lead_automation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   `

---

### 3. Backend Setup

1. Navigate to the ackend directory:
   `ash
   cd backend
   `

2. Activate virtual environment (or create one):
   `ash
   # Windows PowerShell
   .\venv\Scripts\Activate.ps1

   # Linux/macOS
   source venv/bin/activate
   `

3. Install dependencies:
   `ash
   pip install -r requirements.txt
   `

4. Configure environment variables in ackend/.env:
   `env
   # Database Configuration (MySQL 8)
   DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/ai_lead_automation

   # JWT Authentication
   JWT_SECRET=your_super_secure_jwt_secret_key
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # AI Configuration (Optional: Leave blank for local fallback mode)
   GEMINI_API_KEY=your_gemini_api_key_here

   # App Environment
   ENVIRONMENT=development
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   `
   *(Note: If your MySQL password contains special characters like @, URL-encode them, e.g. Shru@05 becomes Shru%4005)*.

5. Start the FastAPI server:
   `ash
   uvicorn app.main:app --reload --port 8000
   `
   - API will be accessible at: http://localhost:8000
   - Interactive Swagger API Docs: http://localhost:8000/docs

---

### 4. Frontend Setup

1. Open a new terminal and navigate to the rontend directory:
   `ash
   cd frontend
   `

2. Install dependencies:
   `ash
   npm install
   `

3. Start the Vite development server:
   `ash
   npm run dev
   `
   - Frontend application will be live at: http://localhost:5173

---

## 📡 API Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /auth/register | Register a new business account | No |
| POST | /auth/login | Log in and receive JWT token | No |
| GET | /auth/me | Fetch authenticated user profile | Yes (Bearer) |
| GET | /leads | List leads (with search, filter & pagination) | Yes (Bearer) |
| POST | /leads | Create a new lead manually | Yes (Bearer) |
| GET | /leads/{id} | Get lead details by ID | Yes (Bearer) |
| PUT | /leads/{id} | Update lead fields or status | Yes (Bearer) |
| DELETE | /leads/{id} | Delete lead record from database | Yes (Bearer) |
| POST | /leads/{id}/analyze | Trigger AI lead categorization & summary | Yes (Bearer) |
| POST | /leads/{id}/generate-response | Generate AI suggested response draft | Yes (Bearer) |
| GET | /analytics | Real-time database metrics & KPIs | Yes (Bearer) |
| POST | /webhooks/lead | Public webhook for external forms | No |

---

## 🔄 AI Lead Automation Workflow

`
1. Customer Enquiry (Website / Instagram / WhatsApp / Form)
         ↓
2. Captured via API or Inbound Webhook (POST /webhooks/lead)
         ↓
3. Persisted in MySQL (ai_lead_automation database)
         ↓
4. AI Lead Qualification (POST /leads/{id}/analyze)
   • Service Category (e.g. Web Development)
   • Urgency / Priority (e.g. URGENT / HIGH)
   • Buyer Intent (e.g. Ready to Buy)
   • Executive Summary
         ↓
5. AI Response Generation (POST /leads/{id}/generate-response)
   • Personalized Draft based on Tone & Custom Guidance
         ↓
6. Owner Review & Approval
   • Edit, Approve, and Copy suggested reply
         ↓
7. Pipeline Status Updated (Contacted → Qualified → Converted)
         ↓
8. Real-time Analytics Updated (GET /analytics)
`

---

## 🔒 Security Practices

- **Zero Hardcoded Secrets**: Credentials, database passwords, and API keys are stored exclusively in .env, which is ignored by git.
- **Password Hashing**: Passwords are encrypted with crypt with automatic salting.
- **JWT Authorization**: Stateless Bearer tokens with expiration and validation guards.
- **SQL Injection Defense**: All queries utilize SQLAlchemy ORM parameterized statements.
- **CORS Restricted**: Backend CORS middleware only allows specified frontend origins.
