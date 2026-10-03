import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, Response
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from app.database import get_db
from app.config import settings
from app.schemas.approval import InboundApprovalAction, ZeroUIApprovalResult
from app.services import approver_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Zero-UI Webhooks"])

@router.post("/lead", status_code=status.HTTP_403_FORBIDDEN)
async def webhook_lead():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Webhook endpoint is disabled for this version. Customers submit enquiries directly through the application's Customer Portal API."
    )


@router.get("/whatsapp")
def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token")
):
    """
    Meta WhatsApp Cloud API Webhook Verification Endpoint.
    """
    if hub_mode == "subscribe" and hub_verify_token == settings.WEBHOOK_VERIFY_TOKEN:
        return Response(content=hub_challenge or "", media_type="text/plain")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification token mismatch")

@router.post("/whatsapp")
async def inbound_whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handles inbound WhatsApp webhook messages.
    Supports thumbs-up 👍 emoji or text edits for zero-UI approval.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    action_text = ""
    sender = None

    # Parse standard Meta WhatsApp payload format
    try:
        entry = body.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        val = changes.get("value", {})
        messages = val.get("messages", [])
        if messages:
            msg = messages[0]
            sender = msg.get("from")
            if msg.get("type") == "text":
                action_text = msg.get("text", {}).get("body", "")
            elif msg.get("type") == "button":
                action_text = msg.get("button", {}).get("text", "")
            elif msg.get("type") == "reaction":
                action_text = msg.get("reaction", {}).get("emoji", "")
    except Exception as e:
        logger.warning(f"Error extracting WhatsApp payload: {e}")

    # Fallback for simplified webhook testers
    if not action_text:
        action_text = body.get("text") or body.get("body") or body.get("message") or ""
        sender = sender or body.get("from") or body.get("sender")

    if not action_text:
        return {"status": "ignored", "detail": "No actionable message body found"}

    result = approver_service.handle_inbound_approval(db=db, action_text=action_text, sender=sender)
    return {
        "status": "processed",
        "action": result.action_taken,
        "lead_id": result.lead_id,
        "reply": result.reply_to_owner,
        "response_status": result.response_status
    }

@router.post("/telegram")
async def inbound_telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handles inbound Telegram Bot updates.
    Supports thumbs-up 👍 emoji or text edits from the business owner.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    action_text = ""
    chat_id = None

    if "message" in body:
        msg = body["message"]
        action_text = msg.get("text", "")
        chat_id = str(msg.get("chat", {}).get("id", ""))
    elif "text" in body:
        action_text = body.get("text", "")
        chat_id = str(body.get("chat_id", ""))

    if not action_text:
        return {"status": "ignored", "detail": "No message text found"}

    result = approver_service.handle_inbound_approval(db=db, action_text=action_text, sender=chat_id)
    return {
        "status": "processed",
        "action": result.action_taken,
        "lead_id": result.lead_id,
        "reply": result.reply_to_owner,
        "response_status": result.response_status
    }

@router.post("/approval-action", response_model=ZeroUIApprovalResult)
def manual_approval_action(
    payload: InboundApprovalAction,
    db: Session = Depends(get_db)
):
    """
    Zero-UI Inbound Approval Simulator & Direct API Hook.
    Enables testing thumbs-up 👍 approvals or text edits directly from the UI or API.
    """
    return approver_service.handle_inbound_approval(
        db=db,
        action_text=payload.action_text,
        lead_id=payload.lead_id,
        sender=payload.sender
    )
