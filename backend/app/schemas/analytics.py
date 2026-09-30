from pydantic import BaseModel
from typing import List, Optional
from app.schemas.lead import LeadResponse

class KPIStats(BaseModel):
    total_leads: int
    new_leads: int
    qualified_leads: int
    converted_leads: int
    lost_leads: int
    conversion_rate: float
    qualification_rate: float
    upcoming_follow_ups: int = 0
    overdue_follow_ups: int = 0

class BreakdownItem(BaseModel):
    label: str
    count: int
    percentage: float

class TrendItem(BaseModel):
    date: str
    count: int

class AnalyticsResponse(BaseModel):
    kpis: KPIStats
    status_breakdown: List[BreakdownItem]
    priority_breakdown: List[BreakdownItem]
    source_breakdown: List[BreakdownItem]
    trend_7d: List[TrendItem]
    recent_leads: List[LeadResponse]
    upcoming_follow_ups_list: List[LeadResponse] = []
    overdue_follow_ups_list: List[LeadResponse] = []
