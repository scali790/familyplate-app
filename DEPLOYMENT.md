# FamilyPlate Backend Deployment Guide

## Overview

This guide will help you deploy the FamilyPlate backend API to Vercel with Postgres database.

---

## Prerequisites

1. **Vercel Account** (free tier works fine)
2. **Mailjet API Credentials**
   - API Key
   - Secret Key
   - Sender email: noreply@familyplate.ai
3. **GitHub Account** (optional, for Git-based deployment)

---

## Deployment Steps

### Option A: Deploy via Vercel CLI (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Deploy from Project Directory

```bash
cd /path/to/easyplate
vercel --prod
```

#### 4. Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No
- **Project name?** familyplate-api (or your choice)
- **Directory?** ./ (current directory)
- **Override settings?** No

---

### Option B: Deploy via Vercel Dashboard

#### 1. Create ZIP file
- Download the project as ZIP
- Or use: `zip -r familyplate-backend.zip . -x "node_modules/*" ".git/*"`

#### 2. Upload to Vercel
- Go to https://vercel.com/new
- Click "Import Project"
- Upload ZIP file
- Click "Deploy"

---

## Database Setup

### 1. Create Vercel Postgres Database

1. Go to your project dashboard on Vercel
2. Click **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose region (closest to your users)
6. Click **Create**

### 2. Connect Database to Project

Vercel automatically adds these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### 3. Run Database Migrations

**Important:** You need to update the schema to use Postgres.

#### Update drizzle.config.ts:

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./drizzle/schema-postgres.ts", // Use Postgres schema
  out: "./drizzle/migrations",
  dialect: "postgresql", // Change from mysql2 to postgresql
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config;
```

#### Update server database connection:

In `server/_core/db.ts`, change from MySQL to Postgres:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../drizzle/schema-postgres";

const connectionString = process.env.POSTGRES_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

#### Run migrations:

```bash
# Generate migration files
pnpm drizzle-kit generate

# Apply migrations to Vercel Postgres
pnpm drizzle-kit migrate
```

---

## Environment Variables

### Required Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `POSTGRES_URL` | (auto-set by Vercel) | Database connection string |
| `MAILJET_API_KEY` | Your Mailjet API key | Email service |
| `MAILJET_SECRET_KEY` | Your Mailjet secret | Email service |
| `MAILJET_SENDER_EMAIL` | noreply@familyplate.ai | From email address |
| `JWT_SECRET` | (generate random string) | For session tokens |
| `FRONTEND_URL` | https://www.familyplate.ai | For magic link redirects |

### Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Update Marketing Website

After deployment, update the API URL in your marketing website:

### File: `index.html`

**Line ~470:**

```javascript
// OLD (sandbox URL)
const API_URL = 'https://3000-i8v4ix5aa7f1zts081bl0-ce872828.sg1.manus.computer/api/trpc';

// NEW (production URL)
const API_URL = 'https://your-project-name.vercel.app/api/trpc';
```

Replace `your-project-name` with your actual Vercel project URL.

### Redeploy Website

1. Update `index.html` with new API_URL
2. Create new ZIP file
3. Upload to Vercel (marketing website project)
4. Test signup flow

---

## Testing Deployment

### 1. Test API Health

```bash
curl https://your-project-name.vercel.app/api/health
```

Should return: `{"status":"ok"}`

### 2. Test Magic Link

Go to www.familyplate.ai and try signing up with your email.

**Expected flow:**
1. Enter email → Click "Get Started"
2. Receive email from noreply@familyplate.ai
3. Click magic link → Redirected to app
4. Successfully logged in

### 3. Check Logs

```bash
vercel logs your-project-name --prod
```

Or view in Vercel Dashboard → Project → Logs

---

## Troubleshooting

### Database Connection Errors

**Error:** `Connection refused` or `ECONNREFUSED`

**Fix:**
- Verify `POSTGRES_URL` is set in environment variables
- Check database is created and running in Vercel Storage
- Ensure schema is migrated (`pnpm db:push`)

### Email Not Sending

**Error:** `Mailjet authentication failed`

**Fix:**
- Verify `MAILJET_API_KEY` and `MAILJET_SECRET_KEY` are correct
- Check sender email is verified in Mailjet dashboard
- Review Mailjet logs for delivery issues

### CORS Errors

**Error:** `Access-Control-Allow-Origin` error in browser console

**Fix:**
- Update CORS configuration in `server/_core/index.ts`
- Add your marketing website domain to allowed origins:

```typescript
app.use(cors({
  origin: ['https://www.familyplate.ai', 'https://familyplate.ai'],
  credentials: true
}));
```

### 404 on API Routes

**Error:** `/api/trpc/...` returns 404

**Fix:**
- Check `vercel.json` routes configuration
- Ensure build completed successfully
- Verify `server/_core/index.ts` exports correctly

---

## Monitoring & Maintenance

### View Analytics

- Go to Vercel Dashboard → Project → Analytics
- Monitor request counts, errors, response times

### Check Database Usage

- Go to Vercel Dashboard → Storage → Postgres
- View connection count, storage size, query performance

### Update Dependencies

```bash
pnpm update
vercel --prod  # Redeploy with updates
```

### Backup Database

```bash
# Export data
pg_dump $POSTGRES_URL > backup.sql

# Or use Vercel CLI
vercel env pull .env.production
```

---

## Cost Estimates

### Vercel Free Tier Includes:
- ✅ 100 GB bandwidth/month
- ✅ 100 hours serverless function execution
- ✅ Unlimited API requests
- ✅ 1 Postgres database (60 hours compute/month)

### Mailjet Free Tier:
- ✅ 6,000 emails/month
- ✅ 200 emails/day

**Expected costs for < 1000 users:** $0/month (free tier sufficient)

---

## Production Checklist

Before going live:

- [ ] Database migrated to Postgres
- [ ] All environment variables set
- [ ] Mailjet credentials configured
- [ ] Marketing website API URL updated
- [ ] Test magic link signup flow
- [ ] Test meal plan generation
- [ ] Test family voting
- [ ] Check error logs
- [ ] Set up monitoring alerts
- [ ] Document any custom configurations

---

## Support

**For deployment issues:**
- Check Vercel logs: `vercel logs --prod`
- Review this documentation
- Check Vercel status: https://www.vercel-status.com/

**For application bugs:**
- Check server logs in Vercel Dashboard
- Review database queries in Postgres dashboard
- Test API endpoints with curl/Postman

---

## Quick Reference

**Deploy Command:** `vercel --prod`  
**View Logs:** `vercel logs --prod`  
**Environment Variables:** Vercel Dashboard → Settings → Environment Variables  
**Database:** Vercel Dashboard → Storage → Postgres  
**API Health Check:** `https://your-project.vercel.app/api/health`  

---

*Last updated: January 5, 2026*
