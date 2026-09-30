from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine, Base, run_safe_migrations
import app.models # Register all models
from app.routers import auth, leads, webhooks, analytics, customer

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MySQL database tables
    Base.metadata.create_all(bind=engine)
    # Run safe schema migrations
    try:
        run_safe_migrations(engine)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Migration check note: {e}")
    yield

app = FastAPI(
    title="AI Customer Management API",
    description="Production AI Customer Management and Enquiry Intelligence Platform with role-based access for Business Owners and Customers.",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(customer.router)
app.include_router(leads.router)
app.include_router(webhooks.router)
app.include_router(analytics.router)


@app.get("/", tags=["System"])
def root():
    return {
        "name": "AI Lead Automation API",
        "status": "running",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/health", tags=["System"])
def health_check():
    ai_status = "gemini" if (settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 10) else "local_fallback"
    return {
        "status": "healthy",
        "database": "connected (MySQL 8)",
        "ai_provider": ai_status
    }
