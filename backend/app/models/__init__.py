# Import all models here so Base.metadata knows about them
from app.models.user import User
from app.models.chat import Conversation
from app.models.otp import OTP
from app.models.department import Department
from app.models.document import Document
from app.models.audit_log import AuditLog, QueryLog
