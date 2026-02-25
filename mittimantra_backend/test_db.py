from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
print("=" * 60)
print("TESTING DATABASE CONNECTION")
print("=" * 60)
print(f"\nDatabase URL: {DATABASE_URL}")
try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print(f"\n✅ Connection successful!")
        print(f"PostgreSQL version: {version[:50]}...")
except Exception as e:
    print(f"\n❌ Connection failed!")
    print(f"Error: {e}")
print("\n" + "=" * 60)
