# Vercel Migration Status - Checkpoint 01

**Date:** 2026-01-10  
**Branch:** feat/vercel-migration-checkpoint-01  
**TypeScript Errors:** 173 → 76 ✅

---

## ✅ Completed

### Architecture
- ✅ Created Next.js 15 App Router project under `/apps/web`
- ✅ Monorepo structure with pnpm workspace
- ✅ Server code organized under `apps/web/server/`
  - `server/trpc/` - tRPC setup (init, context, routers)
  - `server/services/` - Business logic (Mailjet, OpenAI, SDK)
  - `server/db/` - Database client + schema
  - `server/schemas/` - Zod validation schemas

### Database
- ✅ Postgres schema migrated to `server/db/schema.ts`
- ✅ Database client with connection pooling
- ✅ Preferences schema with 4 frequency fields (chicken, redMeat, fish, vegetarian)

### API (tRPC)
- ✅ Minimal tRPC router with 3 main endpoints:
  - `auth.requestMagicLink` - Send magic link email
  - `auth.verifyMagicLink` - Verify token (tRPC mutation)
  - `preferences.getPreferences` - Get user preferences
  - `preferences.savePreferences` - Save preferences
  - `mealPlanning.generatePlan` - Generate AI meal plan
  - `mealPlanning.getCurrentPlan` - Get current plan
- ✅ Next.js Route Handler at `/app/api/trpc/[trpc]/route.ts`
- ✅ tRPC Context adapted for Next.js (Web Standard Request)
- ✅ Cookie-based authentication preserved (no JWT header switch)

### Authentication
- ✅ Magic Link Verify Route at `/app/auth/verify/route.ts`
- ✅ Cookie-setting with `cookies().set()`
- ✅ Redirect to `/dashboard` after verification
- ✅ Deep link support (`familyplate://` scheme)
- ✅ Node.js runtime for stable cookie handling
- ✅ Error page at `/app/auth/error`

### Services
- ✅ Mailjet email service (noreply@familyplate.ai)
- ✅ Prompt Builder service (maps DB preferences → AI prompt)
- ✅ Single Source of Truth: Zod schemas + DB schema

### Dependencies
- ✅ Installed all required packages:
  - @trpc/server, @trpc/client
  - drizzle-orm, postgres
  - zod, jose, superjson
  - node-mailjet

---

## ❌ Remaining Issues

### TypeScript Errors (76 total)
1. **Old Expo tests** (tests/meal-planning.test.ts)
   - Need to be excluded from typecheck temporarily
   - TODO: Migrate or remove

2. **Service imports** (sdk.ts, llm.ts)
   - Missing modules: `env.ts`, `const.ts`, `types/manusTypes.ts`
   - Express-specific imports need to be removed
   - Need to adapt for Web Standard Request

3. **DishVoteService**
   - May have Express dependencies

---

## 🚧 Next Steps

### Immediate (Before Deploy)
1. Create `server/config/env.ts` - Environment variable validation
2. Create `server/config/const.ts` - Shared constants
3. Fix imports in `sdk.ts` and `llm.ts`
4. Exclude old Expo tests from typecheck
5. Run `pnpm typecheck` and `pnpm build`

### Deployment
1. Update Vercel project settings:
   - Root Directory: `apps/web`
   - Build Command: `pnpm build`
   - Output Directory: `.next`
2. Configure environment variables in Vercel
3. Test API endpoints
4. Update Expo mobile app to use production API URL

### Future (Phase 2)
1. Migrate remaining tRPC endpoints (voting, shopping list, etc.)
2. Create shared packages structure:
   - `packages/api` - tRPC routers + services
   - `packages/ui` - Shared components
   - `packages/core` - Shared utilities
3. Build Next.js web UI (landing page, dashboard)
4. Migrate Expo tests to Vitest

---

## 📝 Notes

- **Auth Model:** Cookie-based session (preserved from original)
- **No Breaking Changes:** All existing API shapes maintained
- **Reuse-First:** Mailjet + OpenAI logic copied, not rewritten
- **Vercel-Native:** No Express app.listen(), only Route Handlers
