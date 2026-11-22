import gspread
import pandas as pd

# 1. Log in as the service account (the robot account)
gc = gspread.service_account(filename="credentials.json")

# 2. Open your sheet by its ID
SHEET_ID = "1c2CuK1RIpboGpfUdqvUIR609YuUtC-FyvBiQjKUywpU"
sh = gc.open_by_key(SHEET_ID)
ws = sh.sheet1                      # first tab: "Form responses 1"

# 3. Read all rows: each row becomes {header: value}
rows = ws.get_all_records()

# 4. Show it as a table
df = pd.DataFrame(rows)
print(df.columns.tolist())
print(len(df), "rows")
print(df.head())