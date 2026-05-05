import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from config import settings
from models.models import EmailLog
from sqlalchemy.orm import Session
import os

async def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    db: Session = None,
    email_type: str = "general",
    image_path: str = None
):
    msg = MIMEMultipart("related")
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject

    alt = MIMEMultipart("alternative")
    msg.attach(alt)
    alt.attach(MIMEText(html_body, "html"))

    success = True
    error_msg = None
    try:
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                start_tls=True,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
            )
    except Exception as e:
        success = False
        error_msg = str(e)
        print(f"[Email Error] {e}")

    if db:
        log = EmailLog(
            recipient_email=to_email,
            subject=subject,
            body_preview=html_body[:300],
            email_type=email_type,
            success=success,
            error_msg=error_msg,
        )
        db.add(log)
        db.commit()

    return success

def onboarding_template(name: str, email: str, password: str, company: str) -> str:
    return f"""
    <html><body style="font-family:'Segoe UI',sans-serif;background:#f4f7fb;margin:0;padding:0;">
    <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:40px 32px;text-align:center;">
        <h1 style="color:#e2b04a;margin:0;font-size:28px;letter-spacing:2px;">TRUSTPAY LOANS</h1>
        <p style="color:#a0aec0;margin:8px 0 0;font-size:14px;">Business Partner Portal</p>
      </div>
      <div style="padding:40px 32px;">
        <h2 style="color:#1a1a2e;margin:0 0 8px;">Welcome, {name}! 🎉</h2>
        <p style="color:#4a5568;line-height:1.7;">You have been successfully onboarded as a <strong>Business Partner</strong> with <strong>TrustPay Loans</strong>. We're thrilled to have you on board!</p>
        <div style="background:#f8f9ff;border-left:4px solid #e2b04a;border-radius:8px;padding:20px;margin:24px 0;">
          <h3 style="color:#1a1a2e;margin:0 0 12px;font-size:16px;">Your Login Credentials</h3>
          <p style="margin:4px 0;color:#4a5568;"><strong>Company:</strong> {company or 'N/A'}</p>
          <p style="margin:4px 0;color:#4a5568;"><strong>Email:</strong> {email}</p>
          <p style="margin:4px 0;color:#4a5568;"><strong>Password:</strong> {password}</p>
        </div>
        <p style="color:#4a5568;line-height:1.7;">Please login to your partner portal to view your assigned targets and track your progress. We recommend changing your password after first login.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="{settings.FRONTEND_URL}/login" style="background:linear-gradient(135deg,#e2b04a,#c9953a);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:16px;display:inline-block;">Login to Portal →</a>
        </div>
        <p style="color:#718096;font-size:13px;text-align:center;margin:0;">For any queries, contact your TrustPay relationship manager.</p>
      </div>
      <div style="background:#f8f9ff;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#a0aec0;font-size:12px;margin:0;">© 2026 TrustPay Loans. All rights reserved.</p>
      </div>
    </div>
    </body></html>
    """

def progress_template(name: str, target_title: str, achieved: float, target: float, motivation: str) -> str:
    pct = min(int((achieved / target) * 100), 100) if target > 0 else 0
    return f"""
    <html><body style="font-family:'Segoe UI',sans-serif;background:#f4f7fb;margin:0;padding:0;">
    <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);padding:40px 32px;text-align:center;">
        <h1 style="color:#e2b04a;margin:0;font-size:28px;letter-spacing:2px;">TRUSTPAY LOANS</h1>
        <p style="color:#a0aec0;margin:8px 0 0;">Progress Update 🚀</p>
      </div>
      <div style="padding:40px 32px;">
        <h2 style="color:#1a1a2e;">Great work, {name}!</h2>
        <p style="color:#4a5568;line-height:1.7;">Here's your latest progress on <strong>"{target_title}"</strong>:</p>
        <div style="background:#f8f9ff;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
          <p style="font-size:48px;font-weight:700;color:#e2b04a;margin:0;">{pct}%</p>
          <p style="color:#718096;margin:4px 0;">Achieved: <strong>{achieved:,.0f}</strong> / Target: <strong>{target:,.0f}</strong></p>
          <div style="background:#e2e8f0;border-radius:100px;height:12px;margin:16px 0;overflow:hidden;">
            <div style="background:linear-gradient(90deg,#e2b04a,#f6d365);height:100%;width:{pct}%;border-radius:100px;"></div>
          </div>
        </div>
        <div style="background:#fffbf0;border:1px solid #e2b04a;border-radius:12px;padding:20px;margin:16px 0;">
          <p style="color:#1a1a2e;font-style:italic;line-height:1.7;margin:0;">💡 <strong>Motivation:</strong> {motivation}</p>
        </div>
        <div style="text-align:center;margin:32px 0;">
          <a href="{settings.FRONTEND_URL}/partner/targets" style="background:linear-gradient(135deg,#e2b04a,#c9953a);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:16px;display:inline-block;">View My Targets →</a>
        </div>
      </div>
      <div style="background:#f8f9ff;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#a0aec0;font-size:12px;margin:0;">© 2026 TrustPay Loans. All rights reserved.</p>
      </div>
    </div>
    </body></html>
    """

