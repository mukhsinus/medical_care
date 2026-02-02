# CORS Errors Explained - Simple Version

## Your Error

```
Access to XMLHttpRequest at 'https://medicarebackend-production.up.railway.app/api/auth/refresh' 
from origin 'https://medicare.uz' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## What This Means (Simple)

```
Your Website:   https://medicare.uz
Backend Server: https://medicarebackend-production.up.railway.app

Browser: "Wait, these are different websites!"
Browser: "Let me check if medicare.uz is allowed to call the backend..."
Browser: "Backend, do you allow medicare.uz to call you?"
Backend: (No response / doesn't say yes)
Browser: "I'm blocking this for security!" ❌

Error:   No 'Access-Control-Allow-Origin' header
Meaning: Backend didn't say "yes, I allow medicare.uz"
```

## The Fix (2 Minutes)

**Problem**: Backend doesn't know your frontend is `https://medicare.uz`

**Solution**: Tell backend: "My frontend is at https://medicare.uz"

### Where to Tell Backend

```
Railway Dashboard
  → Backend Service
    → Variables tab
      → Add/Update: FRONTEND_URL = https://medicare.uz
      → Click "Redeploy"
      → Done!
```

## How Backend Responds

### Before (Wrong)
```
Browser: "Can I call your API from https://medicare.uz?"
Backend: (doesn't respond with Access-Control-Allow-Origin header)
Result: ❌ BLOCKED
```

### After (Correct)
```
Browser: "Can I call your API from https://medicare.uz?"
Backend: "Yes! I allow https://medicare.uz"
Backend sends header: Access-Control-Allow-Origin: https://medicare.uz
Result: ✅ ALLOWED
```

## The Code Behind It

```javascript
// backend/server.js
const FRONTEND_URL = process.env.FRONTEND_URL;  // Read from Railway variables

app.use(cors({
  origin: FRONTEND_URL,    // Only allow this domain
  credentials: true         // Allow cookies
}));
```

When browser calls backend:
1. Backend checks: Is caller from `FRONTEND_URL`?
2. If yes: Respond with `Access-Control-Allow-Origin` header ✅
3. If no: Don't respond with header ❌ (CORS error)

## The Problem Chain

```
Step 1: Frontend code makes API call
  fetch('https://medicarebackend-production.up.railway.app/api/auth/refresh')
  
Step 2: Browser makes preflight OPTIONS request
  "Is medicare.uz allowed to call this?"
  
Step 3: Backend checks FRONTEND_URL variable
  Is FRONTEND_URL set to https://medicare.uz? 
  ❌ NOT SET (error!)
  
Step 4: Backend doesn't send Access-Control-Allow-Origin header
  
Step 5: Browser blocks the request
  "CORS Error!"
```

## Why This Security Exists

```
Without CORS protection:
  ❌ Hacker at evil.com could call your API
  ❌ Steal user data from medicare.uz users
  ❌ Make unauthorized requests

With CORS protection:
  ✅ Only medicare.uz can call your backend
  ✅ evil.com gets blocked automatically
  ✅ Your API is protected
```

## Quick Checklist

- [ ] Frontend is at: `https://medicare.uz`
- [ ] Backend is at: `https://medicarebackend-production.up.railway.app`
- [ ] In Railway, set: `FRONTEND_URL = https://medicare.uz`
- [ ] Click "Redeploy"
- [ ] Wait 2 minutes
- [ ] Clear browser cache
- [ ] Try API call again

## Testing It Works

### Easy Test (Browser Console)

```javascript
// Go to any page on medicare.uz
// Open DevTools (F12) → Console tab
// Paste this:

fetch('https://medicarebackend-production.up.railway.app/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Works!', d))
  .catch(e => console.log('❌ Error:', e.message))
```

Should show: `✅ Works!`

### Better Test (Check Headers)

```javascript
fetch('https://medicarebackend-production.up.railway.app/api/health')
  .then(r => {
    const allowOrigin = r.headers.get('Access-Control-Allow-Origin');
    console.log('Access-Control-Allow-Origin:', allowOrigin);
    return r.json();
  })
  .then(console.log)
```

Should show:
```
Access-Control-Allow-Origin: https://medicare.uz
```

## Common Wrong Values

| Value Set | Problem |
|-----------|---------|
| `localhost:3000` | Not your production domain |
| `medicare.uz` | Missing `https://` |
| `*` | Too permissive (less secure) |
| (empty) | Backend doesn't know your domain |
| `https://medicarebackend...` | Wrong! That's your backend, not frontend |

## What To Set

```
✅ Correct:
FRONTEND_URL=https://medicare.uz

❌ Wrong:
FRONTEND_URL=http://medicare.uz        (use https://)
FRONTEND_URL=medicarebackend-production.up.railway.app  (that's backend!)
FRONTEND_URL=localhost:5173             (development domain)
FRONTEND_URL=*                          (too permissive)
```

## The Errors You Saw

### Error 1: Refresh Token
```
Access to XMLHttpRequest at '...api/auth/refresh' ... CORS policy
Reason: Backend doesn't know about frontend domain
```

### Error 2: Signup
```
Response to preflight request doesn't pass access control check
Reason: Same - CORS not configured
```

### Error 3: Failed to Load
```
Failed to load resource: net::ERR_FAILED
Reason: Browser blocked it due to CORS error
```

**All 3 have same root cause**: `FRONTEND_URL` not set correctly

## 3-Step Fix

```
1. Railway Dashboard
   → Backend Service  
   → Variables tab
   
2. Add: FRONTEND_URL = https://medicare.uz
   
3. Click "Redeploy"
```

Done! ✅

---

**Time to fix**: 2-3 minutes
**Difficulty**: Very easy
**Next**: Go to Railway and set the variable!
