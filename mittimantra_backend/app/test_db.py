from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("=" * 60)
print("TESTING SQLITE CONNECTION")
print("=" * 60)
print(f"\nDatabase URL: {DATABASE_URL}")

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

    with engine.connect() as connection:
        result = connection.execute(text("SELECT sqlite_version();"))
        version = result.fetchone()[0]
        print(f"\n✅ Connection successful!")
        print(f"SQLite version: {version}")

except Exception as e:
    print(f"\n❌ Connection failed!")
    print(f"Error: {e}")

print("\n" + "=" * 60)
