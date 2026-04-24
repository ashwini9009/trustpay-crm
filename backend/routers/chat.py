from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models.models import User, ChatHistory
from schemas.schemas import ChatMessage, ChatResponse
from utils.auth import get_current_user
from services.ai_service import get_ai_reply

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])

@router.post("/", response_model=ChatResponse)
async def chat(
    payload: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get chat history for context
    history = db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id
    ).order_by(ChatHistory.created_at.desc()).limit(20).all()
    history.reverse()

    # Get AI reply
    reply = await get_ai_reply(payload.message, current_user, db, history)

    # Save user message
    user_msg = ChatHistory(user_id=current_user.id, role="user", message=payload.message)
    db.add(user_msg)

    # Save assistant reply
    ai_msg = ChatHistory(user_id=current_user.id, role="assistant", message=reply)
    db.add(ai_msg)
    db.commit()

    return {"reply": reply, "timestamp": datetime.utcnow()}

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id
    ).order_by(ChatHistory.created_at.asc()).limit(100).all()
    return [{"role": h.role, "message": h.message, "timestamp": h.created_at} for h in history]

@router.delete("/history")
def clear_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Chat history cleared"}
