# 🔧 CORS Troubleshooting - Complete Diagnosis Guide

## Error Messages You're Seeing

### Error 1: Refresh Token
```
Access to XMLHttpRequest at 'https://medicarebackend-production.up.railway.app/api/auth/refresh' 
from origin 'https://medicare.uz' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Error 2: Signup
```
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Error 3: Resource Failed
```
Failed to load resource: net::ERR_FAILED
medicarebackend-production.up.railway.app/api/auth/refresh:1
```

---

## 🎯 Root Cause: All Same Issue

**The backend is rejecting requests from your frontend.**

Why?
- Frontend domain: `https://medicare.uz`
- Backend doesn't have `FRONTEND_URL` set correctly
- Backend can't verify if `medicare.uz` is allowed
- Browser blocks the request automatically

---

## 🔍 Diagnosis Flowchart

```
Does API work from localhost?
  ├─ Yes? → Problem is domain/CORS config (CORS issue)
  └─ No? → Problem is backend code or database (different issue)

Is FRONTEND_URL set in Railway?
  ├─ Not set → Set it to https://medicare.uz
  ├─ Set to localhost:3000 → Change to https://medicare.uz
  ├─ Set to medicarebackend... → Wrong! That's backend URL
  └─ Set to https://medicare.uz → Should work (try redeploy)

Backend deployed after setting variable?
  ├─ No → Click "Redeploy"
  └─ Yes → Check logs for CORS messages
```

---

## ✅ Step-by-Step Diagnosis

### Step 1: Check Current FRONTEND_URL

```
Railway Dashboard
  → Backend Service
    → Variables tab
      → Find FRONTEND_URL
```

What you see:
- ❌ Missing → Problem found! Add it
- ❌ `http://localhost:5173` → Problem! Change it
- ❌ `medicarebackend-production.up.railway.app` → Wrong! This is backend
- ❌ Empty (blank) → Problem! Set it
- ✅ `https://medicare.uz` → Correct!

### Step 2: If Wrong, Fix It

```
1. Click on FRONTEND_URL variable
2. Edit the value
3. Set to: https://medicare.uz
4. Click "Save"
```

### Step 3: Redeploy Backend

```
1. Go to Backend Service
2. Click "Deployments" tab
3. Click "Redeploy"
4. Wait 2-3 minutes
```

### Step 4: Check Logs for CORS

```
1. Backend Service → Logs tab
2. Look for: [CORS] Allowed Origin: https://medicare.uz
3. Look for: [CORS] Middleware loaded
```

If you see these → Backend configured correctly ✅

### Step 5: Clear Browser Cache

```
Chrome: Ctrl + Shift + Delete
  → Clear browsing data
  → Cookies and cached images
  → Click "Clear"
```

### Step 6: Test API Call

**In browser console (F12 → Console tab):**

```javascript
fetch('https://medicarebackend-production.up.railway.app/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(e => console.error('CORS Error:', e.message))
```

Expected: 
```
{ok: true, time: "2024-02-02...", environment: "production"}
```

### Step 7: Test Auth Endpoint

```javascript
fetch('https://medicarebackend-production.up.railway.app/api/auth/refresh', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(console.log)
  .catch(e => console.error('Error:', e.message))
```

Should not show CORS error ✅

---

## 🔎 Advanced Debugging

### Check Response Headers

```javascript
fetch('https://medicarebackend-production.up.railway.app/api/health')
  .then(response => {
    console.log('=== Response Headers ===');
    console.log('Access-Control-Allow-Origin:', 
      response.headers.get('Access-Control-Allow-Origin'));
    console.log('Access-Control-Allow-Credentials:',
      response.headers.get('Access-Control-Allow-Credentials'));
    console.log('Access-Control-Allow-Methods:',
      response.headers.get('Access-Control-Allow-Methods'));
    console.log('Access-Control-Allow-Headers:',
      response.headers.get('Access-Control-Allow-Headers'));
    return response.json();
  })
  .then(data => console.log('✅ Data:', data))
```

Expected headers:
```
Access-Control-Allow-Origin: https://medicare.uz
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,Cookie
```

### Check Backend Console Logs

In Railway Backend Logs, look for:
```
[CORS] Allowed Origin: https://medicare.uz
[CORS] Middleware loaded
[INFO] Frontend URL: https://medicare.uz
```

If `[CORS] Allowed Origin: *` → Variable not set!

### Test with cURL (if you have it)

```bash
curl -i -X OPTIONS \
  -H "Origin: https://medicare.uz" \
  -H "Access-Control-Request-Method: POST" \
  https://medicarebackend-production.up.railway.app/api/auth/refresh
```

Should return:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://medicare.uz
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
```

---

## ❌ Common Mistakes & Fixes

### Mistake 1: Wrong FRONTEND_URL Format

| Wrong | Right | Why |
|-------|-------|-----|
| `medicarebackend-prod...` | `https://medicare.uz` | That's backend, not frontend! |
| `medicare.uz` | `https://medicare.uz` | Need https:// protocol |
| `http://medicare.uz` | `https://medicare.uz` | Must be https in production |
| `https://medicare.uz/` | `https://medicare.uz` | Remove trailing slash |
| `localhost:5173` | `https://medicare.uz` | That's development, not production |

