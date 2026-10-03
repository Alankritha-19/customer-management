import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.lead import Lead, LeadStatus, LeadPriority, LeadSource, ResponseStatus
from app.schemas.lead import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadAnalysisResponse,
    LeadGenerateResponseRequest,
    LeadGenerateResponseResponse,
    VoiceNoteUploadResponse
)
from app.schemas.approval import NotificationDispatchResult
from app.services.auth_service import require_business_owner, get_current_user
from app.services import lead_service
from app.services import ai_service
from app.services import transcription_service
from app.services import approver_service

router = APIRouter(prefix="/leads", tags=["Business Owner Enquiries"])

def _to_lead_response(lead: Lead) -> LeadResponse:
    res = LeadResponse.model_validate(lead)
    if lead.matched_portfolio:
        res.matched_portfolio_title = lead.matched_portfolio.title
        res.matched_portfolio_url = lead.matched_portfolio.asset_url
    return res

@router.get("", response_model=List[LeadResponse])
def get_leads(
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    source: Optional[str] = None,
    category: Optional[str] = None,
    follow_up_status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    leads, _ = lead_service.get_leads(
        db=db,
        user_id=current_user.id,
        search=search,
        status=status,
        priority=priority,
        source=source,
        category=category,
        follow_up_status=follow_up_status,
        skip=skip,
        limit=limit
    )
    return [_to_lead_response(lead) for lead in leads]

@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_in: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    lead = lead_service.create_lead(db=db, lead_in=lead_in, user_id=current_user.id)
    return _to_lead_response(lead)

@router.post("/voice-note", response_model=VoiceNoteUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_voice_note(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    source: Optional[str] = Form("WHATSAPP"),
    tone: Optional[str] = Form("professional"),
    dispatch_notification: Optional[bool] = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    """
    Feature 1: WhatsApp Voice Note Whisperer
    Accepts an audio file upload, transcribes speech to text, extracts project constraints
    (dates, budget, requirements), creates CRM lead, auto-matches portfolio assets,
    drafts response, and pushes Zero-UI notification to owner.
    """
    # 1. Save uploaded audio clip
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".mp3"
    if not file_ext:
        file_ext = ".mp3"
    saved_filename = f"voice_{uuid.uuid4().hex[:12]}{file_ext}"
    saved_path = os.path.join(settings.AUDIO_UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Transcribe Audio
    transcription, provider = await transcription_service.transcribe_audio_file(
        file_path=saved_path,
        content_type=file.content_type
    )

    # 3. Extract Constraints & AI Analysis
    constraints = ai_service.extract_project_constraints(transcription)

    temp_lead = Lead(
        name=name or "WhatsApp Prospect",
        email=email or f"voice_prospect_{uuid.uuid4().hex[:6]}@whatsapp.lead",
        phone=phone,
        message=transcription,
        source=source.upper() if source else "WHATSAPP"
    )
    analysis = await ai_service.analyze_lead_with_ai(temp_lead, db=db)

    # 4. Create Lead in CRM
    lead = Lead(
        name=name or temp_lead.name,
        email=email or temp_lead.email,
        phone=phone or temp_lead.phone,
        message=transcription,
        source=source.upper() if source else "WHATSAPP",
        status=LeadStatus.NEW.value,
        priority=analysis.get("priority", LeadPriority.HIGH.value),
        category=analysis.get("category", "General Inquiry"),
        intent=analysis.get("intent", "Information Gathering"),
        ai_summary=analysis.get("ai_summary", ""),
        budget=constraints.get("budget"),
        timeline=constraints.get("timeline"),
        requirements=constraints.get("requirements"),
        audio_url=f"/uploads/audio/{saved_filename}",
        transcription=transcription,
        response_status=ResponseStatus.DRAFT.value,
        user_id=current_user.id
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    # 5. Draft response with Portfolio Matchmaker automatically
    suggested_reply, _ = await ai_service.generate_response_with_ai(
        lead=lead,
        tone=tone or "professional",
        db=db,
        include_portfolio_match=True
    )
    lead.suggested_response = suggested_reply
    db.commit()
    db.refresh(lead)

    # 6. Push Zero-UI WhatsApp / Telegram Notification to business owner
    notif_dispatched = False
    notif_detail = None
    if dispatch_notification:
        try:
            notif_res = await approver_service.dispatch_approval_request(db=db, lead=lead)
            notif_dispatched = True
            notif_detail = f"Alert pushed to {notif_res.recipient} via {notif_res.channel}"
        except Exception as e:
            notif_detail = f"Notification error: {e}"

    matched_title = lead.matched_portfolio.title if lead.matched_portfolio else None
    matched_url = lead.matched_portfolio.asset_url if lead.matched_portfolio else None

    return VoiceNoteUploadResponse(
        lead_id=lead.id,
        name=lead.name,
        email=lead.email,
        transcription=transcription,
        extracted_constraints=constraints,
        suggested_response=lead.suggested_response or "",
        matched_portfolio_title=matched_title,
        matched_portfolio_url=matched_url,
        notification_dispatched=notif_dispatched,
        notification_detail=notif_detail,
        ai_provider=provider
    )

@router.get("/{id}", response_model=LeadResponse)
def get_lead(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    lead = lead_service.get_lead_by_id(db=db, lead_id=id, user_id=current_user.id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer enquiry not found.")
    return _to_lead_response(lead)

@router.put("/{id}", response_model=LeadResponse)
def update_lead(
    id: int,
    lead_in: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    lead = lead_service.get_lead_by_id(db=db, lead_id=id, user_id=current_user.id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer enquiry not found.")
    
    updated_lead = lead_service.update_lead(db=db, lead=lead, lead_update=lead_in)
    return _to_lead_response(updated_lead)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    lead = lead_service.get_lead_by_id(db=db, lead_id=id, user_id=current_user.id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer enquiry not found.")
    
    lead_service.delete_lead(db=db, lead=lead)
    return None

@router.post("/{id}/analyze", response_model=LeadAnalysisResponse)
async def analyze_lead(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    lead = lead_service.get_lead_by_id(db=db, lead_id=id, user_id=current_user.id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer enquiry not found.")
    
    ai_result = await ai_service.analyze_lead_with_ai(lead, db=db)
    
    # Store AI analysis results in MySQL
    lead.category = ai_result.get("category")
    lead.priority = ai_result.get("priority", lead.priority)
    lead.intent = ai_result.get("intent")
    lead.ai_summary = ai_result.get("ai_summary")
    if ai_result.get("budget"):
        lead.budget = ai_result.get("budget")
    if ai_result.get("timeline"):
        lead.timeline = ai_result.get("timeline")
    if ai_result.get("requirements"):
        lead.requirements = ai_result.get("requirements")

    db.commit()
    db.refresh(lead)

    return LeadAnalysisResponse(
        lead_id=lead.id,
        category=lead.category or "General",
        priority=lead.priority,
        intent=lead.intent or "General",
        ai_summary=lead.ai_summary or "",
        budget=lead.budget,
        timeline=lead.timeline,
        requirements=lead.requirements,
        ai_provider=ai_result.get("ai_provider", "Local Analysis")
    )

@router.post("/{id}/generate-response", response_model=LeadGenerateResponseResponse)
async def generate_lead_response(
    id: int,
    request: LeadGenerateResponseRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    lead = lead_service.get_lead_by_id(db=db, lead_id=id, user_id=current_user.id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer enquiry not found.")
    
    tone = request.tone if request and request.tone else "professional"
    response_type = request.response_type if request and request.response_type else "initial"
    instructions = request.additional_instructions if request and request.additional_instructions else ""
    include_portfolio = request.include_portfolio_match if request and request.include_portfolio_match is not None else True

    suggested, provider = await ai_service.generate_response_with_ai(
        lead=lead,
        tone=tone,
        instructions=instructions,
        response_type=response_type,
        db=db,
        include_portfolio_match=include_portfolio
    )

    lead.suggested_response = suggested
    lead.response_status = ResponseStatus.DRAFT.value
    db.commit()
    db.refresh(lead)

    matched_title = lead.matched_portfolio.title if lead.matched_portfolio else None
    matched_url = lead.matched_portfolio.asset_url if lead.matched_portfolio else None

    return LeadGenerateResponseResponse(
        lead_id=lead.id,
        suggested_response=lead.suggested_response,
        response_status=lead.response_status,
        response_type=response_type,
        ai_provider=provider,
        matched_portfolio_title=matched_title,
        matched_portfolio_url=matched_url
    )

@router.post("/{id}/push-approval", response_model=NotificationDispatchResult)
async def push_lead_for_approval(
    id: int,
    channel: Optional[str] = Query(None, description="TELEGRAM, WHATSAPP, or SIMULATED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    """
    Feature 3: Push draft to business owner's private WhatsApp / Telegram for Zero-UI approval.
    """
    lead = lead_service.get_lead_by_id(db=db, lead_id=id, user_id=current_user.id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer enquiry not found.")
    
    result = await approver_service.dispatch_approval_request(db=db, lead=lead, channel=channel)
    return result
