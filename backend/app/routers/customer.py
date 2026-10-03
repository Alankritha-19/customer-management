import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.lead import Lead, ResponseStatus
from app.schemas.auth import UserResponse, UserProfileUpdate
from app.schemas.lead import CustomerEnquiryCreate, CustomerEnquiryResponse
from app.services.auth_service import require_customer
from app.services import lead_service, ai_service, transcription_service, approver_service

router = APIRouter(prefix="/customer", tags=["Customer Portal"])

def _to_customer_enquiry_response(lead: Lead) -> CustomerEnquiryResponse:
    approved = lead.suggested_response if lead.response_status == ResponseStatus.APPROVED.value else None
    owner_name = lead.owner.name if lead.owner else None
    return CustomerEnquiryResponse(
        id=lead.id,
        name=lead.name,
        email=lead.email,
        phone=lead.phone,
        message=lead.message,
        source=lead.source,
        status=lead.status,
        approved_response=approved,
        response_status=lead.response_status,
        business_owner_name=owner_name,
        budget=lead.budget,
        timeline=lead.timeline,
        requirements=lead.requirements,
        audio_url=lead.audio_url,
        created_at=lead.created_at,
        updated_at=lead.updated_at
    )

@router.get("/enquiries", response_model=List[CustomerEnquiryResponse])
def get_customer_enquiries(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    enquiries = lead_service.get_customer_enquiries(db=db, customer_id=current_user.id)
    return [_to_customer_enquiry_response(e) for e in enquiries]

@router.post("/enquiries", response_model=CustomerEnquiryResponse, status_code=status.HTTP_201_CREATED)
async def submit_customer_enquiry(
    enquiry_in: CustomerEnquiryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    enquiry = lead_service.create_customer_enquiry(
        db=db,
        customer=current_user,
        message=enquiry_in.message,
        owner_id=enquiry_in.owner_id,
        budget=enquiry_in.budget,
        timeline=enquiry_in.timeline
    )

    # Automatically run background/heuristic AI classification and response drafting with portfolio matching
    try:
        ai_result = await ai_service.analyze_lead_with_ai(enquiry, db=db)
        enquiry.category = ai_result.get("category")
        enquiry.priority = ai_result.get("priority", enquiry.priority)
        enquiry.intent = ai_result.get("intent")
        enquiry.ai_summary = ai_result.get("ai_summary")
        if not enquiry.budget and ai_result.get("budget"):
            enquiry.budget = ai_result.get("budget")
        if not enquiry.timeline and ai_result.get("timeline"):
            enquiry.timeline = ai_result.get("timeline")
        if ai_result.get("requirements"):
            enquiry.requirements = ai_result.get("requirements")

        suggested, _ = await ai_service.generate_response_with_ai(
            lead=enquiry,
            db=db,
            include_portfolio_match=True
        )
        enquiry.suggested_response = suggested
        db.commit()
        db.refresh(enquiry)

        # Notify business owner for Zero-UI approval
        await approver_service.dispatch_approval_request(db=db, lead=enquiry)
    except Exception:
        pass

    return _to_customer_enquiry_response(enquiry)

@router.post("/enquiries/voice-note", response_model=CustomerEnquiryResponse, status_code=status.HTTP_201_CREATED)
async def submit_customer_voice_enquiry(
    file: UploadFile = File(...),
    owner_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """
    Submits a customer voice note enquiry from the Customer Portal.
    Transcribes audio, extracts constraints, auto-drafts reply with matching portfolio items,
    and alerts the business owner.
    """
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".mp3"
    if not file_ext:
        file_ext = ".mp3"
    saved_filename = f"cust_voice_{uuid.uuid4().hex[:12]}{file_ext}"
    saved_path = os.path.join(settings.AUDIO_UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    transcription, _ = await transcription_service.transcribe_audio_file(
        file_path=saved_path,
        content_type=file.content_type
    )

    constraints = ai_service.extract_project_constraints(transcription)

    enquiry = lead_service.create_customer_enquiry(
        db=db,
        customer=current_user,
        message=transcription,
        owner_id=owner_id,
        budget=constraints.get("budget"),
        timeline=constraints.get("timeline"),
        audio_url=f"/uploads/audio/{saved_filename}",
        transcription=transcription
    )
    enquiry.requirements = constraints.get("requirements")

    # Run AI analysis and auto draft reply with portfolio link
    try:
        analysis = await ai_service.analyze_lead_with_ai(enquiry, db=db)
        enquiry.category = analysis.get("category")
        enquiry.priority = analysis.get("priority", enquiry.priority)
        enquiry.intent = analysis.get("intent")
        enquiry.ai_summary = analysis.get("ai_summary")

        suggested, _ = await ai_service.generate_response_with_ai(
            lead=enquiry,
            db=db,
            include_portfolio_match=True
        )
        enquiry.suggested_response = suggested
        db.commit()
        db.refresh(enquiry)

        # Notify business owner for Zero-UI approval
        await approver_service.dispatch_approval_request(db=db, lead=enquiry)
    except Exception:
        pass

    return _to_customer_enquiry_response(enquiry)

@router.get("/enquiries/{id}", response_model=CustomerEnquiryResponse)
def get_customer_enquiry(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    enquiry = lead_service.get_customer_enquiry_by_id(db=db, enquiry_id=id, customer_id=current_user.id)
    if not enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enquiry not found or access denied."
        )
    return _to_customer_enquiry_response(enquiry)

@router.get("/profile", response_model=UserResponse)
def get_customer_profile(current_user: User = Depends(require_customer)):
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserResponse)
def update_customer_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    if profile_in.name is not None and profile_in.name.strip():
        current_user.name = profile_in.name.strip()
    if profile_in.phone is not None:
        current_user.phone = profile_in.phone.strip()
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
