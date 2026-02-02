# Railway Deployment Guide for Medical Care Backend

## Issues Fixed

1. **Better MongoDB Connection Handling** - Added timeout settings and retryWrites for production
2. **Improved Error Logging** - Added detailed startup logs to debug connection issues
3. **Graceful Shutdown** - Added SIGTERM handler for proper container shutdown
4. **Environment Variables** - Cleared .env file; use Railway dashboard to set variables

## Railway Setup Steps

### 1. Create Railway Project
- Go to https://railway.app
- Create new project
- Connect your GitHub repository

### 2. Add MongoDB Service
```
1. In Railway dashboard, click "Add"
2. Select "Add from Marketplace"
3. Search and select "MongoDB"
4. Click "Add MongoDB"
```

### 3. Set Backend Environment Variables

In Railway, go to your backend service and set these variables:

```
PORT=8090
NODE_ENV=production
MONGO_URI=<copy from MongoDB service variables - usually shows as DATABASE_URL or MONGO_URL>
JWT_SECRET=<generate a secure random string - use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
FRONTEND_URL=<your-frontend-railway-domain>
COOKIE_NAME=token
TELEGRAM_BOT_TOKEN=<your telegram bot token>
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=<your mailtrap user>
MAIL_PASS=<your mailtrap pass>
MAIL_FROM=no-reply@yourdomain.com
PAYME_MERCHANT_ID=<your merchant id>
PAYME_SECRET_KEY=<your secret key>
CLICK_MERCHANT_ID=<your merchant id>
CLICK_SECRET_KEY=<your secret key>
CLICK_SERVICE_ID=89457
```

### 4. Connect MongoDB Service

In your backend service in Railway:
1. Click "Variables"
2. Look for MongoDB connection string provided by the MongoDB service
3. Use it as MONGO_URI value

**Important**: Make sure MongoDB service and backend are in the same Railway project so they can connect.

### 5. Deploy Backend

#### Option A: Via GitHub (Recommended)
1. Push code to GitHub
2. Railway auto-deploys on push

#### Option B: Manual Trigger
1. In Railway dashboard, go to backend service
2. Click "Deploy" 

### 6. Verify Deployment

After deployment, test with:
```
https://<your-railway-domain>/api/health
```

Should return:
```json
{
  "ok": true,
  "time": "2024-...",
  "environment": "production"
}
```

### 7. Check Logs

In Railway dashboard:
1. Go to backend service
2. Click "Logs" tab
3. Look for "[SUCCESS] Connected to MongoDB"
4. If there are errors, they'll show "[ERROR]" prefix

## Common Issues & Solutions

### Issue: "Telegram bot token missing"
**Solution**: This is a warning, not an error. Set `TELEGRAM_BOT_TOKEN` in Railway variables if you want notifications.

### Issue: "MONGO_URI not found"
**Solution**: 
1. Add MongoDB service to Railway project
2. Wait 1-2 minutes for it to be ready
3. Copy the connection string from MongoDB service variables
4. Paste into backend MONGO_URI variable

### Issue: CORS errors on frontend
**Solution**: 
1. Set `FRONTEND_URL` to your frontend Railway domain (e.g., `https://abc123.railway.app`)
2. Redeploy backend

### Issue: "Connection timeout after 5000ms"
**Solution**: This usually means MongoDB service is not responding. Check:
1. MongoDB service is running in Railway
2. MONGO_URI is correctly set
3. Wait a few minutes and retry (first startup can be slow)

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-----------|----------|---------|
| PORT | Server port | No | 8090 |
| NODE_ENV | Environment | No | production |
| MONGO_URI | MongoDB connection string | Yes | mongodb+srv://user:pass@cluster.mongodb.net/db |
| JWT_SECRET | JWT signing secret | Yes | random-32-char-string |
| FRONTEND_URL | Frontend domain for CORS | No | https://frontend.railway.app |
| TELEGRAM_BOT_TOKEN | Telegram bot token | No | 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11 |

## Local Development vs Railway

### Local (.env)
```
MONGO_URI=mongodb://localhost:27017/medical_care
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Railway (via Dashboard)
```
MONGO_URI=<from MongoDB service>
FRONTEND_URL=<your railway domain>
NODE_ENV=production
```

## Next Steps

1. Set up MongoDB service in Railway
2. Add all required environment variables
3. Redeploy backend
4. Check logs for "[SUCCESS] Connected to MongoDB"
5. Test `/api/health` endpoint
6. Connect frontend to backend API

## Support Resources

- Railway Docs: https://docs.railway.app
- MongoDB Atlas Connection: https://docs.atlas.mongodb.com/
- Express on Railway: https://docs.railway.app/guides/nodejs
