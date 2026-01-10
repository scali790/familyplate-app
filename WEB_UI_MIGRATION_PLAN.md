# FamilyPlate Web UI Migration Plan

**Goal:** Migrate complete UI from Expo Mobile App to Next.js 15 App Router

**Status:** Planning Phase  
**Date:** Jan 10, 2026

---

## 📋 Feature Inventory

### ✅ Already Migrated (Backend Only)
- tRPC API (`/api/trpc/[trpc]`)
- Magic Link Auth (`/auth/verify`)
- Auth Error Page (`/auth/error`)
- Database Schema (Neon Postgres)
- OpenAI Meal Generation
- Mailjet Email Service

### 🔄 To Migrate (Frontend)

#### 1. **Landing Page** (`app/welcome.tsx`)
**Features:**
- Hero section with tagline
- Feature list (3 items)
- Social proof badge
- Quick Login form (email → magic link)
- Magic Link tab
- "Need help?" / "How does this work?" links

**Target:** `apps/web/app/page.tsx`

---

#### 2. **Authentication Flow**
**Screens:**
- `app/welcome.tsx` → Landing page with login
- `app/auth/verify.tsx` → Magic link verification (already exists as route handler)
- `app/auth/reset.tsx` → Password reset explanation page

**Target:**
- `apps/web/app/page.tsx` (landing with login)
- `apps/web/app/auth/verify/route.ts` ✅ (already exists)
- `apps/web/app/auth/reset/page.tsx` (new)

---

#### 3. **Onboarding Flow**

##### 3a. Taste Onboarding (`app/taste-onboarding.tsx`)
**Features:**
- 10 dish images with 👍/👎/😐 voting
- Progress counter (6 mandatory, 4 optional)
- Skip button after 6 votes
- CDN images for dishes
- Saves to `dish_votes` table

**Target:** `apps/web/app/onboarding/taste/page.tsx`

##### 3b. Preferences (`app/onboarding.tsx`)
**Features:**
- Family name (optional)
- Family size (1-10)
- Cuisines (26 options, multi-select)
- Flavors (multi-select)
- Food frequencies (sliders: Never/Rarely/Sometimes/Often/Always)
- Dietary restrictions (Religious, Dietary Types, Allergens)
- Country selector (UAE, US, India, UK, Saudi Arabia)
- Save button

**Target:** `apps/web/app/onboarding/preferences/page.tsx`

---

#### 4. **Dashboard** (`app/dashboard.tsx`)
**Features:**
- Week range display (e.g., "Jan 5-11")
- Family name in header ("Smith Family's Meal Plan")
- 7 meal cards (compact design)
- Each card shows:
  - Day + Date (e.g., "MONDAY • Jan 6")
  - Meal name + description
  - Food category icons (🥩🍗🐟🌱🥬🌶️👶🥗)
  - Prep/cook time badges
  - Vote counts (👍 5 👎 1 😐 2)
  - Voter avatars (colored circles with initials)
  - "Waiting for family votes" message if no votes
  - Voting progress warning (⚠️ X of Y family members voted)
  - Expandable voter details (▶ View X voters)
  - Recipe modal (tap to view full recipe)
  - Regenerate button (🔄 with "2/week free" hint)
- Header buttons:
  - Back button (←)
  - Edit Preferences button
  - Share to Vote button
  - Settings icon (⚙️)
- Empty state with "Generate Plan" button

**Target:** `apps/web/app/dashboard/page.tsx`

**Components needed:**
- `MealCard` component
- `RecipeModal` component
- `VoterAvatars` component
- `VoteButtons` component

---

#### 5. **Generate Plan** (`app/generate-plan.tsx`)
**Features:**
- Week selector (4 upcoming weeks)
- Smart default logic (Mon-Wed = current week, Thu-Sun = next week)
- Week info cards:
  - Date range (e.g., "Jan 12-18")
  - Label ("This Week", "Next Week", or date range)
  - ✓ Recommended indicator
  - ⚠️ Warning for weeks with few days left
  - ✓ Indicator if plan already exists
- Confirmation dialog when overwriting existing plan
- Generate button
- Loading state (~10 seconds)

**Target:** `apps/web/app/generate/page.tsx`

**Components needed:**
- `WeekSelector` component (from `components/week-selector.tsx`)

---

#### 6. **Shared Voting** (`app/shared/[id].tsx`)
**Features:**
- Public access (no login required)
- Family name in header
- Week range display
- Name input field (required for voting)
- localStorage-based duplicate prevention
- All 7 meal cards with voting buttons
- Vote counts display
- Voter avatars
- Recipe modal
- "Waiting for family votes" message
- Helper text: "Enter name to vote ↑"

**Target:** `apps/web/app/shared/[id]/page.tsx`

---

#### 7. **Shopping List** (`app/shopping-list.tsx`)
**Features:**
- Week range in header
- Categorized ingredients:
  - Proteins
  - Vegetables
  - Pantry Staples
  - Dairy & Eggs
  - Spices & Seasonings
  - Other
