from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base
from app.models.chat import Conversation

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    DEPARTMENT_ADMIN = "DEPARTMENT_ADMIN"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"

class UserStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"

# Department enum removed; now a ForeignKey mapping to departments table

class Position(str, enum.Enum):
    EMPLOYEE = "Employee"
    SENIOR_EMPLOYEE = "Senior Employee"
    TEAM_LEAD = "Team Lead"
    MANAGER = "Manager"
    SENIOR_MANAGER = "Senior Manager"
    DIRECTOR = "Director"
    VICE_PRESIDENT = "Vice President"
    C_LEVEL = "C-Level Executive"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    
    # NEW: Enhanced fields
    contact_number = Column(String, nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), index=True, nullable=True)
    position = Column(SQLEnum(Position, values_callable=lambda x: [e.value for e in x], native_enum=False), nullable=False)
    
    # System access control
    role = Column(SQLEnum(UserRole, values_callable=lambda x: [e.value for e in x], native_enum=False), default=UserRole.EMPLOYEE, nullable=False)
    status = Column(SQLEnum(UserStatus, values_callable=lambda x: [e.value for e in x], native_enum=False), default=UserStatus.PENDING, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    approver = relationship("User", remote_side=[id], foreign_keys=[approved_by])
    department = relationship("Department", foreign_keys=[department_id], back_populates="users")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
