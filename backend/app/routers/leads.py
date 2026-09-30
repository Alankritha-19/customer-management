from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.lead import Lead, LeadStatus, LeadPriority, LeadSource, ResponseStatus
from app.schemas.lead import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadAnalysisResponse,
    LeadGenerateResponseRequest,
    LeadGenerateResponseResponse
)
from app.services.auth_service import require_business_owner
from app.services import lead_service
from app.services import ai_service

router = APIRouter(prefix="/leads", tags=["Business Owner Enquiries"])

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
    return [LeadResponse.model_validate(lead) for lead in leads]

@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_in: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    lead = lead_service.create_lead(db=db, lead_in=lead_in, user_id=current_user.id)
    return LeadResponse.model_validate(lead)

@router.get("/{id}", response_model=LeadResponse)
def get_lead(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    lead = lead_service.get_lead_by_id(db=db, lead_id=id, user_id=current_user.id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer enquiry not found.")
    return LeadResponse.model_validate(lead)

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
    return LeadResponse.model_validate(updated_lead)

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
    
    ai_result = await ai_service.analyze_lead_with_ai(lead)
    
    # Store AI analysis results in MySQL
    lead.category = ai_result.get("category")
    lead.priority = ai_result.get("priority", lead.priority)
    lead.intent = ai_result.get("intent")
    lead.ai_summary = ai_result.get("ai_summary")
    db.commit()
    db.refresh(lead)

    return LeadAnalysisResponse(
        lead_id=lead.id,
        category=lead.category or "General",
        priority=lead.priority,
        intent=lead.intent or "General",
        ai_summary=lead.ai_summary or "",
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

    suggested, provider = await ai_service.generate_response_with_ai(
        lead=lead,
        tone=tone,
        instructions=instructions,
        response_type=response_type
    )

    lead.suggested_response = suggested
    lead.response_status = ResponseStatus.DRAFT.value
    db.commit()
    db.refresh(lead)

    return LeadGenerateResponseResponse(
        lead_id=lead.id,
        suggested_response=lead.suggested_response,
        response_status=lead.response_status,
        response_type=response_type,
        ai_provider=provider
    )

