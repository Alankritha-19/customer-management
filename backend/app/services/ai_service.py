import httpx
import json
import logging
import re
from typing import Dict, Any, Tuple, Optional, List
from sqlalchemy.orm import Session
from app.config import settings
from app.models.lead import Lead, LeadPriority
from app.services.portfolio_service import match_portfolio_assets

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

def _is_gemini_available() -> bool:
    return bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 10)

def extract_project_constraints(message: str) -> Dict[str, Optional[str]]:
    """
    Extracts project constraints (budget, timeline, requirements) from inquiry message or voice transcription.
    """
    text = message.strip()
    lower_text = text.lower()

    # 1. Budget extraction
    budget = None
    budget_patterns = [
        r'(\$\s*[\d,]+(?:\s*-\s*\$\s*[\d,]+)?(?:\s*k|\s*thousand)?)',
        r'(\€\s*[\d,]+(?:\s*-\s*\€\s*[\d,]+)?)',
        r'(\£\s*[\d,]+(?:\s*-\s*\£\s*[\d,]+)?)',
        r'(?:budget\s*(?:is|of|around|approx|approximately)?\s*[:=]?\s*)([^\.,\n]+)',
        r'(\b\d+\s*(?:k|thousand)\s*(?:dollars|usd|eur|budget)?)'
    ]
    for pattern in budget_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            found = match.group(1).strip()
            if len(found) <= 40:
                budget = found
                break

    # 2. Timeline extraction
    timeline = None
    timeline_patterns = [
        r'(?:on|by|before|in|around|deadline\s*is)?\s*([a-zA-Z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?)',
        r'(\b(?:next week|next month|in \d+ weeks?|in \d+ months?|q[1-4]\s*\d{0,4}|by the end of [a-zA-Z]+)\b)',
        r'(\b(?:asap|immediately|urgent|today|this weekend)\b)'
    ]
    for pattern in timeline_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            found = match.group(1).strip()
            # Avoid matching words like "is 1"
            if len(found) >= 3 and not found.isdigit():
                timeline = found
                break

    # 3. Key requirements extraction
    sentences = [s.strip() for s in re.split(r'[\.\?\!\n]+', text) if len(s.strip()) > 8]
    req_candidates = []
    req_keywords = ["need", "looking for", "want", "organizing", "require", "develop", "build", "redesign", "coverage", "shoot", "service"]
    for s in sentences:
        if any(k in s.lower() for k in req_keywords):
            req_candidates.append(s)

    if req_candidates:
        requirements = "; ".join(req_candidates[:2])
    elif sentences:
        requirements = sentences[0]
    else:
        requirements = text[:150]

    return {
        "budget": budget,
        "timeline": timeline,
        "requirements": requirements
    }

