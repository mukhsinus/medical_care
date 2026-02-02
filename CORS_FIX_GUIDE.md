# 🔧 CORS Error Fix - Access Denied from medicare.uz

## 🔴 The Problem

Your frontend at `https://medicare.uz` is blocked from calling backend at `https://medicarebackend-production.up.railway.app` because:

```
Access to XMLHttpRequest at 'https://medicarebackend-production.up.railway.app/api/auth/refresh'
from origin 'https://medicare.uz' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### What This Means
- Frontend: `https://medicare.uz`
- Backend: `https://medicarebackend-production.up.railway.app`
- Browser blocks this because they're different domains
- Backend must explicitly allow `https://medicare.uz`

---

## 🟢 The Solution

### ✅ Quick Fix (2 Minutes)

**In Railway Dashboard:**

1. Go to Backend Service
2. Click "Variables" tab
3. Look for `FRONTEND_URL` variable
4. If missing or wrong, update it to:
   ```
   FRONTEND_URL=https://medicare.uz
   ```
5. Click "Redeploy"
6. Wait 2 minutes
7. Try calling API again

### ✅ Verify It's Set

In Railway Backend Variables, you should see:
```
FRONTEND_URL = https://medicare.uz
```

Not:
```
FRONTEND_URL = http://localhost:5173
FRONTEND_URL = (empty)
FRONTEND_URL = *
```

---

## 📝 Current CORS Configuration

Your backend has proper CORS setup:

```javascript
// backend/server.js (lines 23-27)
app.use(cors({
  origin: FRONTEND_URL,        // ← Reads from environment variable
  credentials: true             // ← Allows cookies
}));
```

The issue: **`FRONTEND_URL` is not set or set incorrectly in Railway**.

---

## 🔍 Step-by-Step Fix

### Step 1: Check Current Variable

```
Railway Dashboard
  → Backend Service
    → Variables
      → Look for FRONTEND_URL
```

### Step 2: Update If Missing

If `FRONTEND_URL` is:
- ❌ Missing → Add it
- ❌ `http://localhost:5173` → Change to `https://medicare.uz`
- ❌ Empty → Set to `https://medicare.uz`
- ✅ `https://medicare.uz` → Already correct, try redeploy

### Step 3: Set Correct Value

```
Variable Name:  FRONTEND_URL
Variable Value: https://medicare.uz
Secret:         No
```

### Step 4: Redeploy

```
Railway Dashboard
  → Backend Service
    → Deployments tab
      → Click "Redeploy"
```

Wait 2-3 minutes for deployment.

### Step 5: Verify in Logs

Check logs for CORS configuration:
```
Railway Dashboard
  → Backend Service
    → Logs
      → Should show: [INFO] Frontend URL: https://medicare.uz
```

### Step 6: Test API Call

In frontend console:
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

Should work now! ✅

---

## 🎯 All Required Backend Variables

Make sure ALL these are set in Railway:

```
PORT                = 8090
NODE_ENV            = production
MONGO_URI           = (from MongoDB service)
JWT_SECRET          = (secure key)
FRONTEND_URL        = https://medicare.uz     ← THIS IS CRITICAL
```

If any are missing, CORS won't work.

---

## 📚 How CORS Works

### Simple Request Flow
```
Browser (medicare.uz)
    ↓
    → Backend checks: Is origin 'https://medicare.uz' allowed?
    ↓
    If FRONTEND_URL = https://medicare.uz:
      ✅ Backend responds with: Access-Control-Allow-Origin: https://medicare.uz
      ✅ Browser allows the response
    
    If FRONTEND_URL = (not set or different):
      ❌ Backend doesn't send Access-Control-Allow-Origin header
      ❌ Browser blocks the response (CORS error)
```

### Preflight Request Flow (POST/PUT/DELETE)
```
Browser sends OPTIONS request first:
    → "Can I make a POST request from https://medicare.uz?"
    
Backend responds:
    ✅ Access-Control-Allow-Origin: https://medicare.uz
    ✅ Access-Control-Allow-Methods: GET, POST, PUT, DELETE
    ✅ Access-Control-Allow-Headers: Content-Type, Authorization
    
Only then browser sends actual POST request
```

