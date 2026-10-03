import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app as fastapi_app
from app.database import Base, get_db
from app.models.portfolio import PortfolioItem
from app.models.user import User
from app.models.lead import Lead

# Global isolated test SQLite engine
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

fastapi_app.dependency_overrides[get_db] = override_get_db
client = TestClient(fastapi_app)


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    # Seed default portfolio item for matchmaker tests
    db = TestingSessionLocal()
    beach_wedding = PortfolioItem(
        title="Minimalist Beach Wedding Showcase",
        description="Natural lighting beach wedding ceremony and reception photo series.",
        category="Wedding & Event Photography",
        tags="beach, minimalist, wedding, photography, sunset, ceremony",
        asset_url="https://portfolio.example.com/beach-wedding-case-study",
        is_active=True
    )
    db.add(beach_wedding)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
