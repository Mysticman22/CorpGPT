"""Email service — supports SMTP (Gmail/SendGrid) and dev console fallback.

Set these in backend/.env to send real emails:
  MAIL_USERNAME=your@gmail.com
  MAIL_PASSWORD=your_app_password
  MAIL_FROM=your@gmail.com
  MAIL_SERVER=smtp.gmail.com
  MAIL_PORT=587

Leave them empty to use dev fallback (OTP printed to terminal).
"""
import os
from dotenv import load_dotenv

load_dotenv()

_MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
_MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
_MAIL_FROM     = os.getenv("MAIL_FROM", "noreply@nexus.local")
_MAIL_SERVER   = os.getenv("MAIL_SERVER", "smtp.gmail.com")
_MAIL_PORT     = int(os.getenv("MAIL_PORT", 587))

_EMAIL_ENABLED = bool(_MAIL_USERNAME and _MAIL_PASSWORD)

# Only import fastapi_mail if credentials are configured
if _EMAIL_ENABLED:
    from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
    _conf = ConnectionConfig(
        MAIL_USERNAME=_MAIL_USERNAME,
        MAIL_PASSWORD=_MAIL_PASSWORD,
        MAIL_FROM=_MAIL_FROM,
        MAIL_PORT=_MAIL_PORT,
        MAIL_SERVER=_MAIL_SERVER,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )
    _fastmail = FastMail(_conf)
else:
    _fastmail = None


def _otp_html(user_name: str, otp_code: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
<style>
  body {{ font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }}
  .wrap {{ max-width: 560px; margin: 40px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }}
  .header {{ background: linear-gradient(135deg,#4f46e5,#7c3aed); padding: 28px; text-align: center; color: #fff; }}
  .header h1 {{ margin: 0; font-size: 28px; letter-spacing: 2px; }}
  .body {{ padding: 36px 32px; }}
  .otp-box {{ background: #f5f3ff; border: 2px dashed #4f46e5; border-radius: 10px; padding: 24px; text-align: center; margin: 28px 0; }}
  .otp {{ font-size: 38px; font-weight: 900; color: #4f46e5; letter-spacing: 10px; }}
  .footer {{ background: #f9fafb; padding: 18px; text-align: center; color: #9ca3af; font-size: 13px; }}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>NEXUS</h1></div>
  <div class="body">
    <h2 style="margin-top:0">Hi {user_name},</h2>
    <p>Use the code below to complete your NEXUS login. It expires in <strong>5 minutes</strong>.</p>
    <div class="otp-box">
      <p style="margin:0;color:#6b7280;font-size:13px">Your One-Time Password</p>
      <div class="otp">{otp_code}</div>
    </div>
    <p style="color:#6b7280;font-size:13px">Didn't request this? Ignore this email or contact support.</p>
  </div>
  <div class="footer">&copy; 2026 NEXUS. All rights reserved.</div>
</div>
</body>
</html>"""


def _welcome_html(user_name: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head><style>
  body {{ font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0; }}
  .wrap {{ max-width:560px; margin:40px auto; background:#fff; border-radius:10px; overflow:hidden; }}
  .header {{ background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:28px; text-align:center; color:#fff; }}
  .header h1 {{ margin:0; font-size:28px; }}
  .body {{ padding:36px 32px; }}
</style></head>
<body>
<div class="wrap">
  <div class="header"><h1>NEXUS</h1></div>
  <div class="body">
    <h2 style="color:#1e1b4b">Welcome, {user_name}! 🎉</h2>
    <p>Your NEXUS account has been <strong>approved</strong> by an administrator.</p>
    <p>You can now sign in at <a href="http://localhost:5173/login">your workspace</a>.</p>
    <p style="margin-top:32px">— The NEXUS Team</p>
  </div>
</div>
</body>
</html>"""


async def send_otp_email(email: str, otp_code: str, user_name: str = "User"):
    """Send OTP email. Falls back to console if SMTP not configured."""
    if not _EMAIL_ENABLED:
        print(f"  [DEV] Email not configured — OTP for {email}: {otp_code}")
        return

    from fastapi_mail import MessageSchema
    msg = MessageSchema(
        subject="Your NEXUS Login OTP",
        recipients=[email],
        body=_otp_html(user_name, otp_code),
        subtype="html",
    )
    await _fastmail.send_message(msg)


async def send_welcome_email(email: str, user_name: str = "User"):
    """Send welcome email after admin approval."""
    if not _EMAIL_ENABLED:
        print(f"  [DEV] Welcome email would be sent to {email}")
        return

    from fastapi_mail import MessageSchema
    msg = MessageSchema(
        subject="Welcome to NEXUS — Your account is approved!",
        recipients=[email],
        body=_welcome_html(user_name),
        subtype="html",
    )
    await _fastmail.send_message(msg)
