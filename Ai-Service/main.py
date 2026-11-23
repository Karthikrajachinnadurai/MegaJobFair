import os
import re
import asyncio
import logging
import threading
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel, field_validator

import auto_sync
from mailer import build_credentials_email, send_one, TEST_EMAIL

load_dotenv()
API_KEY = os.getenv("SERVICE_API_KEY")
AUTO_SYNC_ENABLED = os.getenv("AUTO_SYNC_ENABLED", "true").lower() == "true"
log = logging.getLogger("uvicorn.error")

EMAIL_RE = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.]+$")


# ---------- auto-sync: Google Form -> new students -> QR email ----------
sync_lock = threading.Lock()


def run_sync_safely() -> bool:
    """Run one sync. Skips if another sync is already running."""
    if not sync_lock.acquire(blocking=False):
        log.info("sync already running, skipped this one")
        return False
    try:
        auto_sync.sync_once()
        return True
    except Exception as e:
        log.error("sync error: %s", e)
        return False
    finally:
        sync_lock.release()


async def auto_sync_loop():
    log.info("auto-sync started: checking the sheet every %s s", auto_sync.POLL_SECONDS)
    while True:
        await asyncio.to_thread(run_sync_safely)       # slow work runs in a thread
        await asyncio.sleep(auto_sync.POLL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(auto_sync_loop()) if AUTO_SYNC_ENABLED else None
    yield                                              # the server runs here
    if task:
        task.cancel()                                  # server stopping -> stop the loop


app = FastAPI(title="MegaJobFair AI Service", lifespan=lifespan)


# ---------- shared helpers ----------
def check_key(x_api_key: str | None):
    if not API_KEY or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="invalid API key")


# ---------- login email (called by Java) ----------
class CredentialsRequest(BaseModel):
    email: str
    name: str
    password: str
    loginUrl: str

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("not a valid email address")
        return v


def deliver_credentials(req: CredentialsRequest):
    to = TEST_EMAIL or req.email
    try:
        send_one(build_credentials_email(req.name, to, req.password, req.loginUrl))
        log.info("credentials email sent to %s", to)
    except Exception as e:
        log.error("credentials email FAILED for %s: %s", to, e)


# ---------- endpoints ----------
@app.get("/health")
def health():
    return {"status": "ok", "auto_sync": AUTO_SYNC_ENABLED}


@app.post("/notify/credentials", status_code=202)
def notify_credentials(
    req: CredentialsRequest,
    background: BackgroundTasks,
    x_api_key: str | None = Header(default=None),
):
    check_key(x_api_key)
    background.add_task(deliver_credentials, req)
    return {"status": "queued"}


@app.post("/import/run", status_code=202)
def import_run(background: BackgroundTasks, x_api_key: str | None = Header(default=None)):
    """Admin 'Sync now' button: run the sheet sync immediately instead of waiting."""
    check_key(x_api_key)
    background.add_task(run_sync_safely)
    return {"status": "started"}