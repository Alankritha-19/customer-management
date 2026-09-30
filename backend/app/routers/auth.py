from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse, UserProfileUpdate, BusinessOwnerSummary
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Validate role
    role_str = (user_in.role or "BUSINESS_OWNER").upper()
    if role_str not in [UserRole.BUSINESS_OWNER.value, UserRole.CUSTOMER.value]:
        role_str = UserRole.BUSINESS_OWNER.value

    hashed = hash_password(user_in.password)
    new_user = User(
        email=user_in.email.lower(),
        name=user_in.name,
        phone=user_in.phone,
        role=role_str,
        hashed_password=hashed
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.put("/me", response_model=UserResponse)
def update_me(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if profile_in.name is not None and profile_in.name.strip():
        current_user.name = profile_in.name.strip()
    if profile_in.phone is not None:
        current_user.phone = profile_in.phone.strip()
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)

@router.get("/owners", response_model=List[BusinessOwnerSummary])
def get_business_owners(db: Session = Depends(get_db)):
    owners = db.query(User).filter(User.role == UserRole.BUSINESS_OWNER.value).all()
    return [BusinessOwnerSummary.model_validate(o) for o in owners]

