# Railway Architecture & Environment Variables

## 🏗️ Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR GITHUB REPOSITORY                   │
│  (medical_care - pushed code auto-deploys to Railway)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓ (git push)
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY PLATFORM (railway.app)            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Backend Service (Node.js/Express)                   │   │
│  │  ✓ 0.0.0.0:8090 (listens)                           │   │
│  │  ✓ Auto-assigned public domain                       │   │
│  │  ✓ Health check: /api/health                        │   │
│  │  └─ Environment Variables: [see table below]         │   │
│  └──────────────────────────────────────────────────────┘   │
│            │                                                 │
│            ↓ (connects to)                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MongoDB Service                                     │   │
│  │  ✓ Database: medical_care                            │   │
│  │  ✓ Connection string: mongodb+srv://...              │   │
│  │  ✓ Auto-generated credentials                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         ↑                           ↑
         │ (API requests)            │ (DB queries)
         │                           │
┌────────┴───────────┐      ┌────────┴────────────────┐
│  Frontend (React)  │      │  Database (MongoDB)     │
│  (auto-deployed)   │      │  (auto-managed)         │
└────────────────────┘      └─────────────────────────┘
```

## 📊 Environment Variables Setup

### How to Set Variables in Railway

```
Railway Dashboard → Backend Service → Variables tab → Add Variable
```

### Required Variables

| Variable Name | Value | Where to Get | Required | Secret |
|---------------|-------|--------------|----------|--------|
| `PORT` | `8090` | Fixed value | ✓ | ✗ |
| `NODE_ENV` | `production` | Fixed value | ✓ | ✗ |
| `MONGO_URI` | See below ↓ | MongoDB service | ✓ | ✓ |
| `JWT_SECRET` | See below ↓ | Run generate-secret | ✓ | ✓ |
| `FRONTEND_URL` | `https://your-frontend-domain` | Railway frontend service | ✓ | ✗ |

### MONGO_URI - Where to Find It

```
Railway Dashboard:
1. Go to MongoDB Service
2. Click "Variables" tab
3. Look for connection string (usually named DATABASE_URL or MONGO_URL)
4. Copy the entire string
5. Paste into Backend Service → Variables → MONGO_URI
```

Example MONGO_URI:
```
mongodb+srv://admin:RandomPassword123@cluster0.mongodb.net/medical_care?retryWrites=true&w=majority
```

### JWT_SECRET - How to Generate It

```bash
# Run this locally:
cd backend
npm run generate-secret

# Output looks like:
# 3a1f8c9e2d4b7a6f1c9e3a2d4b7f1c9e3a1f8c9e2d4b7f1c9e3a2d4b7f1c9e

# Copy this 64-character string and paste into Railway Variables
```

### FRONTEND_URL - Where to Get It

```
Railway Dashboard:
1. Go to Frontend Service
2. Click "Settings"
3. Look for "Domain" or "Public URL"
4. It looks like: https://abc123-production.railway.app
5. Copy and paste into Backend Service → FRONTEND_URL
```

## 🔄 Data Flow During Request

```
Browser                         Railway                      Database
   │                              │                             │
   │ 1. GET /api/health           │                             │
   ├─────────────────────────────→│                             │
   │                              │ 2. Express handler          │
   │                              │    returns {ok:true,...}    │
   │ 3. Response                  │                             │
   │←─────────────────────────────┤                             │
   │                              │                             │
   │ 4. POST /api/auth/login      │                             │
   ├─────────────────────────────→│                             │
   │                              │ 5. Verify credentials       │
   │                              │ 6. Query user              │
   │                              ├────────────────────────────→│
   │                              │ 7. User data               │
   │                              │←────────────────────────────┤
   │                              │ 8. Sign JWT                │
   │ 9. Token + User Data         │                             │
   │←─────────────────────────────┤                             │
```

## ✅ Verification Checklist

### 1. Check Environment Variables are Set
```
Railway Dashboard → Backend Service → Variables
See this:
□ PORT = 8090
□ NODE_ENV = production
□ MONGO_URI = mongodb+srv://...
□ JWT_SECRET = 3a1f8c9e2d4b7a6f... (hidden with asterisks)
□ FRONTEND_URL = https://your-frontend-domain
```

### 2. Check Backend Service Status
```
Railway Dashboard → Backend Service → Overview
Should show:
□ Status: Running (green circle)
□ Last deployment: Successful (green)
□ Health: Healthy
```

### 3. Check Logs for Startup Messages
```
Railway Dashboard → Backend Service → Logs
Should contain (in order):
□ [STARTUP] Backend starting...
□ [INFO] Connecting to MongoDB...
□ [SUCCESS] Connected to MongoDB
□ [SUCCESS] Server listening on 0.0.0.0:8090
```

### 4. Test Health Endpoint
```
Open browser or curl:
https://<your-railway-backend-domain>/api/health

Should return (200 OK):
{
  "ok": true,
  "time": "2024-02-02T10:30:00.123Z",
  "environment": "production"
}
```

## 🔐 Security Best Practices

| Do ✓ | Don't ✗ |
|------|--------|
| Store secrets in Railway Dashboard | Commit secrets to git |
| Use `.env` with placeholders locally | Push real `.env` to GitHub |
| Hide `JWT_SECRET` value (mark as Secret) | Display JWT_SECRET in logs |
| Rotate `JWT_SECRET` periodically | Use same JWT_SECRET forever |
| Use secure `MONGO_URI` from MongoDB | Hard-code MongoDB credentials |
| Mark `MONGO_URI` as Secret variable | Share MongoDB connection string |

## 🚨 Common Issues & Solutions

### Issue: Variables Not Applied
```
Solution: Click "Redeploy" after adding variables
          (or push new code to GitHub)
```

### Issue: Wrong MONGO_URI Format
```
Wrong:  mongodb://localhost:27017
Correct: mongodb+srv://user:pass@cluster.mongodb.net/db
```

### Issue: FRONTEND_URL Missing https://
```
Wrong:  your-domain.railway.app
Correct: https://your-domain.railway.app
```

### Issue: JWT_SECRET Too Short
```
Wrong:  secret123
Correct: 3a1f8c9e2d4b7a6f1c9e3a2d4b7f1c9e3a1f8c9e2d4b7f1c9e3a2d4b7f1c9e
         (use: npm run generate-secret)
```

## 🎯 Step-by-Step Railway Setup

```
Step 1: Create Railway Project
   └─→ railway.app → New Project → Existing Repository

Step 2: Add MongoDB Service
   └─→ Add → Add from Marketplace → MongoDB

Step 3: Create Backend Service  
   └─→ Add → GitHub Repo → Select /backend → Deploy

Step 4: Set Environment Variables (5 min after Step 3)
   └─→ Backend Service → Variables → Add each variable

Step 5: Redeploy Backend
   └─→ Backend Service → Deployments → Redeploy Latest

Step 6: Verify Logs
   └─→ Backend Service → Logs → Check for [SUCCESS]

Step 7: Test Health Endpoint
   └─→ Browser → https://domain/api/health → Should work!

Step 8: Deploy Frontend
   └─→ Frontend Auto-deploys when you push code
```

---

**Last Updated**: February 2, 2026
**Quick Reference**: Keep this open while setting up Railway
