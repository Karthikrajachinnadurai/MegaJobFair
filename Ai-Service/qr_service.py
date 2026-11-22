import os
import secrets
import qrcode
import pandas as pd

QR_FOLDER = "qr_codes"
STUDENTS_FILE = "clean_students.csv"


import uuid                     # Python's built-in UUID module

def new_token() -> str:
    return str(uuid.uuid4())    # uuid4 = the fully random version; str() makes it text


def make_qr_image(token: str, path: str):
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_M,  # still scans if ~15% is damaged
        box_size=10,
        border=4,
    )
    qr.add_data(token)
    qr.make(fit=True)
    qr.make_image(fill_color="black", back_color="white").save(path)


def generate_all():
    os.makedirs(QR_FOLDER, exist_ok=True)
    df = pd.read_csv(STUDENTS_FILE, dtype=str)

    # Keep existing tokens: re-running must NOT change a QR that was already emailed
    if "qr_token" not in df.columns:
        df["qr_token"] = ""
    df["qr_token"] = df["qr_token"].fillna("")

    created = 0
    for i, row in df.iterrows():
        if not row["qr_token"]:
            df.at[i, "qr_token"] = new_token()
            created += 1

        path = os.path.join(QR_FOLDER, f"{df.at[i, 'qr_token']}.png")
        if not os.path.exists(path):
            make_qr_image(df.at[i, "qr_token"], path)

    df.to_csv(STUDENTS_FILE, index=False)
    print(f"Students: {len(df)} | new tokens: {created} | QR folder: {QR_FOLDER}/")


if __name__ == "__main__":
    generate_all()