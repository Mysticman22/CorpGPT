from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class AuditLog(Base):
    """Immutable record of every admin action."""
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String(64), nullable=False, index=True)  # e.g. APPROVE_USER, REJECT_USER, ROLE_CHANGE
    entity_type = Column(String(64), nullable=True)               # e.g. "user", "document"
    entity_id = Column(String(64), nullable=True)                 # UUID of affected entity
    description = Column(Text, nullable=True)                     # human-readable summary
    metadata_ = Column("metadata", JSONB, nullable=True)          # extra context (old/new values etc)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), index=True, nullable=False)
    query = Column(Text, nullable=False)
    documents_accessed = Column(JSONB, nullable=True)  # List of document IDs retrieved
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", foreign_keys=[user_id])
    department = relationship("Department", foreign_keys=[department_id])
