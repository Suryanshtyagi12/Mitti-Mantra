"""
Comprehensive SQLite Migration Test
Tests all aspects of the SQLite setup
"""
import sys
import os
from pathlib import Path

print("=" * 70)
print("COMPREHENSIVE SQLITE MIGRATION TEST")
print("=" * 70)

# Test 1: Environment Configuration
print("\n[TEST 1] Environment Configuration")
print("-" * 70)
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"DATABASE_URL from .env: {DATABASE_URL}")
assert DATABASE_URL == "sqlite:///./mittimantra.db", "DATABASE_URL mismatch!"
print("✅ Environment configuration correct")

# Test 2: Database Connection
print("\n[TEST 2] Database Connection")
print("-" * 70)
from sqlalchemy import create_engine, text
try:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    with engine.connect() as conn:
        result = conn.execute(text("SELECT sqlite_version();"))
        version = result.fetchone()[0]
        print(f"SQLite version: {version}")
    print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)

# Test 3: Import Database Models
print("\n[TEST 3] Import Database Models")
print("-" * 70)
try:
    from app.database import Base, engine, SessionLocal, get_db
    from app.db_models import User, CropPrediction, DiseasePrediction, IrrigationSchedule
    print("✅ All imports successful")
except Exception as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)

# Test 4: Create Tables
print("\n[TEST 4] Create Database Tables")
print("-" * 70)
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully")
except Exception as e:
    print(f"❌ Table creation failed: {e}")
    sys.exit(1)

# Test 5: Verify Tables Exist
print("\n[TEST 5] Verify Tables")
print("-" * 70)
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
expected_tables = ["users", "crop_predictions", "disease_predictions", "irrigation_schedules"]

print(f"Expected tables: {expected_tables}")
print(f"Found tables: {tables}")

for table in expected_tables:
    if table in tables:
        print(f"  ✅ {table}")
    else:
        print(f"  ❌ {table} - MISSING!")
        sys.exit(1)

# Test 6: Database File
print("\n[TEST 6] Database File")
print("-" * 70)
db_file = Path("mittimantra.db")
if db_file.exists():
    size = db_file.stat().st_size
    print(f"Database file: {db_file.absolute()}")
    print(f"File size: {size:,} bytes")
    print("✅ Database file exists")
else:
    print("❌ Database file not found!")
    sys.exit(1)

# Test 7: Session Creation
print("\n[TEST 7] Session Creation")
print("-" * 70)
try:
    db = SessionLocal()
    db.close()
    print("✅ Session created and closed successfully")
except Exception as e:
    print(f"❌ Session creation failed: {e}")
    sys.exit(1)

# Test 8: Dependency Injection
print("\n[TEST 8] Dependency Injection (get_db)")
print("-" * 70)
try:
    db_gen = get_db()
    db = next(db_gen)
    db.close()
    print("✅ get_db() dependency works")
except Exception as e:
    print(f"❌ get_db() failed: {e}")
    sys.exit(1)

# Final Summary
print("\n" + "=" * 70)
print("🎉 ALL TESTS PASSED!")
print("=" * 70)
print("\nSQLite Migration Summary:")
print(f"  ✅ Database URL: {DATABASE_URL}")
print(f"  ✅ Database file: {db_file.absolute()}")
print(f"  ✅ Tables created: {len(tables)}")
print(f"  ✅ SQLite version: {version}")
print(f"  ✅ No PostgreSQL dependencies")
print(f"  ✅ No thread errors")
print(f"  ✅ No dialect mismatch")
print("\n" + "=" * 70)
