from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.user import UserCreate, UserResponse
from app.services.notification import send_registration_welcome_email, send_password_reset_email

router = APIRouter()


@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """
    Register a new student user.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email address already exists.",
        )
    
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role="student",
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Send email notification asynchronously/simulated
    send_registration_welcome_email(db_user.email, db_user.full_name)
    
    return db_user


@router.post("/login", response_model=Token)
def login(login_in: LoginRequest, db: Session = Depends(get_db)) -> Any:
    """
    Standard JSON login.
    """
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_role=user.role,
        user_name=user.full_name
    )


@router.post("/login-oauth2", response_model=Token)
def login_oauth2(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login for Swagger.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_role=user.role,
        user_name=user.full_name
    )


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)) -> Any:
    """
    Trigger forgot password flow, sending an email reset link.
    """
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Prevent user enumeration by acting successful
        return {"message": "If the email exists, a reset link has been sent."}
        
    # Generate short-lived reset token (15 mins)
    expire = timedelta(minutes=15)
    reset_token = create_access_token(subject=f"reset:{user.email}", expires_delta=expire)
    
    send_password_reset_email(user.email, reset_token)
    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)) -> Any:
    """
    Verify reset token and update user password.
    """
    try:
        payload = jwt.decode(
            req.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        subject: str = payload.get("sub")
        if not subject or not subject.startswith("reset:"):
            raise HTTPException(status_code=400, detail="Invalid token")
        email = subject.replace("reset:", "")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password reset successfully. You can now log in."}
