from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ApprovalRequestPayload(BaseModel):
    lead_id: int
    channel: Optional[str] = Field(default=None, description="TELEGRAM, WHATSAPP, or SIMULATED")

class InboundApprovalAction(BaseModel):
    lead_id: Optional[int] = Field(default=None, description="Target lead ID. If omitted, uses latest pending enquiry.")
    action_text: str = Field(..., description="Inbound text, e.g. '👍', 'APPROVE', or 'Edit: <custom text>'")
    sender: Optional[str] = Field(default=None, description="Sender phone number or Telegram chat ID")

class ZeroUIApprovalResult(BaseModel):
    success: bool
    lead_id: int
    lead_name: str
    action_taken: str # "APPROVED" | "EDITED_AND_APPROVED" | "UNKNOWN_COMMAND"
    response_status: str
    lead_status: str
    final_response: str
    reply_to_owner: str
    customer_notified: bool
    timestamp: datetime = Field(default_factory=datetime.now)

class NotificationDispatchResult(BaseModel):
    lead_id: int
    recipient: str
    channel: str
    status: str # "SENT" | "SIMULATED" | "FAILED"
    preview_message: str
