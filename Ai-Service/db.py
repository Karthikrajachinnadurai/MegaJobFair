import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"), pool_pre_ping=True)


if __name__ == "__main__":
    # Quick connection test: uv run db.py
    with engine.connect() as conn:
        tables = conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' ORDER BY table_name"
        )).scalars().all()
    print("Connected! Tables:", tables)