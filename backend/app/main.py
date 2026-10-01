import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import verify_staff_key
from app.routes.auth import router as auth_router
from app.routes.devices import router as devices_router
from app.routes.track import router as track_router

app = FastAPI(title="Device Register API")

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "ok"}


# Staff Auth endpoints (login, signup, me)
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# Internal staff endpoints protected by verify_staff_key
app.include_router(
    devices_router,
    prefix="/devices",
    tags=["devices"],
    dependencies=[Depends(verify_staff_key)],
)

# Public customer tracking endpoint (no auth required)
app.include_router(track_router, prefix="/track", tags=["track"])