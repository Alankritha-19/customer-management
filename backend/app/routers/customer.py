from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.lead import Lead, ResponseStatus
from app.schemas.auth import UserResponse, UserProfileUpdate
from app.schemas.lead import CustomerEnquiryCreate, CustomerEnquiryResponse
from app.services.auth_service import require_customer
from app.services import lead_service, ai_service

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
        owner_id=enquiry_in.owner_id
    )

    # Automatically run background/heuristic AI classification for the business owner
    try:
        ai_result = await ai_service.analyze_lead_with_ai(enquiry)
        enquiry.category = ai_result.get("category")
        enquiry.priority = ai_result.get("priority", enquiry.priority)
        enquiry.intent = ai_result.get("intent")
        enquiry.ai_summary = ai_result.get("ai_summary")
        db.commit()
        db.refresh(enquiry)
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
