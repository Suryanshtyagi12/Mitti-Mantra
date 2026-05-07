import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Sends an OTP email to the user for password reset.
    Returns True if successful, False otherwise.
    """
    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASSWORD")

    if not sender_email or not sender_password:
        logger.error("EMAIL_USER or EMAIL_PASSWORD environment variables are not set.")
        # If not configured, we just log the OTP in the console for development purposes
        logger.info(f"DEVELOPMENT MODE: OTP for {to_email} is {otp_code}")
        return True

    subject = "Your Mitti Mantra Password Reset OTP"
    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2e7d32;">Mitti Mantra Password Reset</h2>
        <p>You have requested to reset your password.</p>
        <p>Your One-Time Password (OTP) is: <strong style="font-size: 24px; color: #1b5e20;">{otp_code}</strong></p>
        <p>This OTP is valid for 15 minutes. Do not share it with anyone.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <br>
        <p>Best Regards,</p>
        <p>The Mitti Mantra Team</p>
      </body>
    </html>
    """

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "html"))

    try:
        # Connect to Gmail's SMTP server
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(message)
        server.quit()
        logger.info(f"OTP email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {to_email}: {e}")
        return False
