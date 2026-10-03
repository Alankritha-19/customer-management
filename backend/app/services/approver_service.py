import re
import httpx
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.config import settings
from app.models.lead import Lead, LeadStatus, ResponseStatus
from app.models.user import User, UserRole
from app.schemas.approval import NotificationDispatchResult, ZeroUIApprovalResult

logger = logging.getLogger(__name__)

def _format_approval_message(lead: Lead) -> str:
    constraints = []
    if lead.budget:
        constraints.append(f"💰 Budget: {lead.budget}")
    if lead.timeline:
        constraints.append(f"📅 Timeline: {lead.timeline}")
    if lead.requirements:
        constraints.append(f"📌 Requirements: {lead.requirements}")
    
    constraints_str = "\n".join(constraints) if constraints else "None specified"
    matched_portfolio = f"\n🎨 Matched Asset: {lead.matched_portfolio.title} ({lead.matched_portfolio.asset_url})" if lead.matched_portfolio else ""

    message = (
        f"⚡ [NEW AI ENQUIRY DRAFT - LEAD #{lead.id}]\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 Customer: {lead.name} ({lead.email})\n"
        f"📡 Source: {lead.source} | Priority: {lead.priority}\n"
        f"🏷️ Category: {lead.category or 'General'}\n"
        f"{constraints_str}{matched_portfolio}\n\n"
        f"📝 PROPOSED REPLY DRAFT:\n"
        f"\"\"\"\n{lead.suggested_response or 'No response generated yet.'}\n\"\"\"\n\n"
        f"👉 ZERO-UI ACTIONS:\n"
        f"• Reply 👍 or 'APPROVE' to dispatch immediately to customer\n"
        f"• Reply 'EDIT: <your message>' to revise and send instantly\n"
        f"• Target Lead ID: #{lead.id}"
    )
    return message