---

## ❌ Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `FRONTEND_URL = localhost:3000` | Wrong protocol/port | Set to `https://medicare.uz` |
| `FRONTEND_URL = medicare.uz` | Missing https:// | Set to `https://medicare.uz` |
| `FRONTEND_URL = *` | Allows all (less secure) | Set to `https://medicare.uz` |
| `FRONTEND_URL = (empty)` | Defaults to `*` then sometimes fails | Set to `https://medicare.uz` |
| Not redeploying | Old config still running | Click "Redeploy" after change |

---

## 🔒 Security Best Practice

```
❌ Don't: FRONTEND_URL = *  (allows any domain)
✅ Do:   FRONTEND_URL = https://medicare.uz (only your domain)

Why?
- Protects your API from CSRF attacks
- Only medicare.uz can call your backend
- More secure and proper security practice
```

---

## 🧪 Test Commands (Frontend)

### Test 1: Health Check (No CORS usually)
```javascript
fetch('https://medicarebackend-production.up.railway.app/api/health')
  .then(r => r.json())
  .then(console.log)
```

Expected: Works (200 OK)

### Test 2: Auth Refresh (CORS Required)
```javascript
fetch('https://medicarebackend-production.up.railway.app/api/auth/refresh', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
  .then(r => r.json())
  .then(console.log)
  .catch(e => console.error('Error:', e))
```

Expected: Works (CORS allowed)

### Test 3: Check Response Headers
```javascript
fetch('https://medicarebackend-production.up.railway.app/api/auth/refresh', {
  method: 'POST',
  credentials: 'include'
})
  .then(r => {
    console.log('Headers:');
    console.log('Access-Control-Allow-Origin:', r.headers.get('Access-Control-Allow-Origin'));
    console.log('Access-Control-Allow-Credentials:', r.headers.get('Access-Control-Allow-Credentials'));
    return r.json();
  })
  .then(console.log)
```

Expected headers:
```
Access-Control-Allow-Origin: https://medicare.uz
Access-Control-Allow-Credentials: true
```

---

## 🆘 If Still Not Working

### Checklist

- [ ] `FRONTEND_URL = https://medicare.uz` in Railway variables
- [ ] Backend redeployed after setting variable
- [ ] 2+ minutes passed since redeploy
- [ ] Logs show: `[INFO] Frontend URL: https://medicare.uz`
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Using `credentials: 'include'` in fetch

### Debug Steps

1. **Check logs**:
   ```
   Railway → Backend → Logs
   Search for: "Frontend URL"
   Should show: [INFO] Frontend URL: https://medicare.uz
   ```

2. **Verify variable was saved**:
   ```
   Railway → Backend → Variables
   FRONTEND_URL should be visible
   ```

3. **Check if using environment variable**:
   ```javascript
   // Add this temporarily to backend/server.js line 16:
   console.log('[DEBUG] FRONTEND_URL from env:', process.env.FRONTEND_URL);
   ```
   Redeploy and check logs.

4. **Test with curl**:
   ```bash
   curl -i https://medicarebackend-production.up.railway.app/api/health
   # Look for: Access-Control-Allow-Origin: https://medicare.uz
   ```

---

## 🎯 Summary

| Step | Action | When |
|------|--------|------|
| 1 | Set `FRONTEND_URL = https://medicare.uz` | Right now |
| 2 | Click "Redeploy" | Right after step 1 |
| 3 | Wait 2-3 minutes | For deployment |
| 4 | Check logs | After deployment |
| 5 | Clear browser cache | Before testing |
| 6 | Test API call | Once deployment done |

---

## 📞 Reference

**What Changed:**
- Nothing in code
- Only environment variable configuration

**Files to Check:**
- `backend/server.js` (line 10, 23-27)
- Railway Dashboard → Backend → Variables

**Key Variable:**
```
FRONTEND_URL=https://medicare.uz
```

**Next Steps:**
1. Set variable in Railway ✓
2. Redeploy ✓
3. Test API call ✓

---

**Expected Result**: ✅ API calls work from `https://medicare.uz`

---

**Last Updated**: February 2, 2026
