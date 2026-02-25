
from passlib.context import CryptContext
import bcrypt

print(f"Bcrypt version: {bcrypt.__version__}")

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = pwd_context.hash("shortpassword")
    print(f"Short password hash: {hashed}")
    
    long_password = "a" * 80
    try:
        hashed_long = pwd_context.hash(long_password)
        print(f"Long password hash: {hashed_long}")
    except ValueError as e:
        print(f"Long password failed as expected: {e}")
        
    print("Hashing check PASSED")
except Exception as e:
    print(f"Hashing check FAILED: {e}")
