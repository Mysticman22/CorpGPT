from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Any
from uuid import UUID


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    contact_number: str
    department: str
    position: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    department: str
    position: str


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerify(BaseModel):
    email: EmailStr
    otp_code: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DepartmentResponse(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    contact_number: str
    department: Optional[DepartmentResponse] = None
    position: str
    role: str
    status: str
    created_at: datetime
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DashboardStatsResponse(BaseModel):
    total_users: int
    active_users: int
    pending_users: int
    suspended_users: int
    total_admins: int


# ── Admin action schemas ──────────────────────────────────────────────────────

class ChatMessageResponse(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationLogResponse(BaseModel):
    id: str
    title: str
    user_name: str
    user_email: str
    created_at: datetime
    messages: List[ChatMessageResponse]

    class Config:
        from_attributes = True

class RejectUserRequest(BaseModel):
    reason: Optional[str] = None


class RoleChangeRequest(BaseModel):
    role: str  # "USER" or "ADMIN"


class PaginatedUsersResponse(BaseModel):
    total: int
    page: int
    page_size: int
    users: List[UserResponse]


class AuditLogResponse(BaseModel):
    id: UUID
    actor_id: Optional[UUID] = None
    action_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    description: Optional[str] = None
    metadata_: Optional[Any] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
