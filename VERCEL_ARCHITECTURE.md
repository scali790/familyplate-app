# FamilyPlate - Vercel Architecture Documentation

**Last Updated:** January 9, 2026  
**Author:** Manus AI Agent

---

## Overview

FamilyPlate is transitioning from a **split architecture** (separate backend + frontend) to a **unified Expo application** that runs on both web and mobile with a shared database.

---

## Current Vercel Projects (Legacy - To Be Deprecated)

### 1. familyplate-backend.vercel.app
**Status:** ⚠️ LEGACY - Will be deprecated  
**Type:** Node.js/Express Backend  
**Database:** Vercel Postgres (Neon)  
**Purpose:** API backend for the old React web app

**Endpoints:**
- `POST /api/auth/request-magic-link` - Send magic link email
- `POST /api/auth/verify-magic-link` - Verify magic link token
- `GET /api/auth/me` - Get current user
- `POST /api/preferences` - Save user preferences
- `GET /api/preferences` - Get user preferences
- `POST /api/meal-plans` - Generate meal plan
- `GET /api/meal-plans/:id` - Get meal plan by ID
- `POST /api/meal-plans/:id/vote` - Vote on meal

**Database Tables:**
- `users` - User accounts
- `preferences` - User preferences (cuisines, dietary restrictions, etc.)
- `meal_plans` - Generated meal plans

**GitHub Repo:** `scali790/familyplate-backend`

---

### 2. familyplate-webnew.vercel.app
**Status:** ⚠️ LEGACY - Will be deprecated  
**Type:** React Frontend (Vite + Tailwind CSS)  
**Purpose:** Web interface that connects to familyplate-backend

**Features:**
- Magic link authentication
- Onboarding with clickable preference buttons
- Dashboard with meal plan display
- OpenAI-powered meal generation

**GitHub Repo:** `scali790/familyplate-frontend`

**Note:** This frontend uses the backend at `familyplate-backend.vercel.app`

---

## New Unified Architecture (Current Development)

### 3. easyplate (FamilyPlate Expo App)
**Status:** ✅ ACTIVE DEVELOPMENT  
**Type:** Expo/React Native Universal App (Web + Mobile)  
**Current Database:** MySQL (local) → **Migrating to Vercel Postgres**  
**Deployment Target:** `familyplate-webnew.vercel.app` (will replace old frontend)

**Tech Stack:**
- **Frontend:** React Native 0.81 + Expo SDK 54
- **Backend:** tRPC + Express (embedded in app)
- **Database:** Vercel Postgres (Neon) - shared for web + mobile
- **Auth:** Magic link via Mailjet (noreply@familyplate.ai)
- **AI:** OpenAI API for meal generation
- **Styling:** NativeWind 4 (Tailwind CSS for React Native)

**Features:**
- ✅ Magic link authentication with Mailjet
- ✅ Taste onboarding (vote on 10 dishes)
- ✅ Comprehensive preferences (26 cuisines, dietary restrictions, food frequencies)
- ✅ AI-powered meal plan generation (7-day plans)
- ✅ Family voting system (👍 😐 👎)
- ✅ Recipe details modal with ingredients & instructions
- ✅ Meal regeneration (swap individual meals)
- ✅ Shopping list generator with local store links (Noon, Talabat)
- ✅ Multi-week planning (plan up to 4 weeks ahead)
- ✅ Dark/light mode support
- ✅ Voter tracking and engagement features

**tRPC API Routes:**
```typescript
// Authentication
auth.requestMagicLink(email)
auth.verifyMagicLink(token)
auth.getMe()

// Preferences
mealPlanning.savePreferences(preferences)
mealPlanning.getPreferences()

// Meal Planning
mealPlanning.generatePlan(weekStartDate?)
mealPlanning.getCurrentPlan()
mealPlanning.getAllPlans()
mealPlanning.getSharedPlan(planId)

// Voting
mealPlanning.vote(mealPlanId, mealDay, voteType)
mealPlanning.voteShared(planId, mealDay, voteType, voterName)

// Meal Operations
mealPlanning.regenerateMeal(mealPlanId, dayIndex)

// Shopping List
mealPlanning.generateShoppingList(mealPlanId)

// Dish Voting (Taste Onboarding)
dishVoting.vote(dishId, vote, context)
dishVoting.getVotes(context)
dishVoting.getTasteProfile()
```