- Each ingredient card shows:
  - Ingredient name
  - Quantity
  - "Find on Noon" button (affiliate link)
  - "Find on Talabat" button (affiliate link)
- Helper text for Talabat: "Confirm your area first, then search"
- Copy List button
- Country-specific localization (units, brands, prices)

**Target:** `apps/web/app/shopping-list/page.tsx`

**API needed:**
- `generateShoppingList` mutation (already exists in Expo backend)

---

#### 8. **Settings** (`app/settings.tsx`)
**Features:**
- Dark/Light mode toggle
- "Edit Preferences" button → navigates to onboarding
- Premium Features section (COMING SOON):
  - 🔄 Unlimited Regenerations (PREMIUM, locked)
  - 🔀 Advanced Substitutions (PREMIUM, locked)
  - 📊 Nutrition Insights (PREMIUM, locked)
  - 📅 Multi-Week Planning (PREMIUM, locked)
- BETA Feedback button (mailto: info@btwmarketing.com)
- Logout button

**Target:** `apps/web/app/settings/page.tsx`

---

#### 9. **Home Screen** (`app/(tabs)/index.tsx`)
**Features:**
- Welcome message
- 6 feature cards:
  - 🤖 AI Meal Planning (available)
  - 👨‍👩‍👧‍👦 Family Voting (available)
  - 🎯 Dietary Preferences (available)
  - 🛒 Shopping Lists (available)
  - 🌍 Global Cuisines (available)
  - 📊 Nutrition Tracking (COMING SOON)
- Navigation to:
  - Generate Plan
  - Dashboard
  - Settings
  - Shopping List

**Target:** `apps/web/app/home/page.tsx` (or integrate into dashboard)

---

## 🎨 Design System

### Tailwind Config
**Already configured in Expo app:**
- `theme.config.js` - Color tokens
- `tailwind.config.js` - Tailwind setup
- `global.css` - Base styles

**Migration strategy:**
- Copy Tailwind config to `apps/web/`
- Use same color tokens for consistency
- Adapt mobile-first classes to responsive web

### Colors
```js
primary: { light: '#0a7ea4', dark: '#0a7ea4' }
background: { light: '#ffffff', dark: '#151718' }
surface: { light: '#f5f5f5', dark: '#1e2022' }
foreground: { light: '#11181C', dark: '#ECEDEE' }
muted: { light: '#687076', dark: '#9BA1A6' }
border: { light: '#E5E7EB', dark: '#334155' }
success: { light: '#22C55E', dark: '#4ADE80' }
warning: { light: '#F59E0B', dark: '#FBBF24' }
error: { light: '#EF4444', dark: '#F87171' }
```

---

## 🔧 Technical Stack

### Frontend
- **Framework:** Next.js 15.5.9 (App Router)
- **Styling:** Tailwind CSS 3.4
- **State:** React Context + tRPC
- **Forms:** React Hook Form (optional)
- **Modals:** Radix UI or Headless UI
- **Icons:** Lucide React or Heroicons

### API Client
- **tRPC Client:** Already configured in Expo app (`lib/trpc.ts`)
- **Migration:** Copy to `apps/web/lib/trpc.ts`
- **Base URL:** Environment variable

---

## 📦 Migration Strategy

### Phase 1: Foundation (Current)
- ✅ Set up Next.js project structure
- ✅ Configure Tailwind CSS
- ✅ Set up tRPC client
- ✅ Create base layout

### Phase 2: Authentication
- Landing page with login forms
- Magic link verification (already done)
- Auth error page (already done)
- Password reset page

### Phase 3: Onboarding
- Taste onboarding screen
- Preferences screen
- Smart routing logic

### Phase 4: Core Features
- Dashboard with meal cards
- Recipe modal
- Voting system
- Generate plan screen

### Phase 5: Additional Features
- Shopping list
- Shared voting page
- Settings page
- Home screen

### Phase 6: Polish
- Loading states
- Error handling
- Responsive design
- Dark mode
- Animations (optional)

---

## 🚀 Next Steps

1. **Set up UI foundation** (Phase 1)
   - Copy Tailwind config
   - Set up tRPC client
   - Create base components

2. **Create landing page** (Phase 2)
   - Hero section
   - Login forms
   - Marketing content

3. **Migrate screens one by one** (Phases 3-5)
   - Start with onboarding
   - Then dashboard
   - Then additional features

4. **Test and deploy** (Phase 6)
   - Cross-browser testing
   - Mobile responsiveness
   - Performance optimization

---

## ✅ Success Criteria

- [ ] All Expo screens migrated to Next.js
- [ ] Feature parity with mobile app
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode support
- [ ] Fast page loads (<2s)
- [ ] SEO-friendly landing page
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Cross-browser compatible

---

**Ready to start Phase 1?**
