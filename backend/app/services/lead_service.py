from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from datetime import datetime
from typing import List, Optional, Tuple
from app.models.lead import Lead, LeadStatus, LeadPriority, LeadSource, ResponseStatus
from app.schemas.lead import LeadCreate, LeadUpdate, WebhookLeadPayload

def get_leads(
    db: Session,
    user_id: int,
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    source: Optional[str] = None,
    category: Optional[str] = None,
    follow_up_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Lead], int]:
    # Match leads owned by the user, or webhook leads assigned to this user / unassigned if single tenant
    query = db.query(Lead).filter(or_(Lead.user_id == user_id, Lead.user_id == None))
    
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Lead.name.ilike(search_fmt),
                Lead.email.ilike(search_fmt),
                Lead.message.ilike(search_fmt),
                Lead.category.ilike(search_fmt),
                Lead.intent.ilike(search_fmt)
            )
        )
    if status:
        query = query.filter(Lead.status == status.upper())
    if priority:
        query = query.filter(Lead.priority == priority.upper())
    if source:
        query = query.filter(Lead.source == source.upper())
    if category:
        query = query.filter(Lead.category.ilike(f"%{category}%"))

    now = datetime.now()
    if follow_up_status:
        fus = follow_up_status.lower()
        if fus == "overdue":
            query = query.filter(
                Lead.follow_up_at != None,
                Lead.follow_up_at < now,
                Lead.status.notin_([LeadStatus.CONVERTED.value, LeadStatus.LOST.value])
            )
        elif fus == "upcoming":
            query = query.filter(
                Lead.follow_up_at != None,
                Lead.follow_up_at >= now,
                Lead.status.notin_([LeadStatus.CONVERTED.value, LeadStatus.LOST.value])
            )
        elif fus == "scheduled":
            query = query.filter(Lead.follow_up_at != None)
        elif fus == "none":
            query = query.filter(Lead.follow_up_at == None)

    total = query.count()
    leads = query.order_by(desc(Lead.created_at)).offset(skip).limit(limit).all()
    return leads, total

def get_lead_by_id(db: Session, lead_id: int, user_id: int) -> Optional[Lead]:
    return db.query(Lead).filter(
        Lead.id == lead_id,
        or_(Lead.user_id == user_id, Lead.user_id == None)
    ).first()

def create_lead(db: Session, lead_in: LeadCreate, user_id: int) -> Lead:
    lead = Lead(
        name=lead_in.name,
        email=lead_in.email,
        phone=lead_in.phone,
        message=lead_in.message,
        source=lead_in.source.upper() if lead_in.source else LeadSource.MANUAL.value,
        priority=lead_in.priority.upper() if lead_in.priority else LeadPriority.MEDIUM.value,
        status=LeadStatus.NEW.value,
        category=lead_in.category,
        follow_up_at=lead_in.follow_up_at,
        response_status=ResponseStatus.DRAFT.value,
        user_id=user_id,
        customer_id=lead_in.customer_id,
        budget=lead_in.budget,
        timeline=lead_in.timeline,
        requirements=lead_in.requirements,
        audio_url=lead_in.audio_url,
        transcription=lead_in.transcription,
        matched_portfolio_id=lead_in.matched_portfolio_id
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

def create_webhook_lead(db: Session, payload: WebhookLeadPayload) -> Lead:
    lead = Lead(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        message=payload.message,
        source=payload.source.upper() if payload.source else LeadSource.WEBSITE.value,
        status=LeadStatus.NEW.value,
        priority=LeadPriority.MEDIUM.value,
        follow_up_at=payload.follow_up_at,
        response_status=ResponseStatus.DRAFT.value,
        user_id=payload.user_id,
        budget=payload.budget,
        timeline=payload.timeline,
        requirements=payload.requirements
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

def get_customer_enquiries(db: Session, customer_id: int) -> List[Lead]:
    return db.query(Lead).filter(Lead.customer_id == customer_id).order_by(desc(Lead.created_at)).all()

def get_customer_enquiry_by_id(db: Session, enquiry_id: int, customer_id: int) -> Optional[Lead]:
    return db.query(Lead).filter(
        Lead.id == enquiry_id,
        Lead.customer_id == customer_id
    ).first()

def create_customer_enquiry(
    db: Session,
    customer,
    message: str,
    owner_id: Optional[int] = None,
    budget: Optional[str] = None,
    timeline: Optional[str] = None,
    audio_url: Optional[str] = None,
    transcription: Optional[str] = None
) -> Lead:
    from app.models.user import User, UserRole

    target_owner_id = owner_id
    if not target_owner_id:
        # Assign to the first available BUSINESS_OWNER
        owner = db.query(User).filter(User.role == UserRole.BUSINESS_OWNER.value).first()
        if owner:
            target_owner_id = owner.id

    enquiry = Lead(
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        message=message,
        source=LeadSource.WEBSITE.value,
        status=LeadStatus.NEW.value,
        priority=LeadPriority.MEDIUM.value,
        response_status=ResponseStatus.DRAFT.value,
        user_id=target_owner_id,
        customer_id=customer.id,
        budget=budget,
        timeline=timeline,
        audio_url=audio_url,
        transcription=transcription
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return enquiry


def update_lead(db: Session, lead: Lead, lead_update: LeadUpdate) -> Lead:
    update_data = lead_update.model_dump(exclude_unset=True)
    
    if "status" in update_data and update_data["status"]:
        update_data["status"] = update_data["status"].upper()
    if "priority" in update_data and update_data["priority"]:
        update_data["priority"] = update_data["priority"].upper()
    if "source" in update_data and update_data["source"]:
        update_data["source"] = update_data["source"].upper()
    if "response_status" in update_data and update_data["response_status"]:
        update_data["response_status"] = update_data["response_status"].upper()

    for field, value in update_data.items():
        setattr(lead, field, value)

    db.commit()
    db.refresh(lead)
    return lead

def delete_lead(db: Session, lead: Lead) -> None:
    db.delete(lead)
    db.commit()