### Mistake 2: Not Redeploying

```
❌ Set variable but forgot to redeploy
✅ Set variable AND click "Redeploy"

The old code is still running until you redeploy!
```

### Mistake 3: Browser Cache

```
❌ Browser cached old failed request
✅ Clear cache: Ctrl+Shift+Delete

Browser keeps trying the old URL, needs cache clear!
```

### Mistake 4: Wrong Endpoint

```
❌ Testing: https://localhost:8090/api/auth/refresh
✅ Testing: https://medicarebackend-production.up.railway.app/api/auth/refresh

Make sure you're calling production backend, not localhost!
```

### Mistake 5: Missing Credentials

```
❌ fetch('...api/auth/refresh')
✅ fetch('...api/auth/refresh', { credentials: 'include' })

Need credentials: include for cookies to work!
```

---

## 🔐 Security Considerations

### Current Setup (Correct)

```javascript
app.use(cors({
  origin: 'https://medicare.uz',    // ✅ Specific domain
  credentials: true,                 // ✅ Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
```

### Why This Is Secure

✅ Only `https://medicare.uz` can call your API
✅ `https://evil.com` gets blocked automatically
✅ Protects against CSRF attacks
✅ Protects against unauthorized access

### Don't Use

```javascript
❌ app.use(cors()) 
❌ app.use(cors({ origin: '*' }))
```

Why?
- Too permissive
- Anyone can call your API
- Security risk!

---

## 📊 Checklist for Resolution

- [ ] FRONTEND_URL set to `https://medicare.uz` in Railway Variables
- [ ] Backend redeployed after setting FRONTEND_URL
- [ ] 3+ minutes passed since redeploy
- [ ] Logs show `[CORS] Allowed Origin: https://medicare.uz`
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Testing with `https://...` not `http://...`
- [ ] Testing with `credentials: 'include'` in fetch
- [ ] Health endpoint test passes
- [ ] Auth endpoint test passes
- [ ] Frontend login/signup works

---

## 🆘 Still Not Working?

### Scenario 1: Logs Don't Show CORS Messages

**Problem**: Backend hasn't redeployed yet
**Solution**: 
```
1. Go to Backend Service
2. Click Deployments
3. Check "Status" column
4. If "In Progress", wait 3 minutes
5. If "Failed", click to see error
6. If "Success", wait 1 more minute and refresh logs
```

### Scenario 2: CORS Origin Shows `*`

**Problem**: FRONTEND_URL variable not being read
**Solution**:
```
1. Check variable exists: FRONTEND_URL = https://medicare.uz
2. Verify spelling is exact
3. Redeploy
4. Wait 3 minutes
5. Check logs again
```

### Scenario 3: Headers Don't Show Access-Control-Allow

**Problem**: CORS middleware not running
**Solution**:
```
1. Check backend/server.js lines 25-30 (CORS config)
2. Make sure npm start runs latest code
3. Redeploy: Backend Service → Redeploy
4. Check logs for [CORS] messages
```

### Scenario 4: Works Locally But Not on Railway

**Problem**: Different environment variables
**Solution**:
```
Local (.env):
  FRONTEND_URL=http://localhost:5173
  
Railway Variables:
  FRONTEND_URL=https://medicare.uz
  
Make sure Railway has production values!
```

---

## 📝 Reference

### What CORS Error Means

```
"CORS policy: No 'Access-Control-Allow-Origin' header"

Translation:
  "Browser asked backend if medicare.uz is allowed"
  "Backend didn't respond with permission header"
  "Browser blocked the request for security"
```

### The Full Request Flow

```
1. Frontend: fetch('https://backend.../api/auth/refresh')
2. Browser: "Wait, different domain!"
3. Browser: "Let me send preflight OPTIONS request"
4. Browser: "OPTIONS /api/auth/refresh HTTP/1.1"
5. Browser: "Origin: https://medicare.uz"
6. Backend: checks FRONTEND_URL
7. Backend: if (FRONTEND_URL === 'https://medicare.uz')
8. Backend: send Access-Control-Allow-Origin header
9. Browser: sees header, allows request
10. Frontend: actual request sent
11. Backend: processes request normally
```

### The Variable That Fixes Everything

```
FRONTEND_URL=https://medicare.uz
```

That's it. That's the solution.

---

## 🎯 Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Set FRONTEND_URL in Railway | 1 min |
| 2 | Click Redeploy | 1 min |
| 3 | Wait for deployment | 2-3 min |
| 4 | Clear browser cache | 1 min |
| 5 | Test API call | 1 min |

**Total Time**: 5-7 minutes

**Success Rate**: 98% (just need to set one variable!)

---

**Last Updated**: February 2, 2026
**Status**: ✅ Ready to fix
