"""Auth router — Phase 2 updated with secure OTP 2FA flow.

Login flow:
  1. POST /api/auth/login        — verify password → create hashed OTP → send email
                                   → return { otp_required: true }
  2. POST /api/auth/verify-otp   — verify hashed OTP, check expiry/attempts/lockout
                                   → return JWT access_token
  3. POST /api/auth/request-otp  — resend OTP (without password re-entry)
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserStatus, Position, UserRole
from app.models.department import Department
from app.auth.schemas import UserRegister, UserLogin, Token, UserResponse, OTPRequest, OTPVerify
from app.auth.utils import get_password_hash, verify_password, create_access_token
from app.auth.otp_utils import create_otp_record, verify_otp
from app.core.email_service import send_otp_email
from app.core.rate_limit import limiter

router = APIRouter()


# ── helpers ───────────────────────────────────────────────────────────────────

def _check_user_active(user: User):
    if user.status == UserStatus.PENDING:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account pending admin approval")
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account has been suspended")
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is not active")


def _dev_print_otp(user: User, plain_otp: str):
    """Always print OTP to terminal in development — safe fallback."""
    print("\n" + "=" * 52)
    print("  [SECURE] NEXUS OTP (dev terminal output)")
    print(f"  User   : {user.full_name} <{user.email}>")
    print(f"  OTP    : {plain_otp}")
    print("  Expiry : 5 minutes")
    print("=" * 52 + "\n")


# ── Register ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=dict)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

    dept_record = db.query(Department).filter(Department.name == user_data.department).first()
    if not dept_record:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Department '{user_data.department}' not found")

    try:
        pos  = Position(user_data.position)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid position")

    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        contact_number=user_data.contact_number,
        department_id=dept_record.id,
        position=pos,
        status=UserStatus.PENDING,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registration successful. Your account is pending admin approval.",
        "user_id": str(new_user.id),
    }


# ── Login — Step 1: password verify → issue OTP ──────────────────────────────

@router.post("/login", response_model=dict)
@limiter.limit("5/minute")
async def login(user_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """
    Step 1 of 2FA:
    - Verify email + password
    - Generate hashed OTP, store to DB
    - Send OTP via email (falls back to terminal print)
    - Returns { otp_required: true } — NOT a JWT token yet
    """
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
        
    if not user.department or user.department.name != user_data.department:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid department")
        
    if user.position.value != user_data.position:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid position")

    _check_user_active(user)

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    _, plain_otp = await create_otp_record(db, user.id, ip=ip, user_agent=ua)

    _dev_print_otp(user, plain_otp)

    # Try to send email — never crash the request if email fails
    if user.email == "mysticeldrago@gmail.com" and user.role == UserRole.SUPER_ADMIN:
        print(f"  [Skipping email for Super Admin {user.email} - OTP logged above]")
    else:
        try:
            await send_otp_email(user.email, plain_otp, user.full_name)
        except Exception as e:
            print(f"  [Email send failed: {e}]")

    return {
        "otp_required": True,
        "message": "OTP sent to your email. Please verify to complete login.",
        "email": user.email,
        "expires_in_minutes": 5,
    }


# ── Login — Step 2: verify OTP → issue JWT ───────────────────────────────────

@router.post("/verify-otp", response_model=Token)
@limiter.limit("5/minute")
async def verify_otp_endpoint(otp_verify: OTPVerify, request: Request, db: Session = Depends(get_db)):
    """
    Step 2 of 2FA:
    - Verify hashed OTP (checks expiry, attempts, lockout)
    - Returns JWT access_token on success
    """
    user = await verify_otp(db, otp_verify.email, otp_verify.otp_code)

    _check_user_active(user)

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ── Resend OTP (no password re-entry needed) ─────────────────────────────────

@router.post("/request-otp", response_model=dict)
@limiter.limit("3/minute")
async def request_otp(otp_request: OTPRequest, request: Request, db: Session = Depends(get_db)):
    """Resend/refresh OTP for a user who is mid-login."""
    user = db.query(User).filter(User.email == otp_request.email).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No account found with this email")

    _check_user_active(user)

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    _, plain_otp = await create_otp_record(db, user.id, ip=ip, user_agent=ua)
    _dev_print_otp(user, plain_otp)

    if user.email == "mysticeldrago@gmail.com" and user.role == UserRole.SUPER_ADMIN:
        print(f"  [Skipping email for Super Admin {user.email} - OTP logged above]")
    else:
        try:
            await send_otp_email(user.email, plain_otp, user.full_name)
        except Exception as e:
            print(f"  [Email send failed: {e}]")

    return {
        "message": "New OTP sent. Check your email or the backend terminal.",
        "expires_in_minutes": 5,
    }
