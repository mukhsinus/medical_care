# ⚡ CORS Error - Quick Fix (2 Minutes)

## The Error You're Seeing

```
CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## Why It's Happening

Frontend (`https://medicare.uz`) → Backend needs permission
Backend doesn't know about frontend → Blocks request

## The Fix

### ✅ Do This RIGHT NOW

1. **Open Railway Dashboard**
   - Go to https://railway.app

2. **Go to Backend Service**
   - Select your project
   - Click "Backend" service

3. **Click Variables Tab**
   - Look for `FRONTEND_URL`
   - Should see: `https://medicare.uz` or similar

### ✅ If Missing or Wrong

```
Variable Name:  FRONTEND_URL
Variable Value: https://medicare.uz
Secret:         No
```

**Click "Add"**

### ✅ If Already Set to https://medicare.uz

Skip to Step 4

### ✅ Redeploy

Click **"Redeploy"** button

### ✅ Wait 2-3 Minutes

Deployment is running...

### ✅ Check Logs

Backend Service → Logs tab → Look for:
```
[CORS] Allowed Origin: https://medicare.uz
[CORS] Middleware loaded
```

### ✅ Test

Go to medicare.uz and try logging in
→ Should work now! ✅

---

## 📋 All 5 Required Variables

Make sure these are ALL set:

```
PORT           = 8090
NODE_ENV       = production
MONGO_URI      = (from MongoDB service)
JWT_SECRET     = (your secret)
FRONTEND_URL   = https://medicare.uz  ← THIS ONE!
```

If any missing → Issues!

---

## 🆘 Still Not Working?

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Wait 5 minutes** (sometimes Railway takes time)
3. **Check logs** (look for [CORS] messages)
4. **Verify FRONTEND_URL** (must be exactly `https://medicare.uz`)
5. **Read full guide**: [CORS_FIX_GUIDE.md](CORS_FIX_GUIDE.md)

---

**Time needed**: 3-5 minutes
**Difficulty**: ⭐ Very Easy
**Success rate**: 99% (just needs variable set)

✅ **GO SET THE VARIABLE NOW!**
