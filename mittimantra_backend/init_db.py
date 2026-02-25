"""
Database Initialization Script
Creates all database tables for SQLite
"""

from app.database import engine, Base
from app.db_models import User, CropPrediction, DiseasePrediction, IrrigationSchedule, TrackFarming

def init_db():
    """Create all database tables"""
    print("=" * 60)
    print("INITIALIZING SQLITE DATABASE")
    print("=" * 60)
    print("\nCreating database tables...")
    
    try:
        Base.metadata.create_all(bind=engine)
        print("\n✅ Database tables created successfully!")
        print("\nTables created:")
        print("  - users")
        print("  - crop_predictions")
        print("  - disease_predictions")
        print("  - irrigation_schedules")
        print("\n" + "=" * 60)
    except Exception as e:
        print(f"\n❌ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    init_db()