**Database Schema:**
```sql
-- Users
users (id, email, created_at, updated_at)

-- Preferences
user_preferences (
  id, user_id, family_size, family_name,
  cuisines, dietary_restrictions, allergies,
  country, language, units, currency,
  chicken_frequency, red_meat_frequency, fish_frequency,
  vegetarian_frequency, vegan_frequency, spicy_frequency,
  created_at, updated_at
)

-- Meal Plans
meal_plans (
  id, user_id, week_start_date, meals, created_at, updated_at
)

-- Meal Votes
meal_votes (
  id, meal_plan_id, meal_day, user_id, voter_name, vote_type, created_at
)

-- Dish Votes (Taste Onboarding)
dish_votes (
  id, user_id, dish_id, vote, context, created_at
)

-- Magic Link Tokens
magic_link_tokens (
  id, email, token, expires_at, used, created_at
)
```

**Local Development:**
- Dev server: `http://127.0.0.1:3000` (API)
- Web preview: `https://8081-i8v4ix5aa7f1zts081bl0-ce872828.sg1.manus.computer`
- Mobile: Expo Go app (scan QR code)

**Path:** `/home/ubuntu/easyplate`

---

## Migration Plan

### Phase 1: Database Migration ✅ IN PROGRESS
- [x] Document current architecture
- [ ] Update Expo app to use Vercel Postgres instead of MySQL
- [ ] Configure environment variables for production
- [ ] Test data persistence across web and mobile

### Phase 2: Deployment
- [ ] Deploy Expo web build to Vercel
- [ ] Configure custom domain (familyplate.ai)
- [ ] Set up Vercel Postgres connection
- [ ] Test production deployment

### Phase 3: Deprecation
- [ ] Redirect familyplate-backend.vercel.app → new app
- [ ] Archive old repositories
- [ ] Update DNS records
- [ ] Notify users of migration

---

## Environment Variables

### Required for Production:

```bash
# Database (Vercel Postgres)
POSTGRES_URL="postgresql://..."
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# Email (Mailjet)
MAILJET_API_KEY="..."
MAILJET_SECRET_KEY="..."
MAILJET_FROM_EMAIL="noreply@familyplate.ai"
MAILJET_FROM_NAME="FamilyPlate"

# AI (OpenAI)
OPENAI_API_KEY="sk-..."

# App Configuration
NODE_ENV="production"
EXPO_PUBLIC_API_URL="https://familyplate-webnew.vercel.app"
EXPO_PUBLIC_WEB_URL="https://familyplate-webnew.vercel.app"
```

---

## Deployment URLs

### Current (Legacy):
- **Backend API:** https://familyplate-backend.vercel.app
- **Web App:** https://familyplate-webnew.vercel.app
- **Marketing:** https://familyplate.ai

### Future (Unified):
- **Web + Mobile App:** https://familyplate-webnew.vercel.app (or familyplate.ai)
- **API:** Built into app (tRPC endpoints)
- **Marketing:** Separate static site or integrated landing page

---

## Benefits of Unified Architecture

✅ **Single Codebase:** One repository for web + mobile  
✅ **Shared Database:** Same data across all platforms  
✅ **Easier Updates:** Deploy once, works everywhere  
✅ **Type Safety:** tRPC provides end-to-end type safety  
✅ **Better DX:** No API versioning issues  
✅ **Cost Effective:** One Vercel project instead of two  

---

## Support & Maintenance

**Primary Developer:** Manus AI Agent  
**User Contact:** scali79@gmail.com  
**Feedback:** info@btwmarketing.com  
**GitHub:** scali790  

---

## Notes

- The old backend uses REST API, new app uses tRPC
- Magic link emails sent from noreply@familyplate.ai (Mailjet)
- OpenAI API used for meal generation (user has sufficient credits)
- Shopping list links use affiliate tracking (Noon: C1000264L, Talabat: DCMNetwork)
- App supports 26 cuisines and multiple dietary restrictions (Halal, Kosher, Vegetarian, Vegan, etc.)
