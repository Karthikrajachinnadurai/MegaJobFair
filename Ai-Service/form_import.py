import re
import gspread
import pandas as pd
from config import SHEET_ID, COLUMN_MAP
pd.set_option("display.width", 200)
pd.set_option("display.max_columns", None)




# Known spellings -> one standard value
EDUCATION_MAP = {"BE": "B.E", "BTECH": "B.Tech", "BSC": "B.Sc", "ME": "M.E", "MBA": "MBA"}
SUBJECT_MAP = {"COMPUTERSCIENCE": "CSE", "AI&DS": "AIDS", "AIANDDS": "AIDS"}

EMAIL_RE = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.]+$")
MOBILE_RE = re.compile(r"^[6-9]\d{9}$")


# ---------- 1. READ ----------
def read_sheet() -> pd.DataFrame:
    gc = gspread.service_account(filename="credentials.json")
    ws = gc.open_by_key(SHEET_ID).sheet1
    df = pd.DataFrame(ws.get_all_records())

    missing = set(COLUMN_MAP) - set(df.columns)
    if missing:
        raise ValueError(
            f"Sheet is missing these columns: {missing}\n"
            f"Sheet has: {list(df.columns)}\n"
            f"Update COLUMN_MAP in config.py"
        )
    return df.rename(columns=COLUMN_MAP)[list(COLUMN_MAP.values())]
# ---------- 2. CLEAN EACH FIELD ----------
def clean_text(v) -> str:
    """Strip spaces at the ends and collapse double spaces inside."""
    return re.sub(r"\s+", " ", str(v)).strip()

def smart_title(v) -> str:
    """Title-case each word, but keep words typed in ALL CAPS (PSG, CMS, NIT)."""
    words = clean_text(v).split(" ")
    return " ".join(w if w.isupper() and len(w) > 1 else w.capitalize() for w in words)
def clean_mobile(v) -> str:
    digits = re.sub(r"\D", "", str(v))           # keep digits only
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]                       # +91 98765...
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]                       # 098765...
    return digits

def clean_education(v) -> str:
    key = re.sub(r"[\s.]", "", str(v)).upper()   # "B e" / "be" / "B.E" -> "BE"
    return EDUCATION_MAP.get(key, clean_text(v))

def clean_subject(v) -> str:
    key = re.sub(r"\s", "", str(v)).upper()      # "cse" -> "CSE"
    return SUBJECT_MAP.get(key, key)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["full_name"]    = df["full_name"].map(clean_text).str.title()
    df["college_name"] = df["college_name"].map(smart_title)
    df["district"]     = df["district"].map(smart_title)
    df["email"]        = df["email"].map(clean_text).str.lower()
    df["mobile"]       = df["mobile"].map(clean_mobile)
    df["education"]    = df["education"].map(clean_education)
    df["subject"]      = df["subject"].map(clean_subject)
    df["year_of_passing"] = pd.to_numeric(df["year_of_passing"], errors="coerce")
    df["submitted_at"] = pd.to_datetime(df["submitted_at"], dayfirst=True)
    return df


# ---------- 3. VALIDATE ----------
def find_problems(row) -> str:
    problems = []
    if not EMAIL_RE.match(row["email"]):
        problems.append("invalid email")
    if not MOBILE_RE.match(row["mobile"]):
        problems.append(f"invalid mobile '{row['mobile']}'")
    if pd.isna(row["year_of_passing"]) or not 2020 <= row["year_of_passing"] <= 2030:
        problems.append("invalid year")
    if not row["full_name"]:
        problems.append("missing name")
    return "; ".join(problems)


# ---------- 4. DUPLICATES ----------
def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    # Same email submitted twice -> keep the LATEST submission
    df = df.sort_values("submitted_at")
    return df.drop_duplicates(subset="email", keep="last")


# ---------- RUN ----------
def run():
    raw = read_sheet()
    df = clean(raw)
    df = remove_duplicates(df)

    df["problems"] = df.apply(find_problems, axis=1)

    # Same mobile, different email -> import, but warn the admin
    df["warning"] = ""
    dup_mobile = df["mobile"].duplicated(keep=False) & (df["mobile"] != "")
    df.loc[dup_mobile, "warning"] = "mobile shared with another student"

    review = df[df["problems"] != ""]
    clean_rows = df[df["problems"] == ""]

    clean_rows.to_csv("clean_students.csv", index=False)
    review.to_csv("needs_review.csv", index=False)

    print(f"Raw rows: {len(raw)} | after dedupe: {len(df)}")
    print(f"Clean: {len(clean_rows)} | Needs review: {len(review)}")
    print("\n--- NEEDS REVIEW ---")
    print(review[["full_name", "email", "mobile", "problems"]])
    print("\n--- WARNINGS ---")
    print(df[df["warning"] != ""][["full_name", "email", "mobile", "warning"]])
    print("\n--- CLEAN SAMPLE ---")
    print(clean_rows[["full_name", "college_name", "education", "subject", "district"]])


if __name__ == "__main__":
    run()