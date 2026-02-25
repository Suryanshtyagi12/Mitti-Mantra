"""
Quick verification script to test SQLite database
"""
import sys
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mittimantra.db")

print("=" * 60)
print("SQLITE DATABASE VERIFICATION")
print("=" * 60)
print(f"\nDatabase URL: {DATABASE_URL}")

try:
    # Create engine
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    
    # Test connection
    with engine.connect() as connection:
        result = connection.execute(text("SELECT sqlite_version();"))
        version = result.fetchone()[0]
        print(f"\n✅ Connection successful!")
        print(f"SQLite version: {version}")
    
    # Check tables
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if tables:
        print(f"\n✅ Tables found: {len(tables)}")
        for table in tables:
            print(f"  - {table}")
    else:
        print("\n⚠️  No tables found. Run init_db.py to create tables.")
    
    print("\n" + "=" * 60)
    print("✅ ALL CHECKS PASSED!")
    print("=" * 60)
    sys.exit(0)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\n" + "=" * 60)
    sys.exit(1)
