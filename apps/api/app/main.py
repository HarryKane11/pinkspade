from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import brands, campaigns, designs, photoshoot, exports, jobs


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("BrandFlow Studio API starting...")
    yield
    # Shutdown
    print("BrandFlow Studio API shutting down...")


app = FastAPI(
    title="BrandFlow Studio API",
    description="AI 마케팅 에셋 생성 플랫폼 - Google Pomelli 스타일",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(brands.router, prefix="/api/brands", tags=["brands"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["campaigns"])
app.include_router(designs.router, prefix="/api/designs", tags=["designs"])
app.include_router(photoshoot.router, prefix="/api/photoshoot", tags=["photoshoot"])
app.include_router(exports.router, prefix="/api/exports", tags=["exports"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])


@app.get("/")
async def root():
    return {
        "name": "BrandFlow Studio API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
