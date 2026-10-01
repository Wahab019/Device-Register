import logging
import os
import secrets
from typing import Optional

from dotenv import load_dotenv
from fastapi import Header, HTTPException

from app.db import supabase

logger = logging.getLogger(__name__)


def verify_staff_key(
    authorization: Optional[str] = Header(None),
    x_staff_key: Optional[str] = Header(None, alias="x-staff-key"),
) -> dict:
    load_dotenv(override=True)
    expected_key = os.getenv("STAFF_API_KEY")

    provided_token: Optional[str] = None
    if x_staff_key:
        provided_token = x_staff_key.strip()
    elif authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            provided_token = parts[1]
        else:
            provided_token = authorization.strip()

    if not provided_token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required: Missing employee access token or staff key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Verify Supabase JWT token
    if supabase is not None:
        try:
            user_res = supabase.auth.get_user(provided_token)
            if user_res and user_res.user:
                return {
                    "id": user_res.user.id,
                    "email": user_res.user.email,
                    "role": "staff",
                }
        except Exception as e:
            logger.debug("Provided token is not a valid Supabase JWT: %s", e)

    # 2. Fallback: match static STAFF_API_KEY
    if expected_key and secrets.compare_digest(provided_token, expected_key.strip()):
        return {
            "id": "staff-key",
            "email": "staff@internal",
            "role": "staff",
        }

    raise HTTPException(
        status_code=401,
        detail="Unauthorized: Invalid employee credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
