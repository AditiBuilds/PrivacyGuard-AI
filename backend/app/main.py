from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.session import init_db, SessionLocal
from app.api.endpoints import router
from app.services.demo_service import demo_service
from app.models.entities import ProcessingJob

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    # Check if DB has existing jobs; if empty, load baseline demo scenarios
    db = SessionLocal()
    try:
        count = db.query(ProcessingJob).count()
        if count == 0:
            demo_service.load_demo_data(db)
    except Exception as e:
        print(f"Initial demo loading note: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Privacy-Aware AI Assistant & Decision Support Platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global safe error handler - prevents stack trace leakage
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log internally but return clean error response
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected server error occurred while processing the privacy workflow.",
            "type": type(exc).__name__,
        }
    )

app.include_router(router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "documentation": "/docs",
        "api_prefix": settings.API_PREFIX
    }