def reward_template(name: str, target_title: str, reward: str, image_url: str = None) -> str:
    img_section = ""
    if image_url:
        img_section = f"""
        <div style="text-align:center;margin:16px 0;">
            <img src="{image_url}"
                 style="width:100%;max-width:500px;border-radius:12px;
                        display:block;margin:0 auto;"
                 alt="Reward Image" />
        </div>
        """
    return f"""
    <html><body style="font-family:'Segoe UI',sans-serif;background:#f4f7fb;margin:0;padding:0;">
    <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);padding:40px 32px;text-align:center;">
        <h1 style="color:#e2b04a;margin:0;font-size:28px;letter-spacing:2px;">TRUSTPAY LOANS</h1>
        <p style="color:#a0aec0;margin:8px 0 0;">🏆 Target Achieved!</p>
      </div>
      <div style="padding:40px 32px;text-align:center;">
        <div style="font-size:60px;margin-bottom:16px;">🎉</div>
        <h2 style="color:#1a1a2e;font-size:28px;">Congratulations, {name}!</h2>
        <p style="color:#4a5568;line-height:1.7;font-size:16px;">You have successfully achieved your target <strong>"{target_title}"</strong>. This is a remarkable accomplishment!</p>
        {img_section}
        <div style="background:linear-gradient(135deg,#fffbf0,#fff8e1);border:2px solid #e2b04a;border-radius:16px;padding:28px;margin:24px 0;">
          <p style="color:#718096;margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Your Reward</p>
          <h3 style="color:#c9953a;font-size:24px;margin:0;">🌴 {reward}</h3>
        </div>
        <p style="color:#4a5568;line-height:1.7;">Our team will reach out to you shortly with more details about your reward. Keep up the amazing work!</p>
        <div style="margin:32px 0;">
          <a href="{settings.FRONTEND_URL}/partner/targets" style="background:linear-gradient(135deg,#e2b04a,#c9953a);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:16px;display:inline-block;">View My Achievements →</a>
        </div>
      </div>
      <div style="background:#f8f9ff;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#a0aec0;font-size:12px;margin:0;">© 2026 TrustPay Loans. All rights reserved.</p>
      </div>
    </div>
    </body></html>
    """

def target_assigned_template(name: str, title: str, target_value: float, reward: str, end_date: str = None) -> str:
    # ✅ New function — sends email when target is assigned
    deadline = f"<p style='margin:4px 0;color:#4a5568;'><strong>Deadline:</strong> {end_date}</p>" if end_date else ""
    return f"""
    <html><body style="font-family:'Segoe UI',sans-serif;background:#f4f7fb;margin:0;padding:0;">
    <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);padding:40px 32px;text-align:center;">
        <h1 style="color:#e2b04a;margin:0;font-size:28px;letter-spacing:2px;">TRUSTPAY LOANS</h1>
        <p style="color:#a0aec0;margin:8px 0 0;">🎯 New Target Assigned!</p>
      </div>
      <div style="padding:40px 32px;">
        <h2 style="color:#1a1a2e;">Hello, {name}!</h2>
        <p style="color:#4a5568;line-height:1.7;">A new target has been assigned to you. Let's achieve it together!</p>
        <div style="background:#f8f9ff;border-left:4px solid #e2b04a;border-radius:8px;padding:20px;margin:24px 0;">
          <h3 style="color:#1a1a2e;margin:0 0 12px;font-size:16px;">Target Details</h3>
          <p style="margin:4px 0;color:#4a5568;"><strong>Target:</strong> {title}</p>
          <p style="margin:4px 0;color:#4a5568;"><strong>Target Value:</strong> ₹{target_value:,.0f}</p>
          <p style="margin:4px 0;color:#4a5568;"><strong>Reward:</strong> 🏆 {reward}</p>
          {deadline}
        </div>
        <p style="color:#4a5568;line-height:1.7;">Login to your partner portal to track your progress and stay motivated!</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="{settings.FRONTEND_URL}/partner/targets" style="background:linear-gradient(135deg,#e2b04a,#c9953a);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:16px;display:inline-block;">View My Targets →</a>
        </div>
      </div>
      <div style="background:#f8f9ff;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#a0aec0;font-size:12px;margin:0;">© 2026 TrustPay Loans. All rights reserved.</p>
      </div>
    </div>
    </body></html>
    """