import io
import pytest
from tests.conftest import client
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus, ResponseStatus
from app.models.portfolio import PortfolioItem


def _create_owner(email="owner@studio.com"):
    res = client.post("/auth/register", json={
        "email": email,
        "password": "password123",
        "name": "Studio Director",
        "role": "BUSINESS_OWNER",
        "phone": "+1234567890"
    })
    return res.json()["access_token"], res.json()["user"]["id"]

def _create_customer(email="bride@client.com"):
    res = client.post("/auth/register", json={
        "email": email,
        "password": "password123",
        "name": "Sarah Jenkins",
        "role": "CUSTOMER",
        "phone": "+1987654321"
    })
    return res.json()["access_token"], res.json()["user"]["id"]

# =========================================================================
# FEATURE 1: WhatsApp Voice Note Whisperer Tests
# =========================================================================
def test_whatsapp_voice_note_upload_and_whisper_extraction():
    token, owner_id = _create_owner("voice_owner@studio.com")

    # Simulate voice audio file containing project constraints
    audio_content = (
        b"VOICE_NOTE_MOCK: Hey there! We are planning a minimalist beach wedding on November 15th. "
        b"Our budget is around $5,000 and we need full day photo and drone coverage."
    )
    fake_audio_file = ("voicenote.mp3", io.BytesIO(audio_content), "audio/mpeg")

    res = client.post(
        "/leads/voice-note",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": fake_audio_file},
        data={"name": "Sarah Jenkins", "email": "sarah@wedding.com", "source": "WHATSAPP"}
    )

    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Sarah Jenkins"
    assert "beach wedding" in data["transcription"].lower()
    assert data["extracted_constraints"]["budget"] is not None
    assert "$5,000" in data["extracted_constraints"]["budget"]
    assert "November 15" in data["extracted_constraints"]["timeline"]
    assert "suggested_response" in data
    # Verify auto-matched portfolio in response
    assert data["matched_portfolio_title"] == "Minimalist Beach Wedding Showcase"
    assert "https://portfolio.example.com/beach-wedding-case-study" in data["suggested_response"]

    # Verify lead in CRM database
    lead_res = client.get(f"/leads/{data['lead_id']}", headers={"Authorization": f"Bearer {token}"})
    assert lead_res.status_code == 200
    lead_obj = lead_res.json()
    assert lead_obj["source"] == "WHATSAPP"
    assert lead_obj["budget"] == "$5,000"
    assert "November 15" in lead_obj["timeline"]

# =========================================================================
# FEATURE 2: Instant Portfolio/Asset Matchmaker Tests
# =========================================================================
def test_portfolio_tag_matching_and_auto_reply_link():
    token, _ = _create_owner("portfolio_owner@agency.com")

    # 1. Test Portfolio matchmaker query endpoint
    match_res = client.post(
        "/portfolio/match",
        json={"text": "I would love a minimalist sunset photoshoot at the beach for our wedding.", "limit": 2}
    )
    assert match_res.status_code == 200
    match_data = match_res.json()
    assert match_data["count"] >= 1
    assert match_data["matched_items"][0]["title"] == "Minimalist Beach Wedding Showcase"
    assert "beach" in match_data["matched_tags"]

    # 2. Create lead with keywords
    lead_create = client.post(
        "/leads",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "David Miller",
            "email": "david@beachwedding.com",
            "message": "We are looking for a minimalist beach wedding photographer.",
            "source": "WEBSITE"
        }
    )
    lead_id = lead_create.json()["id"]

    # 3. Generate response with auto portfolio matching
    gen_res = client.post(
        f"/leads/{lead_id}/generate-response",
        headers={"Authorization": f"Bearer {token}"},
        json={"tone": "friendly", "include_portfolio_match": True}
    )
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert gen_data["matched_portfolio_title"] == "Minimalist Beach Wedding Showcase"
    assert "https://portfolio.example.com/beach-wedding-case-study" in gen_data["suggested_response"]

