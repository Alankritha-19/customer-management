import httpx
import json
import logging
from typing import Dict, Any, Tuple
from app.config import settings
from app.models.lead import Lead, LeadPriority

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

def _is_gemini_available() -> bool:
    return bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 10)

def _heuristic_analyze(message: str, name: str, source: str) -> Dict[str, Any]:
    text = message.lower()
    
    # Priority Heuristics
    urgent_keywords = ["urgent", "asap", "immediately", "emergency", "deadline", "today", "right now", "critical", "hire now", "ready to start"]
    high_keywords = ["budget", "pricing", "quote", "cost", "hire", "proposal", "project", "contract", "need developer", "build", "redesign"]
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
    if any(k in text for k in ["website", "web", "react", "frontend", "fullstack", "app", "software", "landing page", "ecommerce", "shopify", "wordpress"]):
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

    # Concise Summary
    first_sentence = message.strip().split(".")[0].replace("\n", " ")
    if len(first_sentence) > 120:
        first_sentence = first_sentence[:117] + "..."
    summary = f"Prospect {name} reached out via {source}. Key requirement: '{first_sentence}'. Interest in {category}."

    return {
        "category": category,
        "priority": priority,
        "intent": intent,
        "ai_summary": summary,
        "ai_provider": "Local Analysis"
    }

def _heuristic_generate_response(
    lead: Lead,
    tone: str = "professional",
    instructions: str = "",
    response_type: str = "initial"
) -> str:
    lead_name = lead.name or "there"
    category = lead.category or "your project"
    intent = lead.intent or "your enquiry"
    
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
        tone_intro = "Thank you for reaching out regarding " + category + "."
        if tone == "friendly":
            tone_intro = f"Thanks so much for getting in touch! I'd love to help you with {category}."
        elif tone == "direct":
            tone_intro = f"Received your inquiry regarding {category}."
        elif tone == "consultative":
            tone_intro = f"Thank you for considering our expertise for {category}. I reviewed your requirement carefully."

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

    return f"{greeting}\n\n{tone_intro}\n\n{body}\n\n{cta}{extra}\n\n{sign_off}"

async def analyze_lead_with_ai(lead: Lead) -> Dict[str, Any]:
    if not _is_gemini_available():
        return _heuristic_analyze(lead.message, lead.name, lead.source)

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
  "category": "<Specific service category, e.g. Web Development, SaaS, Marketing, Coaching, Consulting, Pricing Inquiry, General Inquiry>",
  "priority": "<Exactly one of: LOW, MEDIUM, HIGH, URGENT>",
  "intent": "<Specific intent, e.g. Ready to Buy, Requesting Quote, Exploration, Technical Support, Partnership>",
  "ai_summary": "<2-3 sentences concise professional summary of the customer problem and need>"
}}
"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={settings.GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 500}
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
                
                # Normalize priority
                priority = str(parsed.get("priority", "MEDIUM")).upper()
                if priority not in ["LOW", "MEDIUM", "HIGH", "URGENT"]:
                    priority = "MEDIUM"
                    
                return {
                    "category": parsed.get("category", "General Inquiry"),
                    "priority": priority,
                    "intent": parsed.get("intent", "Information Gathering"),
                    "ai_summary": parsed.get("ai_summary", ""),
                    "ai_provider": "Gemini"
                }
    except Exception as e:
        logger.warning(f"Gemini API analysis failed: {e}. Falling back to local analysis.")

    # Fallback if Gemini fails or errors out
    fallback = _heuristic_analyze(lead.message, lead.name, lead.source)
    return fallback

async def generate_response_with_ai(
    lead: Lead,
    tone: str = "professional",
    instructions: str = "",
    response_type: str = "initial"
) -> Tuple[str, str]:
    if not _is_gemini_available():
        res = _heuristic_generate_response(lead, tone, instructions, response_type)
        return res, "Local Analysis"

    context_type = "a follow-up message checking in on the customer" if response_type == "follow_up" else "an initial reply to the customer's new inquiry"

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
- AI Summary: {lead.ai_summary or 'N/A'}
- Message Purpose: {"Follow-up check-in" if response_type == "follow_up" else "Initial inquiry reply"}

Tone to use: {tone} (professional / friendly / direct / consultative)
Additional custom instructions: {instructions if instructions else 'None'}

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
                return suggested, "Gemini"
    except Exception as e:
        logger.warning(f"Gemini API response generation failed: {e}. Falling back to local template.")

    res = _heuristic_generate_response(lead, tone, instructions, response_type)
    return res, "Local Analysis"
