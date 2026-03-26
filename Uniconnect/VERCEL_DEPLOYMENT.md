# Vercel Deployment Guide

## Backend on Vercel Serverless Functions

Your backend is now configured to run as Vercel Serverless Functions:
- `api/verify-account.js` - Handles account verification
- `api/transfer.js` - Handles money transfers

These functions automatically run when you deploy to Vercel.

## Setup Steps

### 1. Ensure .env files are protected
Check that `.gitignore` includes:
```
.env
.env.local
server/.env
server/.env.local
```

### 2. Deploy to Vercel

If using Vercel CLI:
```bash
npm install -g vercel
vercel login
vercel --prod
```

Or push to your GitHub repo and Vercel will auto-deploy (if already connected).

### 3. Set Environment Variables on Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables for all environments (Production, Preview, Development):

**Variable 1:**
- Name: `PAYSTACK_SECRET_KEY`
- Value: `sk_live_xxxxx` (or `sk_test_xxxxx` for testing)

**Variable 2 (optional, if you keep the standalone server):**
- Name: `FRONTEND_ORIGIN`
- Value: Your frontend domain (e.g., `https://yourdomain.vercel.app`)

### 4. Update Frontend Config (if needed)

On Vercel, your frontend and API are on the same domain, so:
- **Locally:** Frontend calls `http://localhost:4000/api/*` (or standalone server) if you still run it
- **On Vercel:** Frontend calls `/api/*` automatically (no env var needed)

The `getApiBase()` function in `SendMoneyPage.jsx` and `FundWalletPage.jsx` handles this automatically.

### 5. Redeploy After Setting Env Vars

After adding env vars:
```bash
vercel --prod
```

Or trigger a redeploy in Vercel Dashboard → Deployments → Redeploy.

## Verify It Works

1. Go to your Vercel domain (e.g., `https://yourdomain.vercel.app`)
2. Navigate to Send Money page
3. Try to verify an account — the request should go to `/api/verify-account` (check Network tab in DevTools)
4. You should see the account name displayed (or Paystack error if invalid)

## Troubleshooting

**If you get "Invalid key" on Vercel:**
- Double-check the `PAYSTACK_SECRET_KEY` value in Vercel env vars (copy-paste from Paystack dashboard)
- Ensure it starts with `sk_` (not `pk_`)
- Redeploy after setting env vars

**If API calls fail with CORS:**
- The serverless functions already have CORS headers set in `api/verify-account.js` and `api/transfer.js`
- If still failing, check Vercel Function logs: Dashboard → Project → Functions → select the failing function

**To view function logs:**
- Vercel Dashboard → Project → Functions tab
- Click on `verify-account` or `transfer`
- See real-time logs of function execution

## Keep Your Local Server (Optional)

You can still run the local Express server for development:
```bash
cd server
npm start
# Runs on http://localhost:4000
```

When testing locally with `npm run dev`, it will use `http://localhost:4000`. When deployed on Vercel, it will use `/api`.

## Summary

✅ Backend deployed on Vercel (serverless)
✅ Frontend automatically calls the right endpoint (local or Vercel)
✅ Environment variables protected
✅ Ready for production
