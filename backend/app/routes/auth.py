import logging
from fastapi import APIRouter, Depends, HTTPException

from app.auth import verify_staff_key
from app.db import supabase
from app.models import AuthResponse, LoginRequest, SignUpRequest, UserOut

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/login", response_model=AuthResponse)
def login_staff(credentials: LoginRequest):
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    email = credentials.email.strip().lower()
    password = credentials.password

    try:
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        if not res.session or not res.user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return AuthResponse(
            access_token=res.session.access_token,
            token_type="bearer",
            user=UserOut(id=res.user.id, email=res.user.email or email),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Staff login failed for %s: %s", email, e)
        error_msg = str(e)
        if "Invalid login credentials" in error_msg:
            raise HTTPException(status_code=401, detail="Invalid email or password") from e
        raise HTTPException(status_code=400, detail=error_msg) from e


@router.post("/signup", response_model=AuthResponse)
def register_staff(credentials: SignUpRequest):
    """Creates a new employee account in Supabase Auth."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    email = credentials.email.strip().lower()
    password = credentials.password

    if len(password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")

    try:
        # Create user via admin API with email auto-confirmed for staff
        admin_res = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
            }
        )
        if not admin_res.user:
            raise HTTPException(status_code=400, detail="Could not create employee account")

        # Automatically sign them in
        sign_in_res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        if not sign_in_res.session or not sign_in_res.user:
            raise HTTPException(status_code=201, detail="Employee account created. Please log in.")

        return AuthResponse(
            access_token=sign_in_res.session.access_token,
            token_type="bearer",
            user=UserOut(id=sign_in_res.user.id, email=sign_in_res.user.email or email),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Staff signup failed for %s: %s", email, e)
        error_msg = str(e)
        if "already registered" in error_msg or "User already exists" in error_msg:
            raise HTTPException(status_code=409, detail="An account with this email already exists") from e
        raise HTTPException(status_code=400, detail=error_msg) from e


@router.get("/me", response_model=UserOut)
def get_current_user(current_user: dict = Depends(verify_staff_key)):
    return UserOut(id=current_user["id"], email=current_user["email"])