def _heuristic_analyze(message: str, name: str, source: str) -> Dict[str, Any]:
    text = message.lower()
    
    # Priority Heuristics
    urgent_keywords = ["urgent", "asap", "immediately", "emergency", "deadline", "today", "right now", "critical", "hire now", "ready to start"]
    high_keywords = ["budget", "pricing", "quote", "cost", "hire", "proposal", "project", "contract", "need developer", "build", "redesign", "wedding"]
    low_keywords = ["just curious", "maybe later", "general inquiry", "student", "job inquiry", "free"]
    
    priority = LeadPriority.MEDIUM.value
    if any(k in text for k in urgent_keywords):
        priority = LeadPriority.URGENT.value
    elif any(k in text for k in high_keywords):
        priority = LeadPriority.HIGH.value
    elif any(k in text for k in low_keywords):
        priority = LeadPriority.LOW.value
        
    # Category Heuristics
    category = "General Inquiry"
    if any(k in text for k in ["wedding", "photography", "photoshoot", "camera", "drone", "videography", "beach"]):
        category = "Wedding & Event Photography"
    elif any(k in text for k in ["website", "web", "react", "frontend", "fullstack", "app", "software", "landing page", "ecommerce", "shopify", "wordpress"]):
        category = "Web & App Development"
    elif any(k in text for k in ["seo", "marketing", "leads", "ads", "traffic", "campaign", "social media", "content", "growth"]):
        category = "Digital Marketing & Growth"
    elif any(k in text for k in ["coach", "consulting", "strategy", "advice", "session", "audit", "mentorship"]):
        category = "Consulting & Coaching"
    elif any(k in text for k in ["design", "ui", "ux", "logo", "branding", "figma", "graphic"]):
        category = "UI/UX & Branding"
    elif any(k in text for k in ["price", "pricing", "rate", "cost", "quote", "how much", "estimate"]):
        category = "Pricing & Quotes"

    # Intent Heuristics
    intent = "Information Gathering"
    if any(k in text for k in ["hire", "ready to pay", "start immediately", "quote", "proposal", "contract"]):
        intent = "Ready to Buy / Hire"
    elif any(k in text for k in ["how much", "cost", "rate", "pricing", "estimate"]):
        intent = "Quote & Pricing Request"
    elif any(k in text for k in ["partner", "collab", "collaboration", "agency"]):
        intent = "Partnership Opportunity"
    elif any(k in text for k in ["help", "support", "issue", "fix", "broken"]):
        intent = "Technical Support / Fix"

    # Extract constraints
    constraints = extract_project_constraints(message)

    # Concise Summary
    first_sentence = message.strip().split(".")[0].replace("\n", " ")
    if len(first_sentence) > 120:
        first_sentence = first_sentence[:117] + "..."
    summary = f"Prospect {name} reached out via {source}. Key requirement: '{first_sentence}'. Interest in {category}."
    if constraints["budget"]:
        summary += f" Budget: {constraints['budget']}."
    if constraints["timeline"]:
        summary += f" Target Timeline: {constraints['timeline']}."

    return {
        "category": category,
        "priority": priority,
        "intent": intent,
        "ai_summary": summary,
        "budget": constraints["budget"],
        "timeline": constraints["timeline"],
        "requirements": constraints["requirements"],
        "ai_provider": "Local Analysis"
    }

def _append_portfolio_match(base_response: str, matched_items: List[Any], matched_tags: List[str]) -> str:
    if not matched_items:
        return base_response

    best_item = matched_items[0]
    tags_hint = f" ({', '.join(matched_tags[:3])})" if matched_tags else ""
    
    portfolio_blurb = (
        f"\n\nP.S. Based on your project focus{tags_hint}, take a look at our recent showcase:\n"
        f"🔗 {best_item.title}: {best_item.asset_url}"
    )
    if len(matched_items) > 1:
        second_item = matched_items[1]
        portfolio_blurb += f"\n🔗 Related Showcase: {second_item.title}: {second_item.asset_url}"

    # Insert right before sign-off if present
    sign_off_markers = ["Best regards,", "Warmly,", "Sincerely,", "Thanks,"]
    for marker in sign_off_markers:
        if marker in base_response:
            parts = base_response.rsplit(marker, 1)
            return parts[0].rstrip() + portfolio_blurb + "\n\n" + marker + parts[1]

    return base_response + portfolio_blurb

