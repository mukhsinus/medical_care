# Railway Deployment Checklist

## 📋 Pre-Deployment (Local)

- [ ] Code is pushed to GitHub
- [ ] `backend/.env` has no real credentials (only placeholders)
- [ ] All dependencies in `backend/package.json` are listed
- [ ] Backend starts locally: `npm start` works on localhost:8090

## 🛣️ Railway Setup Phase 1: Services

- [ ] Railway account created at https://railway.app
- [ ] GitHub repository connected to Railway
- [ ] Project created in Railway
- [ ] MongoDB service added from Marketplace
- [ ] MongoDB service shows "Running" status (green)

## 🔧 Railway Setup Phase 2: Variables (CRITICAL)

Set these 5 variables in Backend Service → Variables:

### Variable 1: PORT
- [ ] Name: `PORT`
- [ ] Value: `8090`
- [ ] Secret: No

### Variable 2: NODE_ENV  
- [ ] Name: `NODE_ENV`
- [ ] Value: `production`
- [ ] Secret: No

### Variable 3: MONGO_URI
- [ ] Name: `MONGO_URI`
- [ ] Value: Copy from MongoDB service Variables
- [ ] Secret: **YES** (mark as secret)
- [ ] ⚠️ Verify format: `mongodb+srv://...`

### Variable 4: JWT_SECRET
- [ ] Name: `JWT_SECRET`
- [ ] Value: Run `npm run generate-secret` locally and copy output
- [ ] Secret: **YES** (mark as secret)
- [ ] ⚠️ Should be 64-character hex string

### Variable 5: FRONTEND_URL
- [ ] Name: `FRONTEND_URL`
- [ ] Value: Get from Frontend Service → Settings → Domain
- [ ] Secret: No
- [ ] ⚠️ Include `https://` and domain (e.g., https://frontend-abc123.railway.app)

## 🚀 Railway Setup Phase 3: Deploy

- [ ] All 5 environment variables are set in Railway
- [ ] Backend service ready for deploy
- [ ] Click "Redeploy" in Deployments tab (OR push code to GitHub for auto-deploy)
- [ ] Wait 2-3 minutes for build and startup

## ✅ Railway Setup Phase 4: Verify

### Check Logs
- [ ] Open Backend Service → Logs tab
- [ ] See message: `[STARTUP] Backend starting...`
- [ ] See message: `[INFO] Connecting to MongoDB...`
- [ ] See message: `[SUCCESS] Connected to MongoDB` ✨
- [ ] See message: `[SUCCESS] Server listening on 0.0.0.0:8090` ✨
- [ ] No `[ERROR]` messages visible

### Test Health Endpoint
- [ ] Open browser and visit: `https://<your-backend-domain>/api/health`
- [ ] Status code should be: `200 OK` ✨
- [ ] Response should be: 
  ```json
  {
    "ok": true,
    "time": "2024-...",
    "environment": "production"
  }
  ```

### Check Backend Service Status
- [ ] Overview tab shows: `Running` (green circle)
- [ ] Last deployment: `Successful` (green)
- [ ] Health check: `Healthy` (green)

## 🔗 Frontend Integration Phase 5

- [ ] Frontend React code updated with backend API URL
- [ ] API URL set to: `https://<your-railway-backend-domain>`
- [ ] CORS is not blocking (no 'Access-Control-Allow-Origin' errors)
- [ ] Frontend deployed to Railway
- [ ] Frontend → Backend API calls work ✨

## 🐛 Troubleshooting Checklist

If something isn't working:

### Symptom: Build Failed
- [ ] Check "Build" logs for npm install errors
- [ ] Ensure `backend/package.json` is valid JSON
- [ ] Ensure `backend/package-lock.json` exists
- [ ] Check for typos in dependencies

### Symptom: Build Success but Service Won't Start
- [ ] Check startup logs for `[ERROR]` messages
- [ ] Verify all 5 environment variables are set
- [ ] Check MONGO_URI format is `mongodb+srv://...`
- [ ] Wait 2 minutes (MongoDB startup is slow)

### Symptom: MongoDB Connection Timeout
- [ ] Verify MongoDB service is running (green status)
- [ ] Check MONGO_URI is correct (copy from MongoDB Variables again)
- [ ] Wait 3 minutes and redeploy (first startup is slow)
- [ ] Check MongoDB credentials are correct in connection string

### Symptom: Health endpoint returns 502/503
- [ ] Check service logs for crashes
- [ ] Verify PORT is set to `8090`
- [ ] Check NODE_ENV is `production`
- [ ] Try redeploying

### Symptom: CORS errors on frontend
- [ ] Check FRONTEND_URL matches your frontend Railway domain exactly
- [ ] Verify URL includes `https://`
- [ ] Clear frontend browser cache (Ctrl+Shift+Delete)
- [ ] Redeploy backend after changing FRONTEND_URL

### Symptom: Database queries fail but health check works
- [ ] Backend can start but can't reach MongoDB
- [ ] Check MONGO_URI credentials are correct
- [ ] Verify MongoDB service is running
- [ ] Check for firewall/network issues

## 📊 Final Status Check

### Backend Ready For Production When:

✅ All checks above are complete  
✅ Logs show no [ERROR] messages  
✅ Health endpoint returns 200 OK  
✅ Frontend → Backend communication works  
✅ Database queries execute successfully  
✅ No CORS errors in console  
✅ All 5 environment variables are set  
✅ MongoDB service is running and healthy  

## 🎯 Deployment Milestones

1. **Pre-Deploy** ← Start here
   - Time: 5 min
   - Check local setup works

2. **Services Setup** 
   - Time: 2 min
   - Create MongoDB service

3. **Environment Config** ⚠️ CRITICAL
   - Time: 3 min
   - Set all 5 variables
   - This is where most people get stuck!

4. **Deploy & Verify**
   - Time: 5 min
   - Redeploy and check logs

5. **Integration**
   - Time: 5 min
   - Connect frontend
   - Test end-to-end

**Total Time**: ~20 minutes (first time)

## 🆘 Need Help?

1. **See logs** → Backend Service → Logs tab
2. **Check variables** → Backend Service → Variables tab
3. **Read guide** → [RAILWAY_TROUBLESHOOTING.md](RAILWAY_TROUBLESHOOTING.md)
4. **Test locally** → `npm start` in backend folder
5. **Still stuck?** → Check GitHub Issues or Railway Discord

## 📝 Notes Section

Use this space to track your setup:

```
Backend Domain: https://_________________________
MongoDB Status: ________________________________
Variables Set: ✓ ___ ✓ ___ ✓ ___ ✓ ___ ✓ ___
Last Issue: ____________________________________
Solution: ______________________________________
```

---

**Use this checklist**: Keep this open in browser while setting up  
**Share with team**: Copy to share your deployment status  
**Reference later**: Use for future deployments or troubleshooting  

✨ **You've got this! Happy deploying!** ✨
