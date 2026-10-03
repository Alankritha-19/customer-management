from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.schemas.portfolio import (
    PortfolioItemCreate,
    PortfolioItemUpdate,
    PortfolioItemResponse,
    PortfolioMatchQuery,
    PortfolioMatchResponse
)
from app.services.auth_service import require_business_owner, get_current_user
from app.services import portfolio_service

router = APIRouter(prefix="/portfolio", tags=["Portfolio Matchmaker"])

@router.get("", response_model=List[PortfolioItemResponse])
def get_portfolio_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    items = portfolio_service.get_portfolio_items(db=db, skip=skip, limit=limit, active_only=active_only)
    return [PortfolioItemResponse.model_validate(item) for item in items]

@router.get("/{id}", response_model=PortfolioItemResponse)
def get_portfolio_item(
    id: int,
    db: Session = Depends(get_db)
):
    item = portfolio_service.get_portfolio_by_id(db=db, item_id=id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio asset not found.")
    return PortfolioItemResponse.model_validate(item)

@router.post("", response_model=PortfolioItemResponse, status_code=status.HTTP_201_CREATED)
def create_portfolio_item(
    item_in: PortfolioItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    item = portfolio_service.create_portfolio_item(db=db, item_in=item_in, user_id=current_user.id)
    return PortfolioItemResponse.model_validate(item)

@router.put("/{id}", response_model=PortfolioItemResponse)
def update_portfolio_item(
    id: int,
    item_in: PortfolioItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    item = portfolio_service.get_portfolio_by_id(db=db, item_id=id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio asset not found.")
    updated = portfolio_service.update_portfolio_item(db=db, item=item, item_in=item_in)
    return PortfolioItemResponse.model_validate(updated)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio_item(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_owner)
):
    item = portfolio_service.get_portfolio_by_id(db=db, item_id=id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio asset not found.")
    portfolio_service.delete_portfolio_item(db=db, item=item)
    return None

@router.post("/match", response_model=PortfolioMatchResponse)
def test_match_portfolio(
    query: PortfolioMatchQuery,
    db: Session = Depends(get_db)
):
    matched, tags = portfolio_service.match_portfolio_assets(db=db, query_text=query.text, limit=query.limit)
    return PortfolioMatchResponse(
        matched_items=[PortfolioItemResponse.model_validate(item) for item in matched],
        matched_tags=tags,
        count=len(matched)
    )
