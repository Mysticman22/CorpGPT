"""Secure OTP utilities — bcrypt hashing, attempt tracking, lockout."""
import secrets
import string
import bcrypt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.otp import OTP
from app.models.user import User
from uuid import UUID

OTP_TTL_MINUTES = 5
MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def _generate_otp() -> str:
    """Cryptographically secure 6-digit OTP."""
    return "".join(secrets.choice(string.digits) for _ in range(6))


def _hash_otp(plain: str) -> str:
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def _verify_otp_hash(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


async def create_otp_record(db: Session, user_id: UUID,
                            ip: str = None, user_agent: str = None) -> tuple[OTP, str]:
    """
    Invalidate old OTPs, generate a new secure OTP, store hashed.
    Returns (otp_record, plain_otp) — plain_otp is sent via email, never stored.
    """
    # Invalidate all existing unused OTPs for this user
    db.query(OTP).filter(OTP.user_id == user_id, OTP.is_used == False).update({"is_used": True})
    db.flush()

    plain_otp = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES)

    record = OTP(
        user_id=user_id,
        hashed_otp=_hash_otp(plain_otp),
        expires_at=expires_at,
        is_used=False,
        attempts=0,
        ip_address=ip,
        user_agent=user_agent,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record, plain_otp


async def verify_otp(db: Session, email: str, otp_code: str) -> User:
    """
    Verify hashed OTP.  Enforces: expiry, lockout, attempt counter.
    Returns the User on success.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    # Get the most recent unused OTP for this user
    record = (
        db.query(OTP)
        .filter(OTP.user_id == user.id, OTP.is_used == False)
        .order_by(OTP.created_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            "No active OTP found. Please request a new one.")

    # Check lockout
    if record.locked_until and datetime.utcnow() < record.locked_until:
        remaining = int((record.locked_until - datetime.utcnow()).total_seconds() // 60)
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                            f"Account locked due to too many attempts. Try again in {remaining} min.")

    # Check expiry
    if datetime.utcnow() > record.expires_at:
        record.is_used = True
        db.commit()
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            "OTP expired. Please request a new one.")

    # Verify hash
    if not _verify_otp_hash(otp_code, record.hashed_otp):
        record.attempts += 1
        if record.attempts >= MAX_ATTEMPTS:
            record.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
            db.commit()
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                                f"Too many failed attempts. Locked for {LOCKOUT_MINUTES} minutes.")
        db.commit()
        remaining = MAX_ATTEMPTS - record.attempts
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            f"Invalid OTP. {remaining} attempt(s) remaining.")

    # ✅ Valid — mark as used
    record.is_used = True
    db.commit()

    return user