def _heuristic_generate_response(
    lead: Lead,
    tone: str = "professional",
    instructions: str = "",
    response_type: str = "initial",
    matched_items: Optional[List[Any]] = None,
    matched_tags: Optional[List[str]] = None
) -> str:
    lead_name = lead.name or "there"
    category = lead.category or "your project"
    
    greeting = f"Hi {lead_name},"
    if tone == "friendly":
        greeting = f"Hey {lead_name}!"
    elif tone == "direct":
        greeting = f"Hello {lead_name},"
    elif tone == "consultative":
        greeting = f"Dear {lead_name},"

    if response_type == "follow_up":
        tone_intro = f"I'm following up on our previous conversation regarding {category}."
        if tone == "friendly":
            tone_intro = f"Hope you're having a wonderful week! Just wanted to quickly check in on {category}."
        elif tone == "direct":
            tone_intro = f"Following up on your inquiry about {category}."
        elif tone == "consultative":
            tone_intro = f"I am writing to follow up regarding the strategic requirements for {category} we discussed."

        body = "I wanted to see if you had any questions regarding our proposal or if your team is ready to move forward. We would be delighted to assist you with next steps."
        cta = "Would you have 10-15 minutes for a quick catch-up this week? Let me know what time suits your calendar best."
    else:
        tone_intro = f"Thank you for reaching out regarding {category}."
        if tone == "friendly":
            tone_intro = f"Thanks so much for getting in touch! I'd love to help you with {category}."
        elif tone == "direct":
            tone_intro = f"Received your inquiry regarding {category}."
        elif tone == "consultative":
            tone_intro = f"Thank you for considering our expertise for {category}. I reviewed your requirement carefully."

        body_parts = []
        if lead.timeline:
            body_parts.append(f"We have noted your timeline ({lead.timeline}) and can accommodate this schedule.")
        if lead.budget:
            body_parts.append(f"Your indicated budget range ({lead.budget}) aligns well with our service scope.")
        
        if body_parts:
            body = " ".join(body_parts) + " I would be delighted to discuss the details and ensure we deliver exactly what you envision."
        else:
            body = "I would be glad to discuss how we can assist you with your goals. Based on your message, we can provide a tailored solution and timeline that fits your scope."
        
        if lead.priority in [LeadPriority.HIGH.value, LeadPriority.URGENT.value]:
            cta = "Since your project has high priority, let's schedule a quick 15-minute discovery call this week to finalize the details and next steps. What time works best for you?"
        else:
            cta = "Could you please share any additional specifications or preferred timelines? Alternatively, feel free to reply with a few convenient times for a brief conversation."

    sign_off = "Best regards,\nBusiness Team"
    if tone == "friendly":
        sign_off = "Warmly,\nBusiness Team"
    elif tone == "consultative":
        sign_off = "Sincerely,\nStrategic Lead"

    extra = f"\n\nNote: {instructions}" if instructions else ""
    full_draft = f"{greeting}\n\n{tone_intro}\n\n{body}\n\n{cta}{extra}\n\n{sign_off}"

    if matched_items:
        full_draft = _append_portfolio_match(full_draft, matched_items, matched_tags or [])

    return full_draft

