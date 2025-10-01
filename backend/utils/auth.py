"""
Authentication utilities
"""
import os
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="/Users/cjbritz/roast-app/backend/.env")

# JWT verification
security = HTTPBearer()
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# JWT secret is already in the correct format (not base64 encoded)
if not SUPABASE_JWT_SECRET:
    print("ERROR: SUPABASE_JWT_SECRET environment variable is not set!")
else:
    print(f"DEBUG: JWT secret loaded successfully, length: {len(SUPABASE_JWT_SECRET)}")


def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify JWT token and return user ID"""
    try:
        if not credentials or not credentials.credentials:
            raise HTTPException(status_code=401, detail="No token provided")
        
        token = credentials.credentials
        if not isinstance(token, str) or not token.strip():
            raise HTTPException(status_code=401, detail="Invalid token format")
        
        print(f"DEBUG: Attempting to verify token, secret length: {len(SUPABASE_JWT_SECRET)}")
        
        # Decode JWT token
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        print(f"DEBUG: Token verified successfully for user: {user_id}")
        return user_id
    except jwt.ExpiredSignatureError:
        print("DEBUG: Token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError as e:
        print(f"DEBUG: JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"DEBUG: Unexpected error in token verification: {e}")
        raise HTTPException(status_code=500, detail=f"Token verification failed: {str(e)}")
