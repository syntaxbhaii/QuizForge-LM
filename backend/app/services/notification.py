import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.core.config import settings


def send_email(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None
) -> bool:
    """
    Sends an email using the SMTP settings configured in .env.
    Always logs the email content to stdout as a fallback and for local development debugging.
    """
    print(f"\n=================== SIMULATED EMAIL OUTBOX ===================")
    print(f"To: {to_email}")
    print(f"From: {settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>")
    print(f"Subject: {subject}")
    print(f"Body:\n{body_text}")
    print(f"==============================================================\n")

    # If no SMTP_HOST is configured, return True representing successful simulation logging
    if not settings.SMTP_HOST:
        return True

    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = subject

        message.attach(MIMEText(body_text, "plain"))
        if body_html:
            message.attach(MIMEText(body_html, "html"))

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        if settings.SMTP_TLS:
            server.starttls()

        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        server.sendmail(settings.EMAILS_FROM_EMAIL, to_email, message.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"SMTP Error: Failed to send email to {to_email}. Error: {str(e)}")
        return False


def send_registration_welcome_email(email: str, name: str) -> bool:
    subject = f"Welcome to QuizForge, {name}!"
    body_text = (
        f"Hi {name},\n\n"
        f"Welcome to QuizForge - The Next Generation Quiz Management & Online Assessment Platform.\n\n"
        f"You can now log in to your account and explore our quiz collections.\n\n"
        f"Best regards,\n"
        f"The QuizForge Team"
    )
    body_html = (
        f"<h2>Welcome to QuizForge, {name}!</h2>"
        f"<p>Thank you for registering. You can now log in and take quizzes on our platform.</p>"
        f"<br/>"
        f"<p>Best regards,<br/>The QuizForge Team</p>"
    )
    return send_email(email, subject, body_text, body_html)


def send_password_reset_email(email: str, token: str) -> bool:
    subject = "QuizForge - Reset Password Request"
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    body_text = (
        f"Hello,\n\n"
        f"We received a request to reset your QuizForge password. Please use the following link:\n"
        f"{reset_link}\n\n"
        f"If you did not request this, you can ignore this email.\n\n"
        f"Best regards,\n"
        f"The QuizForge Team"
    )
    body_html = (
        f"<h2>Reset Your Password</h2>"
        f"<p>We received a request to reset your QuizForge password. Click the link below to set a new password:</p>"
        f"<p><a href='{reset_link}'>{reset_link}</a></p>"
        f"<p>If you did not request this, please ignore this email.</p>"
        f"<br/>"
        f"<p>Best regards,<br/>The QuizForge Team</p>"
    )
    return send_email(email, subject, body_text, body_html)


def send_quiz_completion_email(email: str, name: str, quiz_title: str, score: float, percentage: float, passed: bool) -> bool:
    status_str = "PASSED" if passed else "FAILED"
    subject = f"Quiz Results: {quiz_title} - {status_str}"
    body_text = (
        f"Hi {name},\n\n"
        f"You have completed the quiz '{quiz_title}'.\n\n"
        f"Score: {score} points\n"
        f"Percentage: {percentage}%\n"
        f"Result: {status_str}\n\n"
        f"You can view your detailed review breakdown and certificates (if passed) on your dashboard.\n\n"
        f"Best regards,\n"
        f"The QuizForge Team"
    )
    body_html = (
        f"<h2>Quiz Attempt Results for {quiz_title}</h2>"
        f"<p>Hi {name},</p>"
        f"<p>You completed the quiz with the following details:</p>"
        f"<ul>"
        f"<li><strong>Score:</strong> {score}</li>"
        f"<li><strong>Percentage:</strong> {percentage}%</li>"
        f"<li><strong>Status:</strong> {status_str}</li>"
        f"</ul>"
        f"<p>View details and certificates on your dashboard.</p>"
        f"<br/>"
        f"<p>Best regards,<br/>The QuizForge Team</p>"
    )
    return send_email(email, subject, body_text, body_html)
