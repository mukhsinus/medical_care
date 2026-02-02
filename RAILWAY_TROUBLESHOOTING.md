# Railway Backend Troubleshooting Guide

## Issue: "backend not working on railway"

This guide helps you diagnose and fix the backend issues on Railway.

## Pre-Deployment Checklist

### ✓ 1. Backend Service Configuration
- [ ] Backend service created in Railway
- [ ] GitHub repository connected
- [ ] Start command set to: `npm start`
- [ ] Port set to: `8090`

### ✓ 2. MongoDB Service
- [ ] MongoDB service added to Railway project
- [ ] MongoDB service is in RUNNING state
- [ ] Connection string copied (should look like `mongodb+srv://...`)

### ✓ 3. Environment Variables Set

All these must be set in Railway backend service variables:

```
✓ PORT=8090
✓ NODE_ENV=production
✓ MONGO_URI=<from MongoDB service>
✓ JWT_SECRET=<64-char hex string>
✓ FRONTEND_URL=<your Railway frontend domain>
```

## Testing Steps

### Step 1: Check Service Status
```
In Railway Dashboard:
1. Go to backend service
2. Status should show: "Running" (green)
3. If red/orange, click "View Logs"
```

### Step 2: Check Build Logs
```
In Railway Dashboard:
1. Click "Deployments" tab
2. Latest deployment should show: "Build Successful"
3. If failed, expand and see error message
```

### Step 3: Check Application Logs
```
In Railway Dashboard:
1. Click "Logs" tab
2. Should see:
   - [STARTUP] Backend starting...
   - [STARTUP] Node version: v18.x.x
   - [INFO] Connecting to MongoDB:...
   - [SUCCESS] Connected to MongoDB
   - [SUCCESS] Server listening on 0.0.0.0:8090
```

### Step 4: Test Health Endpoint
```
In browser or curl:
https://<your-railway-backend-domain>/api/health

Expected response:
{
  "ok": true,
  "time": "2024-02-02T10:30:00.000Z",
  "environment": "production"
}
```

## Common Error Messages & Fixes

### Error: "MONGO_URI not set"

**Log Output:**
```
[INFO] Connecting to MongoDB: mongodb://localhost:27017/medical_care
[ERROR] Failed to start server: getaddrinfo ENOTFOUND localhost
```

**Fix:**
1. Go to Railway MongoDB service
2. Copy connection string (looks like: `mongodb+srv://admin:password@cluster.mongodb.net/database`)
3. Go to backend service → Variables
4. Set `MONGO_URI=<paste connection string>`
5. Redeploy

### Error: "Timeout while connecting to MongoDB"

**Log Output:**
```
[INFO] Connecting to MongoDB: mongodb+srv://...
[ERROR] Failed to start server: connect ETIMEDOUT
```

**Causes:**
- MongoDB service not fully started yet (takes 1-2 minutes)
- MongoDB credentials wrong
- Firewall/network issue

**Fix:**
1. Wait 2-3 minutes and redeploy
2. Verify MONGO_URI credentials are correct
3. Check MongoDB service is running (green status)
4. If still fails, delete and recreate MongoDB service

### Error: "JWT_SECRET not found"

**Log Output:**
```
[ERROR] jwt.sign requires a secret
```

**Fix:**
1. Run locally: `npm run generate-secret`
2. Copy the output
3. In Railway backend variables: `JWT_SECRET=<paste>`
4. Redeploy

### Error: "CORS error on frontend"

**Browser Console:**
```
Access to XMLHttpRequest at 'https://backend.railway.app/api/auth' from origin 'https://frontend.railway.app' has been blocked by CORS policy
```

**Fix:**
1. Go to backend service → Variables
2. Set `FRONTEND_URL=https://frontend.railway.app` (your exact frontend domain)
3. Redeploy
4. Clear frontend browser cache (Ctrl+Shift+Delete)

### Error: Port Already in Use

**Log Output:**
```
[ERROR] listen EADDRINUSE: address already in use :::8090
```

**Fix:**
1. Railway auto-manages ports, this shouldn't happen
2. If it does, redeploy: click "Redeploy" in Railway dashboard
3. Check if PORT variable is conflicting

### Error: "Cannot find module 'express'"

**Log Output:**
```
[ERROR] Cannot find module 'express'
Error: Cannot find module 'express'
```

**Fix:**
1. Check `backend/package.json` has all dependencies
2. In Railway, verify build command is: `npm install`
3. Check `backend/package-lock.json` is in git
4. Run locally to test: `npm install && npm start`

## Manual Deployment Steps

If auto-deploy from GitHub isn't working:

### Option 1: Redeploy Current Code
```
In Railway Dashboard:
1. Go to backend service
2. Click "Deployments"
3. Find latest deployment
4. Click three dots (...)
5. Select "Redeploy"
```

### Option 2: Manual Push
```bash
# From your local machine
git add -A
git commit -m "fix: railway backend config"
git push origin main

# Wait 2-3 minutes for auto-deploy
# Check Railway dashboard for build progress
```

### Option 3: Test Locally First
```bash
cd backend
npm install
PORT=8090 MONGO_URI=mongodb://localhost:27017/medical_care NODE_ENV=development npm start

# Should see:
# [STARTUP] Backend starting...
# [SUCCESS] Connected to MongoDB
# [SUCCESS] Server listening on 0.0.0.0:8090

# Test in another terminal:
curl http://localhost:8090/api/health
```

## Advanced Debugging

### View All Environment Variables (in logs)

Temporarily add this to `backend/server.js` after line 15:

```javascript
console.log('[DEBUG] Environment:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGO_URI: process.env.MONGO_URI ? '***SET***' : '***NOT SET***',
  JWT_SECRET: process.env.JWT_SECRET ? '***SET***' : '***NOT SET***',
  FRONTEND_URL: process.env.FRONTEND_URL,
});
```

Then redeploy and check logs.

### MongoDB Connection Debugging

Add this to see actual connection errors:

```javascript
mongoose.connection.on('error', err => {
  console.error('[MONGOOSE] Connection error:', err.message);
  console.error('[MONGOOSE] Stack:', err.stack);
});
```

### Check Service Logs via CLI

If you have Railway CLI installed:

```bash
# Login to Railway
railway login

# Link to project
railway link <project-id>

# View logs
railway logs --service backend

# View environment variables
railway env
```

## Health Check Monitoring

The `/api/health` endpoint returns:
```json
{
  "ok": true,
  "time": "2024-02-02T10:30:00.000Z",
  "environment": "production"
}
```

Railway can use this for automatic health checks:
1. Go to backend service
2. Settings → Health Check
3. Set path to: `/api/health`
4. Set interval to: `30` seconds

## Getting Help

If you're still stuck:

1. **Check Railway Status Page**: https://status.railway.app
2. **Export Full Logs**: Click "Download Logs" in Railway dashboard
3. **Share with Support**:
   - Latest 50 lines of logs
   - Environment variables set (without secrets)
   - Build/Deploy step that failed

## Success Indicators

You'll know it's working when:

✅ MongoDB service shows "Connected" in logs
✅ Backend service shows "[SUCCESS] Server listening"
✅ Health endpoint returns 200 status
✅ Frontend can reach backend API
✅ No 502/503 errors

---

**Last Updated**: February 2, 2026
**Backend Version**: 1.0.0
