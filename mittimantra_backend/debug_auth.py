
import sys
import os
from sqlalchemy.orm import Session
from passlib.context import CryptContext

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.database import SessionLocal, engine
from app.db_models import User
from app.auth import verify_password, get_password_hash

# Setup password context (same as auth.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def debug_users():
    with open("debug_output.txt", "w", encoding="utf-8") as f:
        def log(msg):
            print(msg)
            f.write(msg + "\n")
            
        log("="*60)
        log("DEBUGGING AUTHENTICATION")
        log("="*60)
        
        db = SessionLocal()
        try:
            users = db.query(User).all()
            log(f"Found {len(users)} users in database.")
            
            for user in users:
                log(f"\nUser ID: {user.id}")
                log(f"Username: {user.username}")
                log(f"Email: {user.email}")
                log(f"Hashed Password (stored): {user.hashed_password}")
                
                # Allow manual verification testing
                test_passwords = ["testpassword123", "securepassword", "password123"]
                
                log("  Testing common passwords:")
                match_found = False
                for p in test_passwords:
                    is_valid = verify_password(p, user.hashed_password)
                    if is_valid:
                        log(f"  ✅ Password matches: '{p}'")
                        match_found = True
                        break
                    else:
                        log(f"  ❌ Password '{p}' does not match")
                
                if not match_found:
                    log("  ⚠️ No common passwords matched. User might have a different password.")

                # Check if bcrypt is recognized
                if user.hashed_password.startswith("$2b$") or user.hashed_password.startswith("$2a$"):
                    log("  ✅ Hash format looks like valid bcrypt.")
                else:
                    log("  ❌ Hash format does NOT look like bcrypt (might be plain text or other).")

        except Exception as e:
            log(f"Error querying database: {e}")
        finally:
            db.close()

if __name__ == "__main__":
    debug_users()
