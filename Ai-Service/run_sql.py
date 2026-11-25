import sys
from db import engine

# Usage: uv run run_sql.py sql/001_python_tables.sql
path = sys.argv[1]
with open(path, encoding="utf-8") as f:
    sql = f.read()

with engine.begin() as conn:          # begin() = one transaction: all or nothing
    conn.exec_driver_sql(sql)

print(f"Ran {path} successfully")