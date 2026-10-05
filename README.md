# AI-BASED CUSTOMER MANAGEMENT SYSTEM

A full-stack mini-CRM built for small business, freelancers, and local service providers. It captures customer inquires from anywhere, uses AI to analyze intent and draft replies, keeps the business owner in full control via a human-in-the-loop approval workflow, and tracks conversions in real-time.

# Key Features
1. **Smart Customer Capture**: Ingests customers manually or via public webhooks.
2. **AI Qualification**: Automatically parses messages to extract category, buyer intent, urgency, and an executive summary (uses Gemini).
3. **Response Studio**: Drafts personalized replies based on the customer's context. The owner reviews, edits, and approves them before anything goes out - no automated spam.
4. **Pipeline & Analytics**: Tracks customers through a visual pipeline (NEW -> CONTACTED -> QUALIFIED -> CONVERTED/LOST) with live MySQL analytics dashboards.

# Tech Stack
**Backend**: Python, FastAPI, SQLAlchemy, PyMySQL, Pydantic, PyJWT, Bcrypt
**Frontend**: React, Vite, Tailwind CSS, React Router, Axios, Lucide React
**Database**: MySQL 8.0

# Security & Architecture Notes
**Passwords**: Securely hashed using Bcrypt.
**Auth**: Stateless JWT Bearer tokens protect private endpoints.
**SQL Injection Safety**: Handled entirely via SQLAlchemy ORM parameterized statements.
**Human-in-the-Loop**: The system never sends messages automatically; human approval is always required.
