from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, desc
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from app.models.lead import Lead, LeadStatus, LeadPriority, LeadSource
from app.schemas.analytics import AnalyticsResponse, KPIStats, BreakdownItem, TrendItem
from app.schemas.lead import LeadResponse

def get_analytics(db: Session, user_id: int) -> AnalyticsResponse:
    base_filter = or_(Lead.user_id == user_id, Lead.user_id == None)
    
    total_leads = db.query(Lead).filter(base_filter).count()
    new_leads = db.query(Lead).filter(base_filter, Lead.status == LeadStatus.NEW.value).count()
    qualified_leads = db.query(Lead).filter(base_filter, Lead.status == LeadStatus.QUALIFIED.value).count()
    converted_leads = db.query(Lead).filter(base_filter, Lead.status == LeadStatus.CONVERTED.value).count()
    lost_leads = db.query(Lead).filter(base_filter, Lead.status == LeadStatus.LOST.value).count()
    
    conversion_rate = round((converted_leads / total_leads * 100), 1) if total_leads > 0 else 0.0
    qualification_rate = round(((qualified_leads + converted_leads) / total_leads * 100), 1) if total_leads > 0 else 0.0

    now = datetime.now()

    # Follow-up stats & lists
    active_followup_filter = and_(
        base_filter,
        Lead.status.notin_([LeadStatus.CONVERTED.value, LeadStatus.LOST.value])
    )
    overdue_query = db.query(Lead).filter(
        active_followup_filter,
        Lead.follow_up_at != None,
        Lead.follow_up_at < now
    )
    overdue_follow_ups = overdue_query.count()
    overdue_follow_ups_list = [
        LeadResponse.model_validate(l) for l in overdue_query.order_by(Lead.follow_up_at.asc()).limit(5).all()
    ]

    upcoming_query = db.query(Lead).filter(
        active_followup_filter,
        Lead.follow_up_at != None,
        Lead.follow_up_at >= now
    )
    upcoming_follow_ups = upcoming_query.count()
    upcoming_follow_ups_list = [
        LeadResponse.model_validate(l) for l in upcoming_query.order_by(Lead.follow_up_at.asc()).limit(5).all()
    ]

    kpis = KPIStats(
        total_leads=total_leads,
        new_leads=new_leads,
        qualified_leads=qualified_leads,
        converted_leads=converted_leads,
        lost_leads=lost_leads,
        conversion_rate=conversion_rate,
        qualification_rate=qualification_rate,
        upcoming_follow_ups=upcoming_follow_ups,
        overdue_follow_ups=overdue_follow_ups
    )

    # Status Breakdown
    all_statuses = [LeadStatus.NEW.value, LeadStatus.CONTACTED.value, LeadStatus.QUALIFIED.value, LeadStatus.CONVERTED.value, LeadStatus.LOST.value]
    status_counts = dict(
        db.query(Lead.status, func.count(Lead.id))
        .filter(base_filter)
        .group_by(Lead.status)
        .all()
    )
    status_breakdown = [
        BreakdownItem(
            label=s,
            count=status_counts.get(s, 0),
            percentage=round((status_counts.get(s, 0) / total_leads * 100), 1) if total_leads > 0 else 0.0
        )
        for s in all_statuses
    ]

    # Priority Breakdown
    all_priorities = [LeadPriority.URGENT.value, LeadPriority.HIGH.value, LeadPriority.MEDIUM.value, LeadPriority.LOW.value]
    priority_counts = dict(
        db.query(Lead.priority, func.count(Lead.id))
        .filter(base_filter)
        .group_by(Lead.priority)
        .all()
    )
    priority_breakdown = [
        BreakdownItem(
            label=p,
            count=priority_counts.get(p, 0),
            percentage=round((priority_counts.get(p, 0) / total_leads * 100), 1) if total_leads > 0 else 0.0
        )
        for p in all_priorities
    ]

    # Source Breakdown
    all_sources = [LeadSource.WEBSITE.value, LeadSource.INSTAGRAM.value, LeadSource.WHATSAPP.value, LeadSource.MANUAL.value, LeadSource.OTHER.value]
    source_counts = dict(
        db.query(Lead.source, func.count(Lead.id))
        .filter(base_filter)
        .group_by(Lead.source)
        .all()
    )
    source_breakdown = [
        BreakdownItem(
            label=src,
            count=source_counts.get(src, 0),
            percentage=round((source_counts.get(src, 0) / total_leads * 100), 1) if total_leads > 0 else 0.0
        )
        for src in all_sources
    ]

    # 7-Day Trend
    today = datetime.now().date()
    trend_7d = []
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        next_day = target_date + timedelta(days=1)
        count = db.query(Lead).filter(
            base_filter,
            Lead.created_at >= target_date,
            Lead.created_at < next_day
        ).count()
        trend_7d.append(TrendItem(
            date=target_date.strftime("%b %d"),
            count=count
        ))

    # Recent Leads (up to 6)
    recent_db_leads = db.query(Lead).filter(base_filter).order_by(desc(Lead.created_at)).limit(6).all()
    recent_leads = [LeadResponse.model_validate(l) for l in recent_db_leads]

    return AnalyticsResponse(
        kpis=kpis,
        status_breakdown=status_breakdown,
        priority_breakdown=priority_breakdown,
        source_breakdown=source_breakdown,
        trend_7d=trend_7d,
        recent_leads=recent_leads,
        upcoming_follow_ups_list=upcoming_follow_ups_list,
        overdue_follow_ups_list=overdue_follow_ups_list
    )
