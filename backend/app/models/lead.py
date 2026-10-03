from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    CONVERTED = "CONVERTED"
    LOST = "LOST"

class LeadSource(str, enum.Enum):
    WEBSITE = "WEBSITE"
    INSTAGRAM = "INSTAGRAM"
    WHATSAPP = "WHATSAPP"
    MANUAL = "MANUAL"
    OTHER = "OTHER"

class LeadPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class ResponseStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    EDITED = "EDITED"
    APPROVED = "APPROVED"

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    message = Column(Text, nullable=False)
    source = Column(String(50), default=LeadSource.MANUAL.value, nullable=False)
    status = Column(String(50), default=LeadStatus.NEW.value, nullable=False, index=True)
    priority = Column(String(50), default=LeadPriority.MEDIUM.value, nullable=False, index=True)
    category = Column(String(100), nullable=True)
    intent = Column(String(100), nullable=True)
    ai_summary = Column(Text, nullable=True)
    suggested_response = Column(Text, nullable=True)
    response_status = Column(String(50), default=ResponseStatus.DRAFT.value, nullable=True)
    
    # Project Constraints & Voice Note Whisperer fields
    budget = Column(String(100), nullable=True)
    timeline = Column(String(100), nullable=True)
    requirements = Column(Text, nullable=True)
    audio_url = Column(String(500), nullable=True)
    transcription = Column(Text, nullable=True)

    # Portfolio Matchmaker field
    matched_portfolio_id = Column(Integer, ForeignKey("portfolio_items.id", ondelete="SET NULL"), nullable=True, index=True)

    # Zero-UI WhatsApp/Telegram Approver fields
    approval_channel = Column(String(50), nullable=True)
    last_notification_sent_at = Column(DateTime(timezone=True), nullable=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    follow_up_at = Column(DateTime(timezone=True), nullable=True, index=True)

    owner = relationship("User", foreign_keys=[user_id], back_populates="leads")
    customer = relationship("User", foreign_keys=[customer_id], back_populates="customer_enquiries")
    matched_portfolio = relationship("PortfolioItem", foreign_keys=[matched_portfolio_id])

