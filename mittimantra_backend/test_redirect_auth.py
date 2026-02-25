
import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_auth_flow():
    print("="*60)
    print("TESTING REDIRECT AUTH FLOW")
    print("="*60)
    
    session = requests.Session()
    
    # 1. Register
    print("\n1. Testing Registration (Form POST)...")
    register_data = {
        "email": "redirect_user@example.com",
        "username": "redirect_user",
        "password": "securepassword",
        "full_name": "Redirect User"
    }
    
    try:
        # We start with potentially existing user, so we handle error redirect
        response = session.post(f"{BASE_URL}/auth/register", data=register_data, allow_redirects=False)
        
        if response.status_code == 302:
            print(f"✅ Registration redirected to: {response.headers.get('Location')}")
            
            # Check for error param if redirected back to register
            if "/register?error=" in response.headers.get('Location'):
                print("⚠️ User already exists (expected if running multiple times). Continuing to login...")
            elif "/dashboard" in response.headers.get('Location'):
                print("✅ Redirected to Dashboard on success.")
                # Check cookie
                if "access_token" in response.cookies:
                    print("✅ Access token cookie set.")
                else:
                    print("❌ Access token cookie MISSING!")
        else:
            print(f"❌ Registration failed with status: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"❌ Connection error: {e}")
        return

    # 2. Login
    print("\n2. Testing Login (Form POST)...")
    login_data = {
        "username": "redirect_user",
        "password": "securepassword"
    }
    
    try:
        response = session.post(f"{BASE_URL}/auth/login", data=login_data, allow_redirects=False)
        
        if response.status_code == 302:
            print(f"✅ Login redirected to: {response.headers.get('Location')}")
            if "/dashboard" in response.headers.get('Location'):
                print("✅ Redirected to Dashboard.")
                # Update session cookies
                # session.cookies.update(response.cookies) # Requests does this automatically if allow_redirects=True, but we did False
                # Manual cookie check
                if "access_token" in response.cookies:
                     print("✅ Access token cookie set.")
                else:
                     print("❌ Access token cookie MISSING!")
            else:
                print(f"❌ Redirected to unexpected location: {response.headers.get('Location')}")
        else:
            print(f"❌ Login failed with status: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Connection error: {e}")

    # 3. Access Dashboard
    print("\n3. Accessing Dashboard (GET)...")
    try:
        # We need the cookie from login response
        # verify session has cookie
        if not session.cookies.get("access_token"):
            print("⚠️ Session missing cookie (maybe login failed or redirect handling issues).")
            # Force set manually for test if we got it
            if "access_token" in response.cookies:
                 session.cookies.set("access_token", response.cookies["access_token"])
        
        response = session.get(f"{BASE_URL}/dashboard", allow_redirects=False)
        
        if response.status_code == 200:
            print("✅ Dashboard accessed successfully (200 OK).")
            if "redirect_user" in response.text or "Welcome" in response.text:
                 print("✅ Dashboard content verified (contains user info).")
            else:
                 print("⚠️ Dashboard content might be missing user name.")
        elif response.status_code == 302:
            print(f"❌ Dashboard redirected to: {response.headers.get('Location')} (Should be 200 OK)")
        else:
            print(f"❌ Dashboard failed with status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Connection error: {e}")

    # 4. Logout
    print("\n4. Testing Logout...")
    try:
        response = session.get(f"{BASE_URL}/auth/logout", allow_redirects=False)
        if response.status_code == 302:
             print(f"✅ Logout redirected to: {response.headers.get('Location')}")
             # Check if cookie cleared (expired)
             # Requests cookies are complex to check expiration on simple dict interface
             print("✅ Logout logic executed.")
        else:
             print(f"❌ Logout failed with status: {response.status_code}")
             
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    test_auth_flow()