# =========================================================================
# FEATURE 3: Zero-UI WhatsApp/Telegram Approver Tests
# =========================================================================
def test_zero_ui_approval_with_thumbs_up_emoji():
    owner_token, owner_id = _create_owner("zero_owner@agency.com")
    cust_token, cust_id = _create_customer("zero_cust@client.com")

    # Customer submits enquiry
    enq_res = client.post(
        "/customer/enquiries",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"message": "We need help with branding and web design.", "owner_id": owner_id}
    )
    enquiry_id = enq_res.json()["id"]

    # Generate initial draft response
    draft_res = client.post(
        f"/leads/{enquiry_id}/generate-response",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"tone": "professional"}
    )
    assert draft_res.status_code == 200

    # Business owner receives push notification alert
    push_res = client.post(
        f"/leads/{enquiry_id}/push-approval",
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert push_res.status_code == 200
    assert push_res.json()["lead_id"] == enquiry_id

    # Customer sees approved_response is still None before approval
    view_before = client.get(f"/customer/enquiries/{enquiry_id}", headers={"Authorization": f"Bearer {cust_token}"}).json()
    assert view_before["approved_response"] is None

    # Inbound webhook simulation: Business owner replies with 👍 thumbs-up emoji!
    webhook_res = client.post(
        "/webhooks/approval-action",
        json={"lead_id": enquiry_id, "action_text": "👍"}
    )
    assert webhook_res.status_code == 200
    approval_result = webhook_res.json()
    assert approval_result["success"] is True
    assert approval_result["action_taken"] == "APPROVED"
    assert approval_result["response_status"] == "APPROVED"
    assert approval_result["lead_status"] == "CONTACTED"
    assert "Approved!" in approval_result["reply_to_owner"]

    # Now Customer Portal immediately shows the approved response!
    view_after = client.get(f"/customer/enquiries/{enquiry_id}", headers={"Authorization": f"Bearer {cust_token}"}).json()
    assert view_after["approved_response"] is not None
    assert view_after["status"] == "CONTACTED"

def test_zero_ui_approval_with_text_edit():
    owner_token, owner_id = _create_owner("edit_owner@agency.com")
    cust_token, cust_id = _create_customer("edit_cust@client.com")

    # Customer submits enquiry
    enq_res = client.post(
        "/customer/enquiries",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"message": "Inquiry about your photography packages.", "owner_id": owner_id}
    )
    enquiry_id = enq_res.json()["id"]

    # Inbound webhook: Business owner replies with custom edit directly from Telegram/WhatsApp
    revised_message = "Hi Sarah, thank you for reaching out! We can offer our full wedding package for $3,800."
    webhook_res = client.post(
        "/webhooks/approval-action",
        json={"lead_id": enquiry_id, "action_text": f"Edit: {revised_message}"}
    )
    assert webhook_res.status_code == 200
    edit_result = webhook_res.json()
    assert edit_result["success"] is True
    assert edit_result["action_taken"] == "EDITED_AND_APPROVED"
    assert edit_result["final_response"] == revised_message

    # Customer portal reflects the customized message!
    cust_view = client.get(f"/customer/enquiries/{enquiry_id}", headers={"Authorization": f"Bearer {cust_token}"}).json()
    assert cust_view["approved_response"] == revised_message
    assert cust_view["status"] == "CONTACTED"

def test_telegram_and_whatsapp_inbound_endpoints():
    owner_token, owner_id = _create_owner("meta_owner@agency.com")
    cust_token, cust_id = _create_customer("meta_cust@client.com")

    enq = client.post(
        "/customer/enquiries",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"message": "Please confirm booking for next week.", "owner_id": owner_id}
    ).json()
    enquiry_id = enq["id"]

    # Test Telegram inbound message format
    tg_payload = {
        "update_id": 10001,
        "message": {
            "message_id": 55,
            "chat": {"id": 12345678},
            "text": f"Lead #{enquiry_id} 👍"
        }
    }
    tg_res = client.post("/webhooks/telegram", json=tg_payload)
    assert tg_res.status_code == 200
    assert tg_res.json()["action"] == "APPROVED"

    # Test WhatsApp Webhook Verification GET
    verify_res = client.get(
        "/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=customer_crm_verify_token_2026&hub.challenge=test_challenge_code"
    )
    assert verify_res.status_code == 200
    assert verify_res.text == "test_challenge_code"
