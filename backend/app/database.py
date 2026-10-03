from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings
import logging

logger = logging.getLogger(__name__)

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine_kwargs = {"echo": False}
if not settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
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
            if "telegram_chat_id" not in columns:
                logger.info("Migrating users table: adding telegram_chat_id column")
                conn.execute(text("ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR(100) NULL"))
            if "whatsapp_phone" not in columns:
                logger.info("Migrating users table: adding whatsapp_phone column")
                conn.execute(text("ALTER TABLE users ADD COLUMN whatsapp_phone VARCHAR(50) NULL"))
            if "notification_channel" not in columns:
                logger.info("Migrating users table: adding notification_channel column")
                conn.execute(text("ALTER TABLE users ADD COLUMN notification_channel VARCHAR(50) DEFAULT 'SIMULATED' NULL"))

        # Check leads table
        if "leads" in table_names:
            columns = [c["name"] for c in inspector.get_columns("leads")]
            if "customer_id" not in columns:
                logger.info("Migrating leads table: adding customer_id column")
                try:
                    conn.execute(text("ALTER TABLE leads ADD COLUMN customer_id INT NULL"))
                except Exception as e:
                    logger.warning(f"Column addition note: {e}")
            
            # Feature 1 & 2 & 3 columns
            new_lead_cols = [
                ("budget", "VARCHAR(100) NULL"),
                ("timeline", "VARCHAR(100) NULL"),
                ("requirements", "TEXT NULL"),
                ("audio_url", "VARCHAR(500) NULL"),
                ("transcription", "TEXT NULL"),
                ("matched_portfolio_id", "INT NULL"),
                ("approval_channel", "VARCHAR(50) NULL"),
                ("last_notification_sent_at", "DATETIME NULL")
            ]
            for col_name, col_type in new_lead_cols:
                if col_name not in columns:
                    logger.info(f"Migrating leads table: adding {col_name} column")
                    try:
                        conn.execute(text(f"ALTER TABLE leads ADD COLUMN {col_name} {col_type}"))
                    except Exception as e:
                        logger.warning(f"Column addition note for {col_name}: {e}")

        # Check and seed portfolio_items table if present
        if "portfolio_items" in table_names:
            result = conn.execute(text("SELECT COUNT(*) FROM portfolio_items")).scalar()
            if result == 0:
                logger.info("Seeding default portfolio items")
                seed_items = [
                    (
                        "Minimalist Beach Wedding Showcase",
                        "High-end beach wedding photography captured with natural lighting and minimalist aesthetics.",
                        "Wedding & Event Photography",
                        "beach, minimalist, wedding, photography, sunset, ceremony, coastal, bride, groom",
                        "https://portfolio.example.com/beach-wedding-case-study",
                        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
                    ),
                    (
                        "Luxury Coastal Resort & Villa Branding",
                        "Full visual identity and web presence for an exclusive oceanfront boutique hotel.",
                        "Branding & Web Design",
                        "resort, beach, luxury, branding, hospitality, modern, web design",
                        "https://portfolio.example.com/coastal-resort-branding",
                        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
                    ),
                    (
                        "Clean Minimalist E-Commerce Platform",
                        "High-converting headless Shopify and React storefront built for rapid scaling.",
                        "Web & App Development",
                        "ecommerce, shopify, minimalist, web development, react, store, online shop",
                        "https://portfolio.example.com/minimalist-ecommerce-store",
                        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
                    ),
                    (
                        "Modern SaaS Analytics & CRM Dashboard",
                        "Fullstack cloud customer management and real-time conversion monitoring interface.",
                        "SaaS & Product Design",
                        "saas, dashboard, software, analytics, crm, fullstack, modern, platform",
                        "https://portfolio.example.com/saas-analytics-suite",
                        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
                    ),
                    (
                        "Cinematic Video & Drone Production",
                        "4K drone cinematography and post-production for destination weddings and luxury estates.",
                        "Cinematography & Video",
                        "video, drone, wedding, cinematic, aerial, footage, film, destination",
                        "https://portfolio.example.com/cinematic-drone-reel",
                        "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80"
                    )
                ]
                for title, desc, cat, tags, url, thumb in seed_items:
                    conn.execute(
                        text("""
                            INSERT INTO portfolio_items (title, description, category, tags, asset_url, thumbnail_url, is_active, created_at, updated_at)
                            VALUES (:title, :description, :category, :tags, :asset_url, :thumbnail_url, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        """),
                        {"title": title, "description": desc, "category": cat, "tags": tags, "asset_url": url, "thumbnail_url": thumb}
                    )

