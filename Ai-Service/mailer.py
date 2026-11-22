import os
import time
import smtplib
from email.message import EmailMessage

import pandas as pd
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
TEST_EMAIL = os.getenv("TEST_EMAIL")   # if set, ALL emails go here instead of students

STUDENTS_FILE = "clean_students.csv"
QR_FOLDER = "qr_codes"
MAX_RETRIES = 3


def build_qr_email(name: str, to: str, qr_path: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = "Your Mega Job Fair Entry Pass"
    msg["From"] = SMTP_USER
    msg["To"] = to
    msg.set_content(
        f"Dear {name},\n\n"
        "Thank you for registering for the Mega Job Fair.\n"
        "Your entry QR code is attached. Show it at the entrance gate.\n\n"
        "Do not share this QR with anyone. It works only once for your entry.\n\n"
        "Regards,\nMega Job Fair Team"
    )
    with open(qr_path, "rb") as f:
        msg.add_attachment(f.read(), maintype="image", subtype="png",
                           filename="entry_pass.png")
    return msg


def send_with_retry(server, msg: EmailMessage):
    """Try up to MAX_RETRIES times, waiting longer after each failure."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            server.send_message(msg)
            return
        except smtplib.SMTPException:
            if attempt == MAX_RETRIES:
                raise
            time.sleep(2 ** attempt)          # wait 2s, then 4s


def send_all():
    if not SMTP_USER or not SMTP_PASSWORD:
        raise SystemExit("SMTP_USER / SMTP_PASSWORD missing in .env")

    df = pd.read_csv(STUDENTS_FILE, dtype=str)
    for col in ("email_status", "email_error"):
        if col not in df.columns:
            df[col] = ""
    df = df.fillna("")

    if TEST_EMAIL:
        print(f"TEST MODE: all emails go to {TEST_EMAIL}")

    sent = failed = skipped = 0
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()                     # encrypt the connection
        server.login(SMTP_USER, SMTP_PASSWORD)

        for i, row in df.iterrows():
            if row["email_status"] == "SENT":     # never email the same student twice
                skipped += 1
                continue

            qr_path = os.path.join(QR_FOLDER, f"{row['qr_token']}.png")
            to = TEST_EMAIL or row["email"]

            try:
                send_with_retry(server, build_qr_email(row["full_name"], to, qr_path))
                df.at[i, "email_status"] = "SENT"
                df.at[i, "email_error"] = ""
                sent += 1
                print(f"  sent -> {row['full_name']} ({to})")
            except Exception as e:
                df.at[i, "email_status"] = "FAILED"
                df.at[i, "email_error"] = str(e)[:200]
                failed += 1
                print(f"  FAILED -> {row['full_name']}: {e}")

            df.to_csv(STUDENTS_FILE, index=False)  # save after EVERY student

    print(f"Sent: {sent} | Failed: {failed} | Already sent (skipped): {skipped}")


if __name__ == "__main__":
    send_all()