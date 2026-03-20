from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base

class AccessType(str, enum.Enum):
    DEPARTMENT = "DEPARTMENT"
    RESTRICTED = "RESTRICTED"

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False, index=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), index=True, nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    storage_path = Column(String, nullable=False, unique=True)
    access_type = Column(SQLEnum(AccessType, values_callable=lambda x: [e.value for e in x], native_enum=False), default=AccessType.DEPARTMENT, nullable=False)
    
    # Store list of emails or user IDs for restricted access
    allowed_users = Column(JSONB, default=list)
    
    embedding_status = Column(String, default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="documents")
    uploader = relationship("User", foreign_keys=[uploaded_by])
