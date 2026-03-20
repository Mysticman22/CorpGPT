from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", use_alter=True, name="fk_department_creator"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    # foreign_keys must be explicit: there are two FK paths between users <-> departments
    # (users.department_id and departments.created_by). We want the users->department_id path.
    users = relationship("User", foreign_keys="User.department_id", back_populates="department")
    documents = relationship("Document", back_populates="department")
