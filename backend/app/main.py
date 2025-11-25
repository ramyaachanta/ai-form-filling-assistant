from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.api.profile_routes import router as profile_router
from app.api.auth_routes import router as auth_router
from app.database import init_db
import asyncio

app = FastAPI(
    title="AI Form Filling Assistant",
    description="AI-powered automation tool for filling web forms using Vision and UI Automation",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(profile_router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    await init_db()


@app.get("/")
async def root():
    return {
        "message": "AI Form Filling Assistant API",
        "version": "1.0.0",
        "docs": "/docs"
    }

