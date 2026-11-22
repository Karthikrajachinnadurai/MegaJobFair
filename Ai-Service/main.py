import os
import logging

from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks, Header, HTTPException

import re
from pydantic import BaseModel, field_validator
from mailer import build_credentials_email, send_one, TEST_EMAIL

load_dotenv()
API_KEY = os.getenv("SERVICE_API_KEY")
log = logging.getLogger("uvicorn.error")

app = FastAPI(title="MegaJobFair AI Service")


EMAIL_RE = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.]+$")


# The exact JSON Java sends (contract 1 in the master plan)
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

# class CredentialsRequest(BaseModel):
#     email: str
#     name: str
#     password: str
#     loginUrl: str


def check_key(x_api_key: str | None):
    if not API_KEY or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="invalid API key")


def deliver_credentials(req: CredentialsRequest):
    """Runs in the background, after the response is already sent to Java."""
    to = TEST_EMAIL or req.email
    try:
        send_one(build_credentials_email(req.name, to, req.password, req.loginUrl))
        log.info("credentials email sent to %s", to)
    except Exception as e:
        log.error("credentials email FAILED for %s: %s", to, e)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/notify/credentials", status_code=202)
def notify_credentials(
    req: CredentialsRequest,
    background: BackgroundTasks,
    x_api_key: str | None = Header(default=None),
):
    check_key(x_api_key)
    background.add_task(deliver_credentials, req)
    return {"status": "queued"}