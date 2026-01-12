
# ARCHITECTURE_WEB.md
## FamilyPlate – Web App (Next.js)

⚠️ **IMPORTANT – READ FIRST**
This document defines the **single source of truth** for the FamilyPlate **Web Application**.
Any work on the Web App must comply with this document.

---

## 1. Scope & Platform
- Platform: **Next.js (App Router)**
- Location in repo: `apps/web`
- Deployment: **Vercel**
- Production branch: `feat/vercel-nextjs-migration-final`
- Reference commit (verified working): **1e2cd4a**

🚫 Expo / React Native is **OUT OF SCOPE** for this document.

---

## 2. Source of Truth
- **Web UI source of truth:** `apps/web`
- Dashboard, Day View, Week View, Recipe Modal live here
- No Web features may be implemented in `/app` (Expo)

---

## 3. Architecture Overview
### Frontend
- Next.js 15 (App Router)
- React 19
- UI: shadcn/ui
- Styling: Tailwind CSS

### State & Data
- tRPC
- TanStack React Query

### Backend (Shared)
- Express.js + tRPC
- OpenAI GPT-4o integration
- Shared with Mobile App

### Database
- PostgreSQL (Neon)
- Drizzle ORM
- Shared schema

---

## 4. Features (Must Remain Working)
- Magic link authentication (JWT)
- Taste onboarding & preferences
- AI meal plan generation
- Day View / Week View toggle
- Family voting system
- Recipe modal with on-demand details
- Shopping list generation

---

## 5. Critical Rules (DO NOT VIOLATE)
- ❌ Do NOT convert Web components to Expo
- ❌ Do NOT tighten OpenAI response parsing without approval
- ❌ Do NOT change tRPC contracts without coordination
- ❌ Do NOT modify DB schema casually

---

## 6. Fragile / High-Risk Areas
- OpenAI response parsing
- Shared backend changes
- Production database migrations

All changes must be tested against Day/Week View and meal generation.

---

## 7. Deployment Rules
- Vercel root directory: `apps/web`
- Framework: Next.js
- Environment variables must be present:
  - DATABASE_URL
  - OPENAI_API_KEY
  - MAILJET_API_KEY / SECRET

---

## 8. Golden Rule
If something works in production, **do not “improve” it without explicit confirmation**.
