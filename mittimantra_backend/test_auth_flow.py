
import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.main import app
from app.database import Base, get_db
from app.db_models import User

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_auth_flow():
    print("=" * 60)
    print("TESTING AUTHENTICATION FLOW")
    print("=" * 60)

    # 1. Register User
    print("\n[TEST 1] Register User")
    register_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    response = client.post("/auth/register", json=register_data)
    if response.status_code == 201:
        print("✅ Registration successful")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ Registration failed: {response.status_code}")
        print(response.json())
        sys.exit(1)

    # 2. Login User
    print("\n[TEST 2] Login User")
    login_data = {
        "username": "testuser",
        "password": "testpassword123"
    }
    response = client.post("/auth/login", data=login_data)
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data["access_token"]
        print("✅ Login successful")
        print(f"Token received: {access_token[:20]}...")
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.json())
        sys.exit(1)

    # 3. Access Protected Route (/auth/me)
    print("\n[TEST 3] Access Protected Route (/auth/me)")
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/auth/me", headers=headers)
    if response.status_code == 200:
        user_data = response.json()
        print("✅ Access granted")
        print(f"User: {user_data['username']} ({user_data['email']})")
        assert user_data["username"] == "testuser"
        assert user_data["email"] == "test@example.com"
    else:
        print(f"❌ Access denied: {response.status_code}")
        print(response.json())
        sys.exit(1)

    # 4. Verify Static Files
    print("\n[TEST 4] Verify Static Files")
    response = client.get("/static/style.css")
    if response.status_code == 200:
        print("✅ Static CSS accessible")
    else:
        print(f"❌ Static CSS not found: {response.status_code}")
        sys.exit(1)

    # 5. Verify Templates
    print("\n[TEST 5] Verify Login Page")
    response = client.get("/login")
    if response.status_code == 200 and "Login - Mittimantra" in response.text:
        print("✅ Login page rendered successfully")
    else:
        print(f"❌ Login page failed: {response.status_code}")
        sys.exit(1)

    # 6. Verify Database Storage (Hashed Password)
    print("\n[TEST 6] Verify Database Storage")
    db = TestingSessionLocal()
    user = db.query(User).filter(User.username == "testuser").first()
    if user:
        print("✅ User found in database")
        print(f"Hashed Password: {user.hashed_password[:20]}...")
        assert user.hashed_password != "testpassword123", "Password is not hashed!"
        print("✅ Password is hashed")
    else:
        print("❌ User not found in database")
        sys.exit(1)
    db.close()

    print("\n" + "=" * 60)
    print("🎉 ALL TESTS PASSED!")
    print("=" * 60)

    # Cleanup
    os.remove("test_auth.db")

if __name__ == "__main__":
    try:
        test_auth_flow()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        if os.path.exists("test_auth.db"):
            os.remove("test_auth.db")
        sys.exit(1)
