import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import UUID
import uuid
from datetime import datetime
from app.core import rag

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.document import Document, AccessType
from app.auth.utils import get_current_user, require_department_admin
from app.core.middleware import validate_department_access

router = APIRouter()

SECURE_VAULT_DIR = os.getenv("SECURE_VAULT_DIR", "C:/CorpGPT/backend/secure_vault")
os.makedirs(SECURE_VAULT_DIR, exist_ok=True)

@router.get("/")
def get_documents(
    current_admin: User = Depends(require_department_admin),
    db: Session = Depends(get_db)
):
    if current_admin.role == UserRole.SUPER_ADMIN:
        return db.query(Document).all()
    else:
        return db.query(Document).filter(Document.department_id == current_admin.department_id).all()

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    department_id: UUID = Form(...),
    access_type: AccessType = Form(AccessType.DEPARTMENT),
    current_admin: User = Depends(require_department_admin),
    db: Session = Depends(get_db)
):
    # Department Admins can only upload to their own department
    validate_department_access(department_id, current_admin)
    
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only PDF files are allowed in the Secure Vault.")
    
    # Store file securely out of public reach
    file_id = str(uuid.uuid4())
    secure_path = os.path.join(SECURE_VAULT_DIR, f"{file_id}.pdf")
    
    try:
        with open(secure_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Failed to save file: {str(e)}")

    doc = Document(
        title=title,
        department_id=department_id,
        uploaded_by=current_admin.id,
        storage_path=secure_path,
        access_type=access_type,
        embedding_status="PENDING",
        created_at=datetime.utcnow()
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Trigger RAG embedding task securely in background
    background_tasks.add_task(rag.ingest_document, secure_path, department_id, doc.id)
    
    return {"message": "Document securely uploaded to vault", "document_id": doc.id}


@router.get("/{document_id}/stream")
async def stream_secure_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
        
    # Enforce Strict Department Isolation for viewing
    validate_department_access(doc.department_id, current_user)
            
    if not os.path.exists(doc.storage_path):
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Document file missing from Secure Vault.")
    
    # Securely stream the file buffer without exposing a public URL
    return FileResponse(
        path=doc.storage_path, 
        media_type="application/pdf", 
        filename=f"{doc.title}.pdf",
        content_disposition_type="inline" # Inline forces browser viewing, not downloading
    )
