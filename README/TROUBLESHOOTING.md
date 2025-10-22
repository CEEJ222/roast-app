# Roast App Troubleshooting Guide

## Common Issues and Solutions

### 1. CORS Issues on Railway

**Problem**: Frontend gets CORS errors like "No 'Access-Control-Allow-Origin' header is present on the requested resource"

**Root Cause**: Railway's infrastructure has known issues with CORS handling, especially with OPTIONS preflight requests.

**Solution**: 
1. Use specific origins instead of wildcard for production security
2. Add custom CORS middleware to ensure headers on ALL responses (including errors)

```python
# In backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.roastbuddy.app",
        "https://roastbuddy.app", 
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
)

# Custom middleware to ensure CORS headers on ALL responses
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    # Handle OPTIONS preflight requests
    if request.method == "OPTIONS":
        response = Response()
        origin = request.headers.get("origin")
        
        # Define allowed origins
        allowed_origins = [
            "https://www.roastbuddy.app",
            "https://roastbuddy.app", 
            "http://localhost:3000",
            "http://localhost:5173"
        ]
        
        # Set CORS headers if origin is allowed
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin"
        response.headers["Access-Control-Max-Age"] = "600"
        return response
    
    # Handle regular requests
    response = await call_next(request)
    
    # Get the origin from the request
    origin = request.headers.get("origin")
    
    # Define allowed origins
    allowed_origins = [
        "https://www.roastbuddy.app",
        "https://roastbuddy.app", 
        "http://localhost:3000",
        "http://localhost:5173"
    ]
    
    # Set CORS headers if origin is allowed
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin"
    response.headers["Access-Control-Max-Age"] = "600"
    
    return response
```

### 2. JWT Authentication Issues

**Problem**: Backend returns 401 errors with "Token verification failed: Expecting a string- or bytes-formatted key"

**Root Cause**: Missing or incorrectly configured `SUPABASE_JWT_SECRET` environment variable in Railway

**Solution**: 
1. Go to Railway project dashboard
2. Click "Variables" tab
3. Add environment variable:
   - **Key**: `SUPABASE_JWT_SECRET`
   - **Value**: Your Supabase JWT secret (found in Supabase project settings under "API" → "JWT Secret")

**Important**: This environment variable is REQUIRED for authentication to work. Do not skip this step.

### 3. JWT Error Handling

**Problem**: Backend crashes with `AttributeError: module 'jose.jwt' has no attribute 'InvalidTokenError'`

**Root Cause**: Incorrect import for JWT error handling

**Solution**: Use `JWTError` instead of `InvalidTokenError`

```python
from jose import jwt, JWTError

# In JWT verification function
except jwt.ExpiredSignatureError:
    raise HTTPException(status_code=401, detail="Token expired")
except JWTError:  # Not jwt.InvalidTokenError
    raise HTTPException(status_code=401, detail="Invalid token")
```

### 4. Railway vs Vercel Deployment Issues

**Problem**: CORS works locally but fails in production

**Root Cause**: Different platforms handle CORS differently

**Solution**: 
- Railway: Use specific origins with custom middleware (wildcard blocked in production)
- Vercel: Use specific origins with credentials support

### 5. Environment Variables Checklist

**Required Railway Environment Variables**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` 
- `SUPABASE_JWT_SECRET` ⚠️ **CRITICAL - Often Missing**

**Required Vercel Environment Variables**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

### 6. Common Deployment Mistakes

1. **Skipping JWT Secret**: Always add `SUPABASE_JWT_SECRET` to Railway
2. **Wrong CORS Configuration**: Railway blocks wildcard CORS in production, needs specific origins
3. **Missing Custom Middleware**: Standard CORS middleware doesn't work on Railway for error responses
4. **Incorrect JWT Error Handling**: Use `JWTError`, not `InvalidTokenError`

### 7. Debugging Steps

1. **Check CORS**: Look for "Access-Control-Allow-Origin" headers in response
2. **Check Authentication**: Look for 401 vs 500 errors (401 = auth issue, 500 = server crash)
3. **Check Environment Variables**: Ensure all required variables are set
4. **Check Logs**: Railway logs will show the exact error

### 8. Quick Fixes

**If CORS errors persist**:
- Add custom CORS middleware
- Use specific origins for Railway (wildcard blocked in production)
- Ensure middleware runs on ALL responses

**If 401 errors persist**:
- Add `SUPABASE_JWT_SECRET` to Railway
- Verify JWT secret is correct
- Check token format in frontend

**If 500 errors persist**:
- Check Railway logs for exact error
- Fix JWT error handling
- Verify all environment variables are set

### 9. Modal Confirmation Issues

**Problem**: Confirmation modals work for close button (X icon) but not for swipe-to-close gestures

**Root Cause**: Touch handlers in modal components call `onClose()` directly instead of going through the confirmation logic

**Symptoms**:
- Close button shows confirmation dialog ✅
- Swipe-to-close bypasses confirmation ❌
- Users can accidentally lose form data

**Solution**: Update touch handlers to use the confirmation handler instead of direct close

```javascript
// ❌ WRONG - Bypasses confirmation
const handleTouchEnd = (e) => {
  if (deltaY > threshold) {
    onClose(); // Direct close, no confirmation
  }
};

// ✅ CORRECT - Shows confirmation
const handleTouchEnd = (e) => {
  if (deltaY > threshold) {
    handleClose(); // Goes through confirmation logic
  }
};
```

**Files to Check**:
- `BeanProfileForm.jsx` - Line 184 in `handleTouchEnd`
- `StartNewRoastModal.jsx` - Touch handlers
- Any modal with swipe-to-close functionality

**Debug Steps**:
1. Check if modal has separate touch handlers
2. Verify touch handlers call confirmation function, not direct close
3. Test both close button and swipe gestures
4. Ensure confirmation modal has proper z-index

### 10. Modal Z-Index Issues

**Problem**: Confirmation modals appear behind other content

**Solution**: Add explicit z-index to confirmation modals

```javascript
<div 
  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" 
  style={{zIndex: 100}}
>
```

## Remember

- **Railway + CORS = Always use custom middleware**
- **JWT Secret = Always required for authentication**
- **Modal touch handlers = Must use confirmation logic**
- **Check logs first when debugging**
- **Test with curl to isolate frontend vs backend issues**
