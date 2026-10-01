import logging
import os
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
import httpx

from app.auth import verify_staff_key
from app.models import AuthResponse, LoginRequest, SignUpRequest, UserOut

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_supabase_config():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise HTTPException(status_code=500, detail="Database credentials are not configured")
    return url.rstrip("/"), key


@router.post("/login", response_model=AuthResponse)
def login_staff(credentials: LoginRequest):
    url, service_key = _get_supabase_config()
    email = credentials.email.strip().lower()
    password = credentials.password

    try:
        response = httpx.post(
            f"{url}/auth/v1/token?grant_type=password",
            headers={
                "apikey": service_key,
                "Content-Type": "application/json",
            },
            json={
                "email": email,
                "password": password,
            },
            timeout=10.0,
        )

        if response.status_code == 200:
            data = response.json()
            user_data = data.get("user") or {}
            return AuthResponse(
                access_token=data["access_token"],
                token_type=data.get("token_type", "bearer"),
                user=UserOut(
                    id=user_data.get("id", ""),
                    email=user_data.get("email", email),
                ),
            )

        err_data = response.json()
        error_description = (
            err_data.get("error_description")
            or err_data.get("msg")
            or "Invalid email or password"
        )
        raise HTTPException(status_code=401, detail=error_description)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Login request exception for %s: %s", email, e)
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/signup", response_model=AuthResponse)
def register_staff(
    credentials: SignUpRequest,
    authorization: Optional[str] = Header(None),
    x_staff_key: Optional[str] = Header(None, alias="x-staff-key"),
):
    """Creates a new employee account using Supabase Auth admin API statelessly.
    Requires a valid staff registration invite code or an active staff session.
    """
    expected_code = os.getenv("STAFF_REGISTRATION_KEY") or os.getenv("STAFF_API_KEY")
    if not expected_code:
        raise HTTPException(
            status_code=403,
            detail="Staff self-registration is disabled. Please contact administrator.",
        )

    is_authorized = False
    provided_invite = credentials.invite_code.strip() if credentials.invite_code else ""

    # 1. Check if invite code matches
    if secrets.compare_digest(provided_invite, expected_code.strip()):
        is_authorized = True

    # 2. Check if an existing logged-in staff member is creating the account
    if not is_authorized and (authorization or x_staff_key):
        try:
            verify_staff_key(authorization=authorization, x_staff_key=x_staff_key)
            is_authorized = True
        except HTTPException:
            pass

    if not is_authorized:
        raise HTTPException(
            status_code=403,
            detail="Invalid staff invite code. A valid code is required to register.",
        )

    url, service_key = _get_supabase_config()
    email = credentials.email.strip().lower()
    password = credentials.password

    if len(password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")

    try:
        # 1. Create the user using admin API (auto-confirms email for staff)
        create_res = httpx.post(
            f"{url}/auth/v1/admin/users",
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
            },
            json={
                "email": email,
                "password": password,
                "email_confirm": True,
            },
            timeout=10.0,
        )

        if create_res.status_code not in (200, 201):
            err_data = create_res.json()
            msg = err_data.get("msg") or err_data.get("error_description") or "Could not create user"
            if "already been registered" in msg or err_data.get("error_code") == "email_exists":
                raise HTTPException(
                    status_code=409,
                    detail="An account with this email already exists",
                )
            raise HTTPException(status_code=create_res.status_code, detail=msg)

        user_info = create_res.json()

        # 2. Automatically log them in to return session token
        login_res = httpx.post(
            f"{url}/auth/v1/token?grant_type=password",
            headers={
                "apikey": service_key,
                "Content-Type": "application/json",
            },
            json={
                "email": email,
                "password": password,
            },
            timeout=10.0,
        )

        if login_res.status_code == 200:
            login_data = login_res.json()
            return AuthResponse(
                access_token=login_data["access_token"],
                token_type=login_data.get("token_type", "bearer"),
                user=UserOut(
                    id=user_info.get("id", ""),
                    email=user_info.get("email", email),
                ),
            )

        # Fallback if auto-login returns a prompt to manually log in
        raise HTTPException(
            status_code=201,
            detail="Employee account created successfully! Please sign in.",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Signup request exception for %s: %s", email, e)
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/me", response_model=UserOut)
def get_current_user(current_user: dict = Depends(verify_staff_key)):
    return UserOut(id=current_user["id"], email=current_user["email"])
