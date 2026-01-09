# FamilyPlate - Vercel Deployment Guide

**Last Updated:** January 9, 2026  
**Version:** 1.0

---

## Overview

This guide explains how to deploy the unified FamilyPlate Expo app to Vercel, which will serve both web and mobile users with a shared Postgres database.

---

## Prerequisites

✅ Vercel account with access to:
- `familyplate-webnew` project (frontend deployment)
- Vercel Postgres database (already created: `familyplate-production`)

✅ GitHub repository:
- Repo: `scali790/familyplate-frontend` (or create new one for Expo app)

✅ Required API keys:
- OpenAI API key (for meal generation)
- Mailjet API key + Secret (for magic link emails)

---

## Step 1: Set Up Vercel Postgres Database

### 1.1 Access Your Database

1. Go to: https://vercel.com/raphaels-projects-0b755ec5/storage
2. Click on **"familyplate-production"** database
3. Click on the **"Query"** tab

### 1.2 Run Database Migration

Copy and paste the following SQL into the Query tab and click **"Run Query"**:

\`\`\`sql
-- Create role enum
CREATE TYPE "public"."role" AS ENUM('user', 'admin');

-- Dish Votes Table (for taste onboarding)
CREATE TABLE IF NOT EXISTS "dish_votes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"user_id" integer NOT NULL,
	"dish_name" varchar(255) NOT NULL,
	"liked" integer NOT NULL,
	"context" varchar(50) DEFAULT 'meal_plan' NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Magic Link Tokens Table (for passwordless auth)
CREATE TABLE IF NOT EXISTS "magic_link_tokens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"token" varchar(64) NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" text,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "magic_link_tokens_token_unique" UNIQUE("token")
);

-- Meal Plans Table
CREATE TABLE IF NOT EXISTS "meal_plans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"user_id" integer NOT NULL,
	"week_start_date" varchar(10) NOT NULL,
	"meals" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Meal Votes Table (family voting)
CREATE TABLE IF NOT EXISTS "meal_votes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"meal_plan_id" integer NOT NULL,
	"meal_day" varchar(10) NOT NULL,
	"user_id" integer NOT NULL,
	"voter_name" varchar(100),
	"vote_type" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS "user_preferences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"user_id" integer NOT NULL,
	"family_name" varchar(100),
	"family_size" integer DEFAULT 2 NOT NULL,
	"cuisines" text,
	"flavors" text,
	"dietary_restrictions" text,
	"country" varchar(3) DEFAULT 'UAE',
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"units" varchar(10) DEFAULT 'metric' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"meat_frequency" integer DEFAULT 3 NOT NULL,
	"chicken_frequency" integer DEFAULT 3 NOT NULL,
	"fish_frequency" integer DEFAULT 3 NOT NULL,
	"vegetarian_frequency" integer DEFAULT 2 NOT NULL,
	"vegan_frequency" integer DEFAULT 1 NOT NULL,
	"spicy_frequency" integer DEFAULT 2 NOT NULL,
	"kid_friendly_frequency" integer DEFAULT 2 NOT NULL,
	"healthy_frequency" integer DEFAULT 3 NOT NULL,
	"taste_profile" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Users Table
CREATE TABLE IF NOT EXISTS "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week_start ON meal_plans(week_start_date);
CREATE INDEX IF NOT EXISTS idx_meal_votes_meal_plan_id ON meal_votes(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_dish_votes_user_id ON dish_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON magic_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens(email);
\`\`\`

### 1.3 Verify Tables Created

Run this query to verify all tables exist:

\`\`\`sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
\`\`\`

You should see:
- dish_votes
- magic_link_tokens
- meal_plans
- meal_votes
- user_preferences
- users

---

## Step 2: Get Database Connection Strings

1. In your Vercel Postgres dashboard, click on **".env.local"** tab
2. Copy the following environment variables:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

**Example:**
\`\`\`bash
POSTGRES_URL="postgresql://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
POSTGRES_PRISMA_URL="postgresql://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require&pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgresql://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
\`\`\`

---

## Step 3: Configure Environment Variables in Vercel

### 3.1 Access Project Settings

1. Go to: https://vercel.com/raphaels-projects-0b755ec5/familyplate-webnew
2. Click on **"Settings"** tab
3. Click on **"Environment Variables"** in left sidebar

### 3.2 Add Required Variables

Add the following environment variables (click **"Add New"** for each):

#### Database (from Step 2)
\`\`\`
POSTGRES_URL = postgresql://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require
POSTGRES_PRISMA_URL = postgresql://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require&pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING = postgresql://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require
DATABASE_URL = postgresql://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require
\`\`\`

#### Email (Mailjet)
\`\`\`
MAILJET_API_KEY = your_mailjet_api_key
MAILJET_SECRET_KEY = your_mailjet_secret_key
MAILJET_FROM_EMAIL = noreply@familyplate.ai
MAILJET_FROM_NAME = FamilyPlate
\`\`\`

#### AI (OpenAI)
\`\`\`
OPENAI_API_KEY = sk-your-openai-api-key
\`\`\`

#### App Configuration
\`\`\`
NODE_ENV = production
EXPO_PUBLIC_API_URL = https://familyplate-webnew.vercel.app
EXPO_PUBLIC_WEB_URL = https://familyplate-webnew.vercel.app
\`\`\`

**Important:** Select **"Production"**, **"Preview"**, and **"Development"** for all variables.

---

## Step 4: Prepare Expo App for Deployment

### 4.1 Update Local Environment

Create `.env.production` file in `/home/ubuntu/easyplate/`:

\`\`\`bash
# Database
POSTGRES_URL="your_postgres_url_here"
DATABASE_URL="your_postgres_url_here"

# Email
MAILJET_API_KEY="your_key"
MAILJET_SECRET_KEY="your_secret"
MAILJET_FROM_EMAIL="noreply@familyplate.ai"
MAILJET_FROM_NAME="FamilyPlate"

# AI
OPENAI_API_KEY="your_openai_key"

# App
NODE_ENV="production"
EXPO_PUBLIC_API_URL="https://familyplate-webnew.vercel.app"
EXPO_PUBLIC_WEB_URL="https://familyplate-webnew.vercel.app"
\`\`\`

### 4.2 Build Web Version

\`\`\`bash
cd /home/ubuntu/easyplate
pnpm install
pnpm build
\`\`\`

This creates a production build in `dist/` directory.

---

## Step 5: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

\`\`\`bash
cd /home/ubuntu/easyplate

# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
\`\`\`

Follow the prompts:
- Link to existing project: **Yes**
- Project name: **familyplate-webnew**
- Deploy: **Yes**

### Option B: Deploy via GitHub

1. Push code to GitHub:
\`\`\`bash
cd /home/ubuntu/easyplate
git init
git add .
git commit -m "Initial Expo app deployment"
git remote add origin https://github.com/scali790/familyplate-expo.git
git push -u origin main
\`\`\`

2. Connect GitHub repo to Vercel:
   - Go to Vercel dashboard
   - Click **"Import Project"**
   - Select your GitHub repo
   - Configure build settings:
     - **Build Command:** `pnpm build`
     - **Output Directory:** `dist`
     - **Install Command:** `pnpm install`

3. Click **"Deploy"**

---

## Step 6: Verify Deployment

### 6.1 Check Web App

1. Visit: https://familyplate-webnew.vercel.app
2. Test magic link login
3. Complete taste onboarding
4. Set preferences
5. Generate meal plan
6. Verify data persists after refresh

### 6.2 Check Mobile App

1. Update `EXPO_PUBLIC_API_URL` in mobile app to point to Vercel deployment
2. Rebuild mobile app
3. Test same flow as web
4. Verify same data appears on both platforms

---

## Step 7: Update DNS (Optional)

To use custom domain `familyplate.ai`:

1. Go to Vercel project settings
2. Click **"Domains"** tab
3. Add domain: `familyplate.ai`
4. Follow DNS configuration instructions
5. Update environment variables to use new domain

---

## Troubleshooting

### Database Connection Issues

**Error:** "Failed to connect to database"

**Solution:**
1. Verify `POSTGRES_URL` is correct
2. Check database is not paused (Vercel auto-pauses inactive databases)
3. Test connection in Vercel Postgres Query tab

### Magic Link Emails Not Sending

**Error:** "Failed to send magic link"

**Solution:**
1. Verify Mailjet credentials are correct
2. Check sender email (`noreply@familyplate.ai`) is verified in Mailjet
3. Check SPF/DKIM DNS records are configured

### Build Failures

**Error:** "Build failed"

**Solution:**
1. Check build logs in Vercel dashboard
2. Verify all dependencies are in `package.json`
3. Run `pnpm build` locally to test

---

## Rollback Plan

If deployment fails, you can rollback to previous version:

1. Go to Vercel dashboard
2. Click **"Deployments"** tab
3. Find previous working deployment
4. Click **"..."** → **"Promote to Production"**

---

## Monitoring & Maintenance

### Check Application Health

- **Vercel Dashboard:** Monitor deployment status, logs, and errors
- **Database Usage:** Check Postgres dashboard for storage and query performance
- **Error Tracking:** Review Vercel function logs for runtime errors

### Regular Maintenance

- **Weekly:** Check error logs and fix issues
- **Monthly:** Review database performance and optimize queries
- **Quarterly:** Update dependencies and security patches

---

## Support

**Issues:** Create GitHub issue in repository  
**Email:** scali79@gmail.com  
**Feedback:** info@btwmarketing.com

---

## Next Steps

After successful deployment:

1. ✅ Test complete user flow (signup → onboarding → meal planning)
2. ✅ Monitor error logs for first 24 hours
3. ✅ Deprecate old backend (`familyplate-backend.vercel.app`)
4. ✅ Update marketing website to point to new app
5. ✅ Announce migration to existing users

---

**Deployment Checklist:**

- [ ] Database tables created
- [ ] Environment variables configured
- [ ] Local build successful
- [ ] Deployed to Vercel
- [ ] Web app tested
- [ ] Mobile app tested
- [ ] Data persistence verified
- [ ] Magic link emails working
- [ ] Meal generation working
- [ ] Family voting working
- [ ] Shopping list working
