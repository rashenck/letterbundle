"""Email service for sending verification emails."""

import base64
import logging
import secrets
import smtplib
import urllib.parse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from pydantic import BaseModel

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmailConfig(BaseModel):
    """Email configuration."""

    smtp_server: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_use_tls: bool = True
    from_email: str | None = None
    frontend_url: str = "http://localhost:3000"


class EmailService:
    """Service for sending emails with SMTP or logging fallback."""

    def __init__(self, config: EmailConfig):
        self.config = config
        self._is_configured = all(
            [
                config.smtp_server,
                config.smtp_port,
                config.smtp_username,
                config.smtp_password,
                config.from_email,
            ]
        )

    def is_configured(self) -> bool:
        """Check if email service is properly configured."""
        return self._is_configured

    def generate_verification_token(self) -> str:
        """Generate a secure verification token."""
        return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()

    def create_verification_url(self, token: str) -> str:
        """Create verification URL."""
        import urllib.parse

        encoded_token = urllib.parse.quote_plus(token)
        return f"{self.config.frontend_url}/verify-email?token={encoded_token}"

    async def send_verification_email(
        self, to_email: str, verification_token: str
    ) -> bool:
        """Send verification email to user."""
        verification_url = self.create_verification_url(verification_token)

        subject = "Verify your LetterBundle account"
        body = f"""
Welcome to LetterBundle!

Please click the link below to verify your email address and activate your account:

{verification_url}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Thanks,
The LetterBundle Team
        """.strip()

        if not self._is_configured:
            # Log verification link for local testing
            logger.warning(
                f"Email not configured. Verification link for {to_email}: {verification_url}"
            )
            return True

        return await self._send_email(to_email, subject, body)

    async def _send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Send email via SMTP."""
        try:
            if not self.config.smtp_server or not self.config.smtp_port:
                return False

            msg = MIMEMultipart()
            msg["To"] = to_email
            msg["Subject"] = subject
            if self.config.from_email:
                msg["From"] = self.config.from_email

            msg.attach(MIMEText(body, "plain"))

            server = smtplib.SMTP(self.config.smtp_server, self.config.smtp_port)
            try:
                if self.config.smtp_use_tls:
                    server.starttls()

                if self.config.smtp_username and self.config.smtp_password:
                    server.login(self.config.smtp_username, self.config.smtp_password)

                server.send_message(msg)
            finally:
                server.quit()

            logger.info(f"Verification email sent to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False


# Global email service instance
_email_service: EmailService | None = None


def get_email_service() -> EmailService:
    """Get or create email service instance."""
    global _email_service

    if _email_service is None:
        settings_obj = get_settings()
        config = EmailConfig(
            smtp_server=getattr(settings_obj, "smtp_server", None),
            smtp_port=getattr(settings_obj, "smtp_port", None),
            smtp_username=getattr(settings_obj, "smtp_username", None),
            smtp_password=getattr(settings_obj, "smtp_password", None),
            smtp_use_tls=getattr(settings_obj, "smtp_use_tls", True),
            from_email=getattr(settings_obj, "from_email", None),
            frontend_url=getattr(settings_obj, "frontend_url", "http://localhost:3000"),
        )
        _email_service = EmailService(config)

    return _email_service
