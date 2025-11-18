"""
Main FastAPI application for AI Form Filling Assistant
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="AI Form Filling Assistant",
    description="AI-powered automation tool for filling web forms using Vision and UI Automation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Form Filling Assistant API",
        "version": "1.0.0",
        "docs": "/docs"
    }

