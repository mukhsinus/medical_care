# 🚀 Railway Backend Fix - Quick Start

## What Was Fixed

✅ **Enhanced Server Logging** - Better debugging with colored output [SUCCESS], [ERROR], [INFO]
✅ **MongoDB Connection** - Added timeout settings (5s) and retryWrites for reliability
✅ **Graceful Shutdown** - Proper SIGTERM handling for Railway container restarts
✅ **Security** - Cleared hardcoded credentials from .env

## 3-Minute Setup for Railway

### Step 1: Set Environment Variables in Railway Dashboard

```
PORT=8090
NODE_ENV=production
MONGO_URI=<MongoDB connection string from Railway service>
JWT_SECRET=<run: npm run generate-secret>
FRONTEND_URL=<your railway frontend domain>
```

### Step 2: Generate Secure JWT Secret (Local)

```bash
cd backend
npm run generate-secret
# Copy the output and paste into RAILWAY_JWT_SECRET
```

### Step 3: Add MongoDB Service

1. In Railway dashboard → Add → Add from Marketplace → MongoDB
2. Railway will provide connection string automatically

### Step 4: Deploy

```bash
git push  # Railway auto-deploys
```

### Step 5: Verify

Check: `https://<your-railway-domain>/api/health`

Should return:
```json
{
  "ok": true,
  "time": "2024-...",
  "environment": "production"
}
```

## If It Still Fails

**Check logs in Railway**:
1. Go to backend service
2. Click "Logs" tab
3. Look for `[ERROR]` messages

### Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `MONGO_URI not found` | Add MongoDB service, copy connection string to MONGO_URI |
| `Connection timeout` | Wait 2 minutes, MongoDB needs time to start |
| `CORS error` | Set FRONTEND_URL to your Railway frontend domain |
| `JWT_SECRET undefined` | Run `npm run generate-secret` and add to Railway |

## Files Changed

- `backend/server.js` - Enhanced logging and error handling
- `backend/.env` - Cleared sensitive data
- `backend/package.json` - Added generate-secret script
- `backend/scripts/generate-jwt-secret.js` - New secret generator
- `railway.json` - Railway configuration
- `RAILWAY_DEPLOYMENT_GUIDE.md` - Full setup instructions

## Test Connection Locally (Before Railway)

```bash
cd backend
npm install
NODE_ENV=local npm start
```

Then test: `http://localhost:8090/api/health`

## Next: Connect Frontend

In your frontend React code, update the API URL:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://<railway-backend-domain>';
```

Deploy frontend and connect!
