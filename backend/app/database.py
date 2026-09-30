from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings
import logging

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_safe_migrations(target_engine=None):
    """Safely apply schema migrations to ensure new columns and constraints exist without data loss."""
    eng = target_engine or engine
    inspector = inspect(eng)
    table_names = inspector.get_table_names()

    with eng.begin() as conn:
        # Check users table
        if "users" in table_names:
            columns = [c["name"] for c in inspector.get_columns("users")]
            if "role" not in columns:
                logger.info("Migrating users table: adding role column")
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'BUSINESS_OWNER'"))
            if "phone" not in columns:
                logger.info("Migrating users table: adding phone column")
                conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL"))

        # Check leads table
        if "leads" in table_names:
            columns = [c["name"] for c in inspector.get_columns("leads")]
            if "customer_id" not in columns:
                logger.info("Migrating leads table: adding customer_id column")
                try:
                    conn.execute(text("ALTER TABLE leads ADD COLUMN customer_id INT NULL"))
                except Exception as e:
                    logger.warning(f"Column addition note: {e}")
