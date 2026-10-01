import os
import secrets
from typing import Optional

from dotenv import load_dotenv
from fastapi import Header, HTTPException


def verify_staff_key(
    authorization: Optional[str] = Header(None),
    x_staff_key: Optional[str] = Header(None, alias="x-staff-key"),
) -> None:
    # Ensure environment variables from .env are fresh even if the dev server was started earlier
    load_dotenv(override=True)
    expected_key = os.getenv("STAFF_API_KEY")

    if not expected_key:
        # If no STAFF_API_KEY is configured in the environment, allow access (open local dev mode)
        return

    provided_token: Optional[str] = None
    if x_staff_key:
        provided_token = x_staff_key.strip()
    elif authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            provided_token = parts[1]
        else:
            provided_token = authorization.strip()

    if not provided_token or not secrets.compare_digest(provided_token, expected_key.strip()):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid or missing staff API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
