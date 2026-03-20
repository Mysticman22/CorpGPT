"""Extended Admin Router – Phase 3
Endpoints:
  GET  /api/admin/metrics
  GET  /api/admin/users               ?search, status, page, page_size
  POST /api/admin/users/{id}/approve
  POST /api/admin/users/{id}/reject   body: { reason }
  POST /api/admin/users/{id}/suspend
  POST /api/admin/users/{id}/activate
  PATCH /api/admin/users/{id}/role    body: { role }
  POST /api/admin/users/{id}/force-logout
  GET  /api/admin/audit-logs          ?action, from_date, to_date, page, page_size
  GET  /api/admin/pending-users
  GET  /api/admin/department-chat-logs
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.core.database import get_db
from app.models.user import User, UserStatus, UserRole
from app.models.audit_log import AuditLog
from app.models.chat import Conversation, Message
from app.auth.schemas import (
    UserResponse, DashboardStatsResponse, AuditLogResponse,
    PaginatedUsersResponse, RejectUserRequest, RoleChangeRequest,
    ConversationLogResponse
)
from app.auth.utils import require_super_admin, require_department_admin
from datetime import datetime
from typing import List, Optional
from uuid import UUID
import csv, io

router = APIRouter()


# ── helpers ───────────────────────────────────────────────────────────────────

def _write_audit(db: Session, actor: User, action: str, entity_type: str,
                 entity_id: str, description: str, metadata: dict = None,
                 request: Request = None):
    ip = request.client.host if request else None
    log = AuditLog(
        actor_id=actor.id,
        action_type=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        description=description,
        metadata_=metadata or {},
        ip_address=ip,
    )
    db.add(log)
    db.flush()


def _get_user_or_404(db: Session, user_id: UUID) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ── metrics ───────────────────────────────────────────────────────────────────

@router.get("/metrics", response_model=DashboardStatsResponse)
def get_dashboard_metrics(
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    total = db.query(User).count()
    active = db.query(User).filter(User.status == UserStatus.ACTIVE).count()
    pending = db.query(User).filter(User.status == UserStatus.PENDING).count()
    suspended = db.query(User).filter(User.status == UserStatus.SUSPENDED).count()
    admins = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).count()
    return DashboardStatsResponse(
        total_users=total, active_users=active, pending_users=pending,
        suspended_users=suspended, total_admins=admins,
    )

@router.get("/dashboard/charts")
def get_dashboard_charts(
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    # Retrieve user growth over time
    # This is a simplified chart aggregation strategy grouping by day
    results = db.query(
        func.date(User.created_at).label("date"),
        func.count(User.id).label("count")
    ).group_by(func.date(User.created_at)).all()
    
    user_growth = [{"date": str(r.date), "count": r.count} for r in results]
    
    # Audit events over time, counting security actions
    audit_results = db.query(
        func.date(AuditLog.created_at).label("date"),
        func.count(AuditLog.id).label("count")
    ).group_by(func.date(AuditLog.created_at)).all()
    
    activity_logs = [{"date": str(r.date), "count": r.count} for r in audit_results]

    return {
        "user_growth": user_growth,
        "activity_logs": activity_logs
    }


# ── users – list ──────────────────────────────────────────────────────────────

@router.get("/users", response_model=PaginatedUsersResponse)
def list_users(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(User)
    if search:
        q = q.filter(or_(
            User.email.ilike(f"%{search}%"),
            User.full_name.ilike(f"%{search}%"),
        ))
    if status:
        q = q.filter(User.status == status.upper())
    total = q.count()
    users = q.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedUsersResponse(total=total, page=page, page_size=page_size, users=users)


@router.get("/users/all", response_model=List[UserResponse])
def get_all_users(current_admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return db.query(User).all()


@router.get("/pending-users", response_model=List[UserResponse])
def get_pending_users(current_admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return db.query(User).filter(User.status == UserStatus.PENDING).all()


# ── approve ───────────────────────────────────────────────────────────────────

@router.post("/users/{user_id}/approve")
def approve_user(
    user_id: UUID, request: Request,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, user_id)
    if user.status != UserStatus.PENDING:
        raise HTTPException(400, f"User is already {user.status.value}")
    user.status = UserStatus.ACTIVE
    user.approved_at = datetime.utcnow()
    user.approved_by = current_admin.id
    _write_audit(db, current_admin, "APPROVE_USER", "user", str(user_id),
                 f"Approved {user.email}", request=request)
    db.commit()
    return {"message": f"User {user.email} approved", "user_id": str(user_id)}


# ── reject ────────────────────────────────────────────────────────────────────

@router.post("/users/{user_id}/reject")
def reject_user(
    user_id: UUID, body: RejectUserRequest, request: Request,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, user_id)
    if user.status not in (UserStatus.PENDING, UserStatus.ACTIVE):
        raise HTTPException(400, "Cannot reject this user")
    email = user.email
    _write_audit(db, current_admin, "REJECT_USER", "user", str(user_id),
                 f"Rejected {email}: {body.reason or '—'}",
                 metadata={"reason": body.reason}, request=request)
    db.delete(user)
    db.commit()
    return {"message": f"User {email} rejected and removed"}


# ── suspend / activate ────────────────────────────────────────────────────────

@router.post("/users/{user_id}/suspend")
def suspend_user(
    user_id: UUID, request: Request,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, user_id)
    if user.role in (UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN):
        raise HTTPException(400, "Cannot suspend admin users")
    user.status = UserStatus.SUSPENDED
    _write_audit(db, current_admin, "SUSPEND_USER", "user", str(user_id),
                 f"Suspended {user.email}", request=request)
    db.commit()
    return {"message": f"User {user.email} suspended"}


@router.post("/users/{user_id}/activate")
def activate_user(
    user_id: UUID, request: Request,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, user_id)
    if user.status != UserStatus.SUSPENDED:
        raise HTTPException(400, "User is not suspended")
    user.status = UserStatus.ACTIVE
    _write_audit(db, current_admin, "ACTIVATE_USER", "user", str(user_id),
                 f"Re-activated {user.email}", request=request)
    db.commit()
    return {"message": f"User {user.email} re-activated"}


# ── role change ───────────────────────────────────────────────────────────────

@router.patch("/users/{user_id}/role")
def change_role(
    user_id: UUID, body: RoleChangeRequest, request: Request,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, user_id)
    old_role = user.role.value

    # SUPER_ADMIN is a singleton — can only be set via the database directly
    if body.role.upper() == "SUPER_ADMIN":
        raise HTTPException(403, "SUPER_ADMIN role cannot be assigned through the API. There is only one Super Admin.")

    try:
        user.role = UserRole(body.role.upper())
    except ValueError:
        raise HTTPException(400, f"Invalid role: {body.role}")
    _write_audit(db, current_admin, "CHANGE_ROLE", "user", str(user_id),
                 f"Changed {user.email} role {old_role} → {body.role.upper()}",
                 metadata={"old_role": old_role, "new_role": body.role.upper()},
                 request=request)
    db.commit()
    return {"message": f"Role updated to {body.role.upper()}", "user_id": str(user_id)}


# ── force logout ──────────────────────────────────────────────────────────────

@router.post("/users/{user_id}/force-logout")
def force_logout(
    user_id: UUID, request: Request,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, user_id)
    # Mark a last_logout_at timestamp; JWT middleware should reject tokens issued before this
    user.approved_at = datetime.utcnow()  # reuse field as last_invalidated_at (simple approach)
    _write_audit(db, current_admin, "FORCE_LOGOUT", "user", str(user_id),
                 f"Force-logged-out {user.email}", request=request)
    db.commit()
    return {"message": f"Force logout triggered for {user.email}"}


# ── audit logs ────────────────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    export: bool = Query(False),
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action_type.ilike(f"%{action}%"))
    if from_date:
        q = q.filter(AuditLog.created_at >= datetime.fromisoformat(from_date))
    if to_date:
        q = q.filter(AuditLog.created_at <= datetime.fromisoformat(to_date))
    logs = q.order_by(desc(AuditLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    if export:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "actor_id", "action_type", "entity_type",
                         "entity_id", "description", "ip_address", "created_at"])
        for log in logs:
            writer.writerow([log.id, log.actor_id, log.action_type, log.entity_type,
                             log.entity_id, log.description, log.ip_address, log.created_at])
        output.seek(0)
        return StreamingResponse(output, media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=audit_logs.csv"})
    return logs


# ── department chat logs ──────────────────────────────────────────────────────

@router.get("/department-chat-logs", response_model=List[ConversationLogResponse])
def get_department_chat_logs(
    current_admin: User = Depends(require_department_admin),
    db: Session = Depends(get_db)
):
    """
    Returns the chat history for all users within the admin's department.
    Super Admins can see all chats globally.
    """
    q = db.query(Conversation).join(User, Conversation.user_id == User.id)

    # If the user is a Department Admin, restrict to their department only
    if current_admin.role != UserRole.SUPER_ADMIN:
        q = q.filter(User.department_id == current_admin.department_id)

    conversations = q.order_by(desc(Conversation.created_at)).all()

    # Format the response
    results = []
    for conv in conversations:
        # Sort messages by creation time
        sorted_messages = sorted(conv.messages, key=lambda m: m.created_at)
        
        results.append(
            ConversationLogResponse(
                id=str(conv.id),
                title=conv.title,
                user_name=conv.user.full_name,
                user_email=conv.user.email,
                created_at=conv.created_at,
                messages=[{
                    "role": m.role.value,
                    "content": m.content,
                    "created_at": m.created_at
                } for m in sorted_messages]
            )
        )
        
    return results
