from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.api.profile_routes import router as profile_router
from app.api.auth_routes import router as auth_router
from app.database import init_db
from app.utils.logger import logger
from app.middleware.rate_limit import RateLimitMiddleware
from app.config import settings
import asyncio

app = FastAPI(
    title="AI Form Filling Assistant",
    description="AI-powered automation tool for filling web forms using Vision and UI Automation",
    version="2.0.0"
)

logger.info("Starting AI Form Filling Assistant API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else ["http://localhost:5173", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware (only in production or if enabled)
if not settings.debug:
    app.add_middleware(RateLimitMiddleware, requests_per_minute=60)

app.include_router(router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(profile_router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database initialized successfully")


@app.get("/")
async def root():
    return {
        "message": "AI Form Filling Assistant API",
        "version": "1.0.0",
        "docs": "/docs"
    }

