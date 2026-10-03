import re
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.portfolio import PortfolioItem
from app.schemas.portfolio import PortfolioItemCreate, PortfolioItemUpdate

def get_portfolio_items(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    active_only: bool = True
) -> List[PortfolioItem]:
    query = db.query(PortfolioItem)
    if active_only:
        query = query.filter(PortfolioItem.is_active == True)
    return query.order_by(desc(PortfolioItem.created_at)).offset(skip).limit(limit).all()

def get_portfolio_by_id(db: Session, item_id: int) -> Optional[PortfolioItem]:
    return db.query(PortfolioItem).filter(PortfolioItem.id == item_id).first()

def create_portfolio_item(
    db: Session,
    item_in: PortfolioItemCreate,
    user_id: Optional[int] = None
) -> PortfolioItem:
    item = PortfolioItem(
        title=item_in.title,
        description=item_in.description,
        category=item_in.category,
        tags=item_in.tags,
        asset_url=item_in.asset_url,
        thumbnail_url=item_in.thumbnail_url,
        is_active=item_in.is_active,
        user_id=user_id
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

def update_portfolio_item(
    db: Session,
    item: PortfolioItem,
    item_in: PortfolioItemUpdate
) -> PortfolioItem:
    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item

def delete_portfolio_item(db: Session, item: PortfolioItem) -> None:
    db.delete(item)
    db.commit()

def match_portfolio_assets(
    db: Session,
    query_text: str,
    user_id: Optional[int] = None,
    limit: int = 2
) -> Tuple[List[PortfolioItem], List[str]]:
    """
    Matches an incoming inquiry message against registered portfolio items by tag keywords.
    Returns: (matched_items, matched_tag_keywords)
    """
    if not query_text or not query_text.strip():
        return [], []

    # Tokenize input text
    normalized_text = query_text.lower()
    text_words = set(re.findall(r'\b[a-z0-9_-]+\b', normalized_text))

    # Fetch active portfolio items
    query = db.query(PortfolioItem).filter(PortfolioItem.is_active == True)
    items = query.all()

    scored_items = []
    overall_matched_tags = set()

    for item in items:
        score = 0
        item_matched_tags = []

        # Parse tags (comma or space separated)
        raw_tags = [t.strip().lower() for t in item.tags.split(",") if t.strip()]
        for tag in raw_tags:
            # Exact phrase match in the inquiry text (e.g., "beach wedding" or "minimalist")
            if tag in normalized_text:
                score += 3
                item_matched_tags.append(tag)
                overall_matched_tags.add(tag)
            else:
                # Word-level match
                tag_words = set(re.findall(r'\b[a-z0-9_-]+\b', tag))
                intersection = tag_words.intersection(text_words)
                if intersection:
                    score += len(intersection) * 1.5
                    item_matched_tags.extend(list(intersection))
                    overall_matched_tags.update(intersection)

        # Title keyword match
        title_words = set(re.findall(r'\b[a-z0-9_-]+\b', (item.title or "").lower()))
        title_intersection = title_words.intersection(text_words)
        if title_intersection:
            score += len(title_intersection) * 2

        # Category keyword match
        if item.category:
            cat_words = set(re.findall(r'\b[a-z0-9_-]+\b', item.category.lower()))
            cat_intersection = cat_words.intersection(text_words)
            if cat_intersection:
                score += len(cat_intersection) * 1

        if score > 0:
            scored_items.append((score, item))

    # Sort descending by score
    scored_items.sort(key=lambda x: x[0], reverse=True)

    matched_items = [item for _, item in scored_items[:limit]]
    return matched_items, list(overall_matched_tags)
