from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.models.lead import LeadStatus, LeadSource, LeadPriority, ResponseStatus

class LeadBase(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    phone: Optional[str] = None
    message: str = Field(..., min_length=1)
    source: Optional[str] = LeadSource.MANUAL.value

class LeadCreate(LeadBase):
    priority: Optional[str] = LeadPriority.MEDIUM.value
    category: Optional[str] = None
    follow_up_at: Optional[datetime] = None
    customer_id: Optional[int] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    requirements: Optional[str] = None
    audio_url: Optional[str] = None
    transcription: Optional[str] = None
    matched_portfolio_id: Optional[int] = None

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    message: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    intent: Optional[str] = None
    ai_summary: Optional[str] = None
    suggested_response: Optional[str] = None
    response_status: Optional[str] = None
    follow_up_at: Optional[datetime] = None
    customer_id: Optional[int] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    requirements: Optional[str] = None
    audio_url: Optional[str] = None
    transcription: Optional[str] = None
    matched_portfolio_id: Optional[int] = None
    approval_channel: Optional[str] = None
    last_notification_sent_at: Optional[datetime] = None

class LeadResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    message: str
    source: str
    status: str
    priority: str
    category: Optional[str] = None
    intent: Optional[str] = None
    ai_summary: Optional[str] = None
    suggested_response: Optional[str] = None
    response_status: Optional[str] = None
    follow_up_at: Optional[datetime] = None
    user_id: Optional[int] = None
    customer_id: Optional[int] = None
    
    # Advanced feature fields
    budget: Optional[str] = None
    timeline: Optional[str] = None
    requirements: Optional[str] = None
    audio_url: Optional[str] = None
    transcription: Optional[str] = None
    matched_portfolio_id: Optional[int] = None
    matched_portfolio_title: Optional[str] = None
    matched_portfolio_url: Optional[str] = None
    approval_channel: Optional[str] = None
    last_notification_sent_at: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CustomerEnquiryCreate(BaseModel):
    message: str = Field(..., min_length=3, description="Customer inquiry or service request message")
    owner_id: Optional[int] = Field(default=None, description="Optional target business owner ID")
    budget: Optional[str] = Field(default=None, description="Estimated budget")
    timeline: Optional[str] = Field(default=None, description="Desired timeline or date")
    service_interest: Optional[str] = Field(default=None, description="Service category")

class CustomerEnquiryResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    message: str
    source: str
    status: str
    approved_response: Optional[str] = None
    response_status: Optional[str] = None
    business_owner_name: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    requirements: Optional[str] = None
    audio_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LeadAnalysisResponse(BaseModel):
    lead_id: int
    category: str
    priority: str
    intent: str
    ai_summary: str
    ai_provider: str
    budget: Optional[str] = None
    timeline: Optional[str] = None
    requirements: Optional[str] = None

class LeadGenerateResponseRequest(BaseModel):
    tone: Optional[str] = Field(default="professional", description="Tone: professional, friendly, direct, consultative")
    response_type: Optional[str] = Field(default="initial", description="Type: initial, follow_up")
    additional_instructions: Optional[str] = None
    include_portfolio_match: Optional[bool] = Field(default=True, description="Whether to auto-match portfolio assets")

class LeadGenerateResponseResponse(BaseModel):
    lead_id: int
    suggested_response: str
    response_status: str
    response_type: Optional[str] = "initial"
    ai_provider: str
    matched_portfolio_title: Optional[str] = None
    matched_portfolio_url: Optional[str] = None

class VoiceNoteUploadResponse(BaseModel):
    lead_id: int
    name: str
    email: str
    transcription: str
    extracted_constraints: dict
    suggested_response: str
    matched_portfolio_title: Optional[str] = None
    matched_portfolio_url: Optional[str] = None
    notification_dispatched: bool
    notification_detail: Optional[str] = None
    ai_provider: str

class WebhookLeadPayload(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    source: Optional[str] = LeadSource.WEBSITE.value
    follow_up_at: Optional[datetime] = None
    user_id: Optional[int] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    requirements: Optional[str] = None


