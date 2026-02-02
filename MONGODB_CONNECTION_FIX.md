# 🔧 MongoDB Connection Error - Quick Fix

## The Problem

```
Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"
```

**Cause**: MONGO_URI variable in Railway is either:
1. Not set
2. Set incorrectly (maybe has "MONGO_URI=" prefix)
3. Has extra spaces or special characters

---

## ✅ The Fix (2 Minutes)

### Step 1: Open Railway Dashboard

Go to: https://railway.app

### Step 2: Backend Service → Variables

Click: Backend Service → Variables tab

### Step 3: Check MONGO_URI

**Look for**: `MONGO_URI` variable

**If Missing:**
```
Click "New Variable"
Name: MONGO_URI
Value: mongodb+srv://TopUser:mskforever@cluster0.xlbowez.mongodb.net/?appName=Cluster0
```

**If Present But Showing Asterisks:**
```
Click the three dots (...)
Select "Edit"
Make sure it contains ONLY the connection string:
  mongodb+srv://TopUser:mskforever@cluster0.xlbowez.mongodb.net/?appName=Cluster0

NOT: MONGO_URI=mongodb+srv://...
NOT: mongodb+srv://TopUser:mskforever@cluster0.xlbowez.mongodb.net/?appName=Cluster0
(with extra spaces at start/end)
```

### Step 4: Save and Redeploy

```
Click "Save"
Go to Deployments tab
Click "Redeploy"
Wait 2-3 minutes
```

### Step 5: Check Logs

Backend Service → Logs tab

Look for one of these:

**✅ Success:**
```
[SUCCESS] Connected to MongoDB
```

**❌ Still Failing:**
```
[DEBUG] MONGO_URI value (first 50 chars): mongodb+srv://TopUser:...
[DEBUG] MONGO_URI length: 130
[ERROR] Failed to start server: ...
```

---

## 🎯 Exact Connection String to Use

Copy this exactly (no changes):

```
mongodb+srv://TopUser:mskforever@cluster0.xlbowez.mongodb.net/?appName=Cluster0
```

---

## 🚨 Common Mistakes

| ❌ Wrong | ✅ Right |
|---------|---------|
| `MONGO_URI=mongodb+srv://...` | `mongodb+srv://...` |
| ` mongodb+srv://...` (space at start) | `mongodb+srv://...` |
| `mongodb+srv://...` (space at end) | `mongodb+srv://...` |
| `mongodb://localhost:27017` | `mongodb+srv://TopUser:...` |
| Empty/blank | `mongodb+srv://TopUser:...` |

---

## 📋 Checklist

- [ ] Go to Railway Dashboard
- [ ] Backend Service → Variables
- [ ] Check MONGO_URI exists
- [ ] Value is: `mongodb+srv://TopUser:mskforever@cluster0.xlbowez.mongodb.net/?appName=Cluster0`
- [ ] No extra spaces or "MONGO_URI=" prefix
- [ ] Click "Redeploy"
- [ ] Wait 2-3 minutes
- [ ] Check logs for [SUCCESS]

---

## 🆘 If Still Not Working

Check these variables too:

```
PORT           = 8090
NODE_ENV       = production
JWT_SECRET     = (some secret)
FRONTEND_URL   = https://medicare.uz
```

If any are missing, add them!

---

**After fixing, redeploy and check logs!**
