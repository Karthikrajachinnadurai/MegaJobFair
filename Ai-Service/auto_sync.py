import os
import time
from datetime import datetime

import pandas as pd

from form_import import read_sheet, clean, remove_duplicates, find_problems
from qr_service import new_token, make_qr_image, QR_FOLDER
from mailer import build_qr_email, send_one, TEST_EMAIL

STATE_FILE = "students_state.csv"   # becomes database tables later
POLL_SECONDS = 60                   # check the sheet every minute
MAX_ATTEMPTS = 3                    # stop retrying an email after 3 failures
COLUMNS = ["email", "full_name", "qr_token", "email_status",
           "attempts", "email_error", "imported_at", "sent_at"]


def log(msg: str):
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


def load_state() -> pd.DataFrame:
    if os.path.exists(STATE_FILE):
        return pd.read_csv(STATE_FILE, dtype=str).fillna("")
    return pd.DataFrame(columns=COLUMNS)


def save_state(state: pd.DataFrame):
    state.to_csv(STATE_FILE, index=False)


def import_new_students(state: pd.DataFrame) -> pd.DataFrame:
    """Read the sheet; add only VALID students we have never seen before."""
    df = remove_duplicates(clean(read_sheet()))
    df["problems"] = df.apply(find_problems, axis=1)
    valid = df[df["problems"] == ""]

    new = valid[~valid["email"].isin(set(state["email"]))]
    os.makedirs(QR_FOLDER, exist_ok=True)

    for _, row in new.iterrows():
        token = new_token()
        make_qr_image(token, os.path.join(QR_FOLDER, f"{token}.png"))
        record = {"email": row["email"], "full_name": row["full_name"], "qr_token": token,
                  "email_status": "PENDING", "attempts": "0", "email_error": "",
                  "imported_at": datetime.now().isoformat(timespec="seconds"), "sent_at": ""}
        state = pd.concat([state, pd.DataFrame([record])], ignore_index=True)
        save_state(state)                       # save after each new student
        log(f"new student: {row['full_name']} <{row['email']}>")

    review = len(df) - len(valid)
    if review:
        log(f"{review} row(s) need review (not imported)")
    return state


def send_pending_emails(state: pd.DataFrame) -> pd.DataFrame:
    """Email every student whose QR hasn't been sent yet (and hasn't failed too often)."""
    todo = state[(state["email_status"] != "SENT")
                 & (state["attempts"].astype(int) < MAX_ATTEMPTS)]

    for i, row in todo.iterrows():
        qr_path = os.path.join(QR_FOLDER, f"{row['qr_token']}.png")
        to = TEST_EMAIL or row["email"]
        state.at[i, "attempts"] = str(int(row["attempts"]) + 1)
        try:
            send_one(build_qr_email(row["full_name"], to, qr_path))
            state.at[i, "email_status"] = "SENT"
            state.at[i, "email_error"] = ""
            state.at[i, "sent_at"] = datetime.now().isoformat(timespec="seconds")
            log(f"QR sent: {row['full_name']} -> {to}")
        except Exception as e:
            state.at[i, "email_status"] = "FAILED"
            state.at[i, "email_error"] = str(e)[:200]
            log(f"QR FAILED: {row['full_name']}: {e}")
        save_state(state)                       # save after every email
    return state


def sync_once():
    state = load_state()
    state = import_new_students(state)
    send_pending_emails(state)


def main():
    log(f"auto-sync started: checking the sheet every {POLL_SECONDS} s"
        + (f" (TEST MODE: all mail to {TEST_EMAIL})" if TEST_EMAIL else ""))
    while True:
        try:
            sync_once()
        except Exception as e:                  # one bad run must not stop the loop
            log(f"sync error: {e}")
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()