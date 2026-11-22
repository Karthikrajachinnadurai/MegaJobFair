import os
from dotenv import load_dotenv

load_dotenv()

SHEET_ID = os.getenv("SHEET_ID")

# Real form header -> our column name.
# When the real sheet arrives: change ONLY the left side to its exact headers.
COLUMN_MAP = {
    "Timestamp":            "submitted_at",
    "Name of the college:": "college_name",
    "Name of the student:": "full_name",
    "Education:":           "education",
    "Subject:":             "subject",
    "Year of Passing:":     "year_of_passing",
    "Mobile No:":           "mobile",
    "Email :":              "email",
    "District:":            "district",
}