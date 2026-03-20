from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routers import auth, admin, chat, documents, departments, meta
from app.models import user, otp, audit_log, document, chat as chat_models
from app.core.middleware import DepartmentIsolationMiddleware
from app.core.rate_limit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NEXUS API", version="1.0.0")

# Rate Limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(documents.router, prefix="/api/documents", tags=["Document Vault"])
app.include_router(departments.router, prefix="/api/departments", tags=["Departments"])
app.include_router(meta.router, prefix="/api/meta", tags=["Metadata"])

@app.get("/")
def read_root():
    return {"message": "NEXUS API is running"}
