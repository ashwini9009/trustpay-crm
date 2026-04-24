from config import settings
from sqlalchemy.orm import Session
from models.models import User, Partner, Target, ChatHistory
from datetime import datetime

def get_partner_context(db: Session, user_id: int) -> str:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return ""
    partner = db.query(Partner).filter(Partner.user_id == user_id).first()
    targets = db.query(Target).filter(Target.partner_id == partner.id).all() if partner else []

    ctx = f"""
    Partner Name: {user.name}
    Email: {user.email}
    Company: {partner.company_name if partner else 'N/A'}
    Business Type: {partner.business_type if partner else 'N/A'}
    City: {partner.city if partner else 'N/A'}
    Joining Date: {partner.joining_date.strftime('%d %b %Y') if partner and partner.joining_date else 'N/A'}
    Active: {'Yes' if partner and partner.is_active else 'No'}
    """

    if targets:
        ctx += "\n\nTargets:\n"
        for t in targets:
            pct = (t.achieved_value / t.target_value * 100) if t.target_value > 0 else 0
            ctx += f"  - {t.title}: {t.achieved_value}/{t.target_value} ({pct:.1f}%) | Reward: {t.reward or 'N/A'} | Status: {'Completed' if t.is_completed else 'In Progress'}\n"

    return ctx

def get_all_partners_context(db: Session) -> str:
    partners = db.query(Partner).all()
    ctx = f"Total Partners: {len(partners)}\n\n"
    for p in partners:
        user = p.user
        targets = p.targets
        completed = sum(1 for t in targets if t.is_completed)
        ctx += f"Partner: {user.name} | Company: {p.company_name} | City: {p.city} | Targets: {len(targets)} total, {completed} completed\n"
    return ctx

async def web_search(query: str) -> str:
    """Search the web for current information using Tavily."""
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=settings.TAVILY_API_KEY)
        result = client.search(query=query, max_results=3)
        snippets = []
        for r in result.get("results", []):
            snippets.append(f"- {r['title']}: {r['content'][:200]}")
        return "\n".join(snippets) if snippets else "No results found."
    except Exception as e:
        print(f"[Search Error] {e}")
        return ""

def needs_web_search(message: str) -> bool:
    """Detect if message needs live web search."""
    keywords = [
        "rate", "interest", "roi", "today", "current", "latest", "now",
        "price", "news", "rbi", "repo", "inflation", "stock", "market",
        "bank of maharashtra", "sbi", "hdfc", "icici", "axis", "pnb",
        "canara", "kotak", "yes bank", "idfc", "bajaj", "lic",
        "2024", "2025", "this year", "this month", "recently"
    ]
    msg = message.lower()
    return any(k in msg for k in keywords)

async def get_ai_reply(
    message: str,
    user: User,
    db: Session,
    chat_history: list
) -> str:
    is_admin = user.role.value == "admin"
    if is_admin:
        context = get_all_partners_context(db)
    else:
        context = get_partner_context(db, user.id)

    # 🔍 Web search if needed
    search_context = ""
    if settings.TAVILY_API_KEY and needs_web_search(message):
        print(f"[Web Search] Searching for: {message}")
        search_context = await web_search(message)
        if search_context:
            search_context = f"\n\nLive Web Search Results:\n{search_context}\n"

    system_prompt = f"""You are a smart, helpful AI assistant embedded in TrustPay Loans CRM system.
Today's date: {datetime.now().strftime('%d %B %Y')}

{"You are assisting an ADMIN. Here is the current partner data:" if is_admin else "You are assisting a BUSINESS PARTNER. Here is their data:"}

{context}
{search_context}

You can answer ANY question the user asks — whether it's about:
- Finance, banking, loans, interest rates, EMI calculations
- General knowledge, science, technology, history
- AI, machine learning, software, computers
- Business, marketing, strategy
- Current events and world affairs
- Math, calculations, conversions
- Personal advice and productivity
- Anything else!

For CRM-specific tasks:
- Provide insights on partner performance and targets
- Suggest improvement strategies
- Be encouraging and motivating to partners
- For admins, provide analytics and summaries

Rules:
- ALWAYS give a helpful, confident answer to every question
- If live web search results are provided above, use them for accurate current data
- NEVER say "I don't know" — always give the best available answer
- Keep responses clear, concise and useful
- For Indian bank loan rates if no search results, use these approximate ranges:
  * Home Loans: 8.35% - 10.5%
  * Personal Loans: 10.5% - 24%
  * Business Loans: 10% - 16%
  * LAP: 9% - 14%
- Always mention rates are subject to change and vary by applicant profile
"""

    history_text = []
    for h in chat_history[-10:]:
        history_text.append({"role": h.role, "content": h.message})

    try:
        if settings.AI_PROVIDER == "groq" and settings.GROQ_API_KEY:
            return await _groq_reply(system_prompt, history_text, message)
        elif settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            return await _gemini_reply(system_prompt, history_text, message)
        elif settings.OPENAI_API_KEY:
            return await _openai_reply(system_prompt, history_text, message)
        else:
            return _fallback_reply(message, is_admin)
    except Exception as e:
        print(f"[AI Error] {e}")
        return f"I'm having trouble connecting to the AI service right now. Please try again later. Error: {str(e)[:100]}"

async def _groq_reply(system_prompt: str, history: list, message: str) -> str:
    from groq import Groq
    client = Groq(api_key=settings.GROQ_API_KEY)

    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=1000
    )
    return response.choices[0].message.content

async def _gemini_reply(system_prompt: str, history: list, message: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash", system_instruction=system_prompt)

    chat = model.start_chat(history=[
        {"role": h["role"] if h["role"] != "assistant" else "model", "parts": [h["content"]]}
        for h in history
    ])
    response = chat.send_message(message)
    return response.text

async def _openai_reply(system_prompt: str, history: list, message: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=1000
    )
    return response.choices[0].message.content

def _fallback_reply(message: str, is_admin: bool) -> str:
    msg = message.lower()
    if any(w in msg for w in ["target", "progress", "achieve"]):
        return "I can help you track your targets! Please check your targets dashboard for real-time progress updates. Keep pushing — every step counts! 💪"
    elif any(w in msg for w in ["loan", "interest", "emi", "rate"]):
        return "TrustPay offers Home Loans (8.5-12%), Personal Loans (12-18%), Business Loans (10-15%), and LAP (9-13%). For specific queries, contact your relationship manager."
    elif any(w in msg for w in ["reward", "trip", "incentive"]):
        return "Rewards are assigned based on your target completion. Check your targets section to see what exciting rewards await you! 🏆"
    else:
        return "I'm here to help with partner performance, finance queries, and target tracking. What would you like to know?"