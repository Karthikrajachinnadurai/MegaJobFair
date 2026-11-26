import os
import time
from datetime import datetime

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import text

from db import engine
from form_import import read_sheet, clean, find_problems
from qr_service import new_token, make_qr_image, QR_FOLDER
from mailer import build_qr_email, send_one, TEST_EMAIL

load_dotenv()
POLL_SECONDS = int(os.getenv("POLL_SECONDS", "15"))   # how often to check the sheet
MAX_ATTEMPTS = 3                                      # stop retrying an email after 3 failures
TIMEZONE = "Asia/Kolkata"                             # Google Form timestamps are Indian time

_last_counts = None


def log(msg: str):
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


def none_if_missing(v):
    """pandas uses NaN/NaT for 'missing'; the database wants None (NULL)."""
    return None if pd.isna(v) else v


# ---------- STEP 1: sheet -> form_responses (every row, good or bad) ----------
SAVE_RESPONSE = text("""
    INSERT INTO form_responses
        (submitted_at, email_raw, email, full_name, college_name, education, subject,
         year_of_passing, mobile, district, status, problems)
    VALUES
        (:submitted_at, :email_raw, :email, :full_name, :college_name, :education, :subject,
         :year_of_passing, :mobile, :district, :status, :problems)
    ON CONFLICT (submitted_at, email_raw) DO NOTHING
""")

MARK_OLDER_DUPLICATES = text("""
    UPDATE form_responses old
    SET status = 'DUPLICATE'
    WHERE old.status = 'VALID'
      AND EXISTS (SELECT 1 FROM form_responses newer
                  WHERE newer.email = old.email
                    AND newer.status = 'VALID'
                    AND newer.submitted_at > old.submitted_at)
""")


def save_sheet_rows(conn) -> int:
    raw = read_sheet()
    df = clean(raw)
    df["email_raw"] = raw["email"].astype(str)              # exactly what was typed
    df["problems"] = df.apply(find_problems, axis=1)
    df["status"] = df["problems"].map(lambda p: "NEEDS_REVIEW" if p else "VALID")
    df["submitted_at"] = df["submitted_at"].dt.tz_localize(TIMEZONE)

    rows = [{k: none_if_missing(v) for k, v in r.items()}
            for r in df.to_dict("records")]
    inserted = 0
    for r in rows:
        if r["submitted_at"] is None:                       # no timestamp = can't identify the row
            continue
        inserted += conn.execute(SAVE_RESPONSE, r).rowcount  # 1 = new row, 0 = already saved
    conn.execute(MARK_OLDER_DUPLICATES)
    return inserted


# ---------- STEP 2: VALID responses -> Arun's students table ----------
PENDING_IMPORTS = text("""
    SELECT id, email, full_name, subject, mobile
    FROM form_responses
    WHERE status = 'VALID' AND student_id IS NULL
    ORDER BY submitted_at
""")

UPSERT_STUDENT = text("""
    INSERT INTO students (name, email, department, phone, qr_token)
    VALUES (:name, :email, :department, :phone, :qr_token)
    ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name, department = EXCLUDED.department, phone = EXCLUDED.phone
    RETURNING id, (xmax = 0) AS created
""")

LINK_RESPONSE = text("UPDATE form_responses SET student_id = :sid WHERE id = :rid")

CREATE_QR_JOB = text("""
    INSERT INTO email_jobs (student_id, kind) VALUES (:sid, 'QR_PASS')
    ON CONFLICT (student_id, kind) DO NOTHING
""")
# Students added by the admin in the frontend (Java) never pass through the form,
# so they have no QR job yet. Give every student without one a QR_PASS job.
QR_JOBS_FOR_ADMIN_ADDED = text("""
    INSERT INTO email_jobs (student_id, kind)
    SELECT s.id, 'QR_PASS'
    FROM students s
    WHERE NOT EXISTS (SELECT 1 FROM email_jobs j
                      WHERE j.student_id = s.id AND j.kind = 'QR_PASS')
    ON CONFLICT (student_id, kind) DO NOTHING
""")

def import_students(conn) -> int:
    created = 0
    for r in conn.execute(PENDING_IMPORTS).mappings().all():
        sid, is_new = conn.execute(UPSERT_STUDENT, {
            "name": r["full_name"], "email": r["email"], "department": r["subject"],
            "phone": r["mobile"], "qr_token": new_token(),   # only used if the student is new
        }).one()
        conn.execute(LINK_RESPONSE, {"sid": sid, "rid": r["id"]})
        conn.execute(CREATE_QR_JOB, {"sid": sid})
        if is_new:
            created += 1
            log(f"new student: {r['full_name']} <{r['email']}>")

    # Runs on EVERY sync, not only when a new form row arrives:
    # students added by the admin in the frontend get their QR email too.
    added = conn.execute(QR_JOBS_FOR_ADMIN_ADDED).rowcount
    if added:
        log(f"{added} admin-added student(s) queued for a QR email")
    return created



# ---------- STEP 3: send QR emails that are not SENT yet ----------
PENDING_EMAILS = text("""
    SELECT j.id, s.name, s.email, s.qr_token, j.attempts
    FROM email_jobs j JOIN students s ON s.id = j.student_id
    WHERE j.kind = 'QR_PASS' AND j.status <> 'SENT' AND j.attempts < :max
    ORDER BY j.id
""")

MARK_SENT = text("""
    UPDATE email_jobs SET status = 'SENT', attempts = attempts + 1,
                          last_error = NULL, sent_at = now()
    WHERE id = :id
""")

MARK_FAILED = text("""
    UPDATE email_jobs SET status = 'FAILED', attempts = attempts + 1, last_error = :err
    WHERE id = :id
""")


def send_pending_emails():
    with engine.connect() as conn:
        jobs = conn.execute(PENDING_EMAILS, {"max": MAX_ATTEMPTS}).mappings().all()

    for job in jobs:
        qr_path = os.path.join(QR_FOLDER, f"{job['qr_token']}.png")
        if not os.path.exists(qr_path):                     # draw the QR from the saved token
            os.makedirs(QR_FOLDER, exist_ok=True)
            make_qr_image(job["qr_token"], qr_path)
        to = TEST_EMAIL or job["email"]
        try:
            send_one(build_qr_email(job["name"], to, qr_path))
            with engine.begin() as conn:                     # record each result immediately
                conn.execute(MARK_SENT, {"id": job["id"]})
            log(f"QR sent: {job['name']} -> {to}")
        except Exception as e:
            with engine.begin() as conn:
                conn.execute(MARK_FAILED, {"id": job["id"], "err": str(e)[:500]})
            log(f"QR FAILED: {job['name']}: {e}")


# ---------- one full sync ----------
def sync_once():
    global _last_counts
    with engine.begin() as conn:                 # steps 1 + 2: one transaction, all or nothing
        new_rows = save_sheet_rows(conn)
        import_students(conn)
        review = conn.execute(text(
            "SELECT count(*) FROM form_responses WHERE status = 'NEEDS_REVIEW'")).scalar()

    if new_rows or review != _last_counts:
        log(f"{new_rows} new form row(s) saved | {review} need review")
        _last_counts = review

    send_pending_emails()                        # step 3: outside the transaction (slow network)


def main():
    log(f"auto-sync started: checking the sheet every {POLL_SECONDS} s"
        + (f" (TEST MODE: all mail to {TEST_EMAIL})" if TEST_EMAIL else ""))
    while True:
        try:
            sync_once()
        except Exception as e:                   # one bad run must not stop the loop
            log(f"sync error: {e}")
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()