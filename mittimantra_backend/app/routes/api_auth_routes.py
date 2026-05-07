"""
API Authentication Routes – JSON endpoints for the React frontend
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel, EmailStr, Field

from app.database import get_db
from app.db_models import User, OTPVerification
from app.schemas import UserResponse, ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordOTPRequest
from app.services.email_service import send_otp_email
import random
import string
from datetime import datetime, timezone
from app.auth import (
    get_password_hash,
    create_access_token,
    authenticate_user,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request / Response schemas ─────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=72)  # bcrypt max is 72
    full_name: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def api_register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user and return a JWT token immediately (auto-login).
    """
    # Duplicate username check
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose a different username.",
        )

    # Duplicate email check
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Hash password and create user
    try:
        hashed_password = get_password_hash(user_data.password)
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password. Please try again.",
        )

    new_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        logger.error(f"User creation DB error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create user. Please try again.",
        )

    # Auto-login: issue a token
    access_token = create_access_token(
        data={"sub": new_user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    logger.info(f"New user registered: {new_user.username}")

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "is_active": new_user.is_active,
        },
    )


@router.post("/login", response_model=AuthResponse)
async def api_login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate with username (or email) + password and return a JWT token.
    """
    user = authenticate_user(db, credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    logger.info(f"User logged in: {user.username}")

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
        },
    )


@router.post("/logout")
async def api_logout():
    """
    Logout endpoint – frontend must clear the token from localStorage.
    """
    return {"message": "Logged out successfully. Please clear your local token."}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """
    Return the profile of the currently authenticated user.
    """
    return current_user


@router.post("/forgot-password")
async def api_forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generate an OTP and send it to the user's email for password reset.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal if the email exists or not
        return {"message": "If an account with that email exists, an OTP has been sent."}

    # Generate 6-digit OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    # Invalidate old OTPs
    db.query(OTPVerification).filter(OTPVerification.email == request.email).delete()
    
    # Create new OTP (expires in 15 mins)
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    otp_record = OTPVerification(
        email=request.email,
        otp_code=otp_code,
        expires_at=expires_at
    )
    db.add(otp_record)
    db.commit()
    
    # Send email
    email_sent = send_otp_email(request.email, otp_code)
    if not email_sent:
        logger.error(f"Failed to send OTP email to {request.email}")
        # In production, you might not want to return 500, but for now we do
        raise HTTPException(status_code=500, detail="Failed to send OTP email. Please try again later.")
        
    return {"message": "OTP sent successfully. Please check your email."}


@router.post("/verify-otp")
async def api_verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Verify the OTP for a given email.
    """
    otp_record = db.query(OTPVerification).filter(
        OTPVerification.email == request.email,
        OTPVerification.otp_code == request.otp_code,
        OTPVerification.is_verified == False
    ).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")
        
    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired.")
        
    # Mark as verified
    otp_record.is_verified = True
    db.commit()
    
    return {"message": "OTP verified successfully. You can now reset your password."}


@router.post("/reset-password")
async def api_reset_password(request: ResetPasswordOTPRequest, db: Session = Depends(get_db)):
    """
    Reset password using a verified OTP.
    """
    # Check if OTP was verified
    otp_record = db.query(OTPVerification).filter(
        OTPVerification.email == request.email,
        OTPVerification.otp_code == request.otp_code,
        OTPVerification.is_verified == True
    ).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or unverified OTP.")
        
    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired.")
        
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    
    # Delete the used OTP
    db.delete(otp_record)
    db.commit()
    
    return {"message": "Password reset successfully. You can now log in."}