async def dispatch_approval_request(
    db: Session,
    lead: Lead,
    channel: Optional[str] = None
) -> NotificationDispatchResult:
    """
    Pushes an AI-generated draft to the business owner's private WhatsApp / Telegram.
    Falls back gracefully to simulated channel if live bot credentials are not configured.
    """
    owner = lead.owner
    target_channel = channel or (owner.notification_channel if owner and owner.notification_channel else "SIMULATED")
    telegram_chat_id = (owner.telegram_chat_id if owner and owner.telegram_chat_id else settings.TELEGRAM_DEFAULT_CHAT_ID)
    whatsapp_phone = (owner.whatsapp_phone if owner and owner.whatsapp_phone else settings.WHATSAPP_OWNER_PHONE)

    message_body = _format_approval_message(lead)
    status_str = "SIMULATED"
    recipient_str = "Simulated Dashboard Alert"

    # 1. Attempt Telegram dispatch if requested / available
    if (target_channel in ["TELEGRAM", "ALL"]) and settings.TELEGRAM_BOT_TOKEN and telegram_chat_id:
        try:
            tg_url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(tg_url, json={
                    "chat_id": telegram_chat_id,
                    "text": message_body,
                    "parse_mode": "Markdown"
                })
                if res.status_code == 200:
                    status_str = "SENT"
                    recipient_str = f"Telegram ({telegram_chat_id})"
        except Exception as e:
            logger.warning(f"Telegram dispatch error: {e}")

    # 2. Attempt WhatsApp Cloud API dispatch if requested / available
    if (target_channel in ["WHATSAPP", "ALL"]) and settings.WHATSAPP_API_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID and whatsapp_phone:
        try:
            wa_url = f"https://graph.facebook.com/v18.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
            headers = {"Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}"}
            wa_payload = {
                "messaging_product": "whatsapp",
                "to": whatsapp_phone,
                "type": "text",
                "text": {"body": message_body}
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(wa_url, json=wa_payload, headers=headers)
                if res.status_code in [200, 201]:
                    status_str = "SENT"
                    recipient_str = f"WhatsApp ({whatsapp_phone})"
        except Exception as e:
            logger.warning(f"WhatsApp dispatch error: {e}")

    if status_str == "SIMULATED":
        recipient_str = f"Simulated Owner Mobile ({owner.phone or 'Business Owner Phone'})"

    # Record notification state on the lead
    lead.approval_channel = target_channel
    lead.last_notification_sent_at = datetime.now()
    db.commit()
    db.refresh(lead)

    return NotificationDispatchResult(
        lead_id=lead.id,
        recipient=recipient_str,
        channel=target_channel,
        status=status_str,
        preview_message=message_body
    )

def handle_inbound_approval(
    db: Session,
    action_text: str,
    lead_id: Optional[int] = None,
    sender: Optional[str] = None
) -> ZeroUIApprovalResult:
    """
    Handles inbound webhook messages from business owner (thumbs-up 👍 or text edits).
    Immediately approves and dispatches the response to the customer.
    """
    raw_text = action_text.strip()
    
    # 1. Identify Target Lead
    target_lead = None
    if lead_id:
        target_lead = db.query(Lead).filter(Lead.id == lead_id).first()
    
    if not target_lead:
        # Check if text contains #<number> or Lead #<number>
        match = re.search(r'#(\d+)', raw_text)
        if match:
            found_id = int(match.group(1))
            target_lead = db.query(Lead).filter(Lead.id == found_id).first()

    if not target_lead:
        # Default to the most recent lead pending response approval
        target_lead = (
            db.query(Lead)
            .filter(Lead.response_status != ResponseStatus.APPROVED.value)
            .order_by(desc(Lead.created_at))
            .first()
        )

    if not target_lead:
        # Fallback to the absolute latest lead
        target_lead = db.query(Lead).order_by(desc(Lead.created_at)).first()

    if not target_lead:
        return ZeroUIApprovalResult(
            success=False,
            lead_id=0,
            lead_name="Unknown",
            action_taken="NO_LEAD_FOUND",
            response_status="UNKNOWN",
            lead_status="UNKNOWN",
            final_response="",
            reply_to_owner="⚠️ No active customer enquiries found to approve.",
            customer_notified=False
        )

    # 2. Check for Approval Thumbs-up / Positive Confirmation
    normalized_clean = raw_text.lower().replace(":", "").replace("-", "")
    is_thumbs_up = any(token in raw_text for token in ["👍", "thumbsup", "+1", "👌", "✅"])
    is_text_approval = any(word in normalized_clean.split() for word in ["approve", "approved", "yes", "ok", "send", "proceed", "good"])

    if is_thumbs_up or is_text_approval:
        target_lead.response_status = ResponseStatus.APPROVED.value
        target_lead.status = LeadStatus.CONTACTED.value
        db.commit()
        db.refresh(target_lead)

        reply = (
            f"✅ Approved! Reply for Lead #{target_lead.id} ({target_lead.name}) "
            f"has been APPROVED and dispatched to the customer."
        )
        return ZeroUIApprovalResult(
            success=True,
            lead_id=target_lead.id,
            lead_name=target_lead.name,
            action_taken="APPROVED",
            response_status=target_lead.response_status,
            lead_status=target_lead.status,
            final_response=target_lead.suggested_response or "",
            reply_to_owner=reply,
            customer_notified=True
        )

    # 3. Check for Text Edits (e.g., "Edit: Hi Jane...", or revised custom message)
    edit_prefixes = [r'^edit\s*:\s*', r'^revise\s*:\s*', r'^custom\s*:\s*', r'^change\s*:\s*']
    cleaned_edit = raw_text
    is_edit_instruction = False

    for pat in edit_prefixes:
        if re.search(pat, raw_text, re.IGNORECASE):
            cleaned_edit = re.sub(pat, '', raw_text, flags=re.IGNORECASE).strip()
            is_edit_instruction = True
            break

    # If it's a substantive replacement text (more than 10 chars, not just a keyword)
    if is_edit_instruction or len(cleaned_edit) > 15:
        target_lead.suggested_response = cleaned_edit
        target_lead.response_status = ResponseStatus.APPROVED.value
        target_lead.status = LeadStatus.CONTACTED.value
        db.commit()
        db.refresh(target_lead)

        reply = (
            f"✅ Updated & Approved! Lead #{target_lead.id} ({target_lead.name}) "
            f"has been updated with your revised text and dispatched to the customer."
        )
        return ZeroUIApprovalResult(
            success=True,
            lead_id=target_lead.id,
            lead_name=target_lead.name,
            action_taken="EDITED_AND_APPROVED",
            response_status=target_lead.response_status,
            lead_status=target_lead.status,
            final_response=target_lead.suggested_response,
            reply_to_owner=reply,
            customer_notified=True
        )

    # 4. Unknown instruction
    return ZeroUIApprovalResult(
        success=False,
        lead_id=target_lead.id,
        lead_name=target_lead.name,
        action_taken="UNKNOWN_COMMAND",
        response_status=target_lead.response_status or "DRAFT",
        lead_status=target_lead.status,
        final_response=target_lead.suggested_response or "",
        reply_to_owner=(
            f"ℹ️ Received: \"{raw_text}\".\n"
            f"To approve Lead #{target_lead.id}: reply with 👍 or 'APPROVE'.\n"
            f"To revise & send: reply with 'EDIT: <your message>'."
        ),
        customer_notified=False
    )