async def analyze_lead_with_ai(lead: Lead, db: Optional[Session] = None) -> Dict[str, Any]:
    constraints = extract_project_constraints(lead.message)

    if not _is_gemini_available():
        res = _heuristic_analyze(lead.message, lead.name, lead.source)
        res["budget"] = constraints["budget"] or res.get("budget")
        res["timeline"] = constraints["timeline"] or res.get("timeline")
        res["requirements"] = constraints["requirements"] or res.get("requirements")
        return res

    prompt = f"""You are an expert CRM lead qualification and AI lead automation analyst.
Analyze the following customer lead and respond ONLY with a raw JSON object (no markdown code blocks, no backticks, just valid JSON).

Lead Details:
- Name: {lead.name}
- Email: {lead.email}
- Phone: {lead.phone or 'N/A'}
- Source: {lead.source}
- Customer Message: "{lead.message}"

Return JSON with exact keys:
{{
  "category": "<Specific service category, e.g. Wedding & Event Photography, Web Development, SaaS, Marketing, Coaching, Consulting, Pricing Inquiry>",
  "priority": "<Exactly one of: LOW, MEDIUM, HIGH, URGENT>",
  "intent": "<Specific intent, e.g. Ready to Buy, Requesting Quote, Exploration, Technical Support, Partnership>",
  "ai_summary": "<2-3 sentences concise professional summary of the customer problem and need>",
  "budget": "<Extracted budget or null>",
  "timeline": "<Extracted timeline/dates or null>",
  "requirements": "<Summary of extracted project constraints and deliverables>"
}}
"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={settings.GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 600}
                }
            )
            if response.status_code == 200:
                data = response.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if raw_text.startswith("`"):
                    raw_text = raw_text.split("\n", 1)[1]
                    if raw_text.endswith("`"):
                        raw_text = raw_text.rsplit("`", 1)[0]
                parsed = json.loads(raw_text.strip())
                
                priority = str(parsed.get("priority", "MEDIUM")).upper()
                if priority not in ["LOW", "MEDIUM", "HIGH", "URGENT"]:
                    priority = "MEDIUM"
                    
                return {
                    "category": parsed.get("category", "General Inquiry"),
                    "priority": priority,
                    "intent": parsed.get("intent", "Information Gathering"),
                    "ai_summary": parsed.get("ai_summary", ""),
                    "budget": parsed.get("budget") or constraints["budget"],
                    "timeline": parsed.get("timeline") or constraints["timeline"],
                    "requirements": parsed.get("requirements") or constraints["requirements"],
                    "ai_provider": "Gemini"
                }
    except Exception as e:
        logger.warning(f"Gemini API analysis failed: {e}. Falling back to local analysis.")

    res = _heuristic_analyze(lead.message, lead.name, lead.source)
    res["budget"] = constraints["budget"]
    res["timeline"] = constraints["timeline"]
    res["requirements"] = constraints["requirements"]
    return res

async def generate_response_with_ai(
    lead: Lead,
    tone: str = "professional",
    instructions: str = "",
    response_type: str = "initial",
    db: Optional[Session] = None,
    include_portfolio_match: bool = True
) -> Tuple[str, str]:
    matched_items = []
    matched_tags = []
    
    # Run instant portfolio matchmaker if database session available
    if db and include_portfolio_match:
        query_text = f"{lead.message} {lead.category or ''} {lead.requirements or ''} {lead.intent or ''}"
        matched_items, matched_tags = match_portfolio_assets(db, query_text=query_text, limit=2)
        if matched_items:
            lead.matched_portfolio_id = matched_items[0].id

    if not _is_gemini_available():
        res = _heuristic_generate_response(
            lead=lead,
            tone=tone,
            instructions=instructions,
            response_type=response_type,
            matched_items=matched_items,
            matched_tags=matched_tags
        )
        return res, "Local Analysis"

    context_type = "a follow-up message checking in on the customer" if response_type == "follow_up" else "an initial reply to the customer's new inquiry"
    portfolio_context = ""
    if matched_items:
        best = matched_items[0]
        portfolio_context = f"\nRelevant Portfolio Asset to include: Title: '{best.title}', URL: '{best.asset_url}'"

    prompt = f"""You are an expert business assistant drafting a customer reply for a business owner.
Draft {context_type}.
DO NOT assume the deal is signed; guide them politely toward the next step (booking a call, answering questions, or scheduling a review).

Lead Details:
- Name: {lead.name}
- Email: {lead.email}
- Source: {lead.source}
- Customer Message: "{lead.message}"
- Category: {lead.category or 'General'}
- Intent: {lead.intent or 'General'}
- Priority: {lead.priority}
- Extracted Budget: {lead.budget or 'N/A'}
- Extracted Timeline: {lead.timeline or 'N/A'}
- Extracted Requirements: {lead.requirements or 'N/A'}
- AI Summary: {lead.ai_summary or 'N/A'}
{portfolio_context}

Tone to use: {tone} (professional / friendly / direct / consultative)
Additional custom instructions: {instructions if instructions else 'None'}

Instructions for portfolio link:
If a Relevant Portfolio Asset is provided above, please naturally reference it as a recommended case study or showcase link with its URL before the sign-off.

Generate ONLY the email/message draft text without any conversational preamble or markdown code blocks. Start with greeting and end with sign-off.
"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={settings.GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 800}
                }
            )
            if response.status_code == 200:
                data = response.json()
                suggested = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                # Ensure portfolio link is present
                if matched_items and matched_items[0].asset_url not in suggested:
                    suggested = _append_portfolio_match(suggested, matched_items, matched_tags)
                return suggested, "Gemini"
    except Exception as e:
        logger.warning(f"Gemini API response generation failed: {e}. Falling back to local template.")

    res = _heuristic_generate_response(
        lead=lead,
        tone=tone,
        instructions=instructions,
        response_type=response_type,
        matched_items=matched_items,
        matched_tags=matched_tags
    )
    return res, "Local Analysis"
