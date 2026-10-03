from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List

class PortfolioItemBase(BaseModel):
    title: str = Field(..., min_length=1, description="Title of the portfolio piece or case study")
    description: Optional[str] = Field(default=None, description="Detailed description")
    category: Optional[str] = Field(default=None, description="Category or industry")
    tags: str = Field(..., min_length=1, description="Comma-separated tag keywords (e.g. beach, minimalist, wedding)")
    asset_url: str = Field(..., min_length=1, description="Direct URL to case study, gallery, or high-res photo")
    thumbnail_url: Optional[str] = Field(default=None, description="Preview image URL")
    is_active: bool = Field(default=True, description="Whether this item is eligible for auto-matching")

class PortfolioItemCreate(PortfolioItemBase):
    pass

class PortfolioItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    asset_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_active: Optional[bool] = None

class PortfolioItemResponse(PortfolioItemBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PortfolioMatchQuery(BaseModel):
    text: str = Field(..., min_length=1, description="Inquiry text or customer message to match against tags")
    limit: Optional[int] = Field(default=2, ge=1, le=10)

class PortfolioMatchResponse(BaseModel):
    matched_items: List[PortfolioItemResponse]
    matched_tags: List[str]
    count: int
