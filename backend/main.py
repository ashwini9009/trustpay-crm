from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from models import models  # noqa: ensure models are registered
from routers import auth, partners, targets, chat, dashboard
from config import settings
import os

# Create tables
Base.metadata.create_all(bind=engine)

# Create upload directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="TrustPay Loans CRM",
    description="Partner management CRM for TrustPay Loans",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Routers
app.include_router(auth.router)
app.include_router(partners.router)
app.include_router(targets.router)
app.include_router(chat.router)
app.include_router(dashboard.router)

@app.get("/")
def root():
    return {"message": "TrustPay Loans CRM API", "version": "1.0.0", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy"}
