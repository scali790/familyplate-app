# Vercel Deployment Guide - Final

## ✅ Build Status

**Build SUCCESS!** All pages generated successfully.

```
✓ Generating static pages (7/7)
✓ Finalizing page optimization

Route (app)                                 Size  First Load JS
┌ ○ /                                    5.44 kB         108 kB
├ ○ /_not-found                            128 B         102 kB
├ ƒ /api/trpc/[trpc]                       128 B         102 kB
├ ○ /auth/error                            712 B         106 kB
└ ƒ /auth/verify                           128 B         102 kB
```

---

## 📦 Version Pins

| Package | Version | Status |
|---------|---------|--------|
| Next.js | 15.5.9 | ✅ Pinned |
| React | 19.1.0 | ✅ Pinned |
| React DOM | 19.1.0 | ✅ Pinned |
| eslint-config-next | 15.5.9 | ✅ Pinned |
| Node.js | 20 | ✅ Pinned (.nvmrc) |

---

## 🔧 Vercel Project Settings

### 1. Root Directory
```
apps/web
```

### 2. Build & Development Settings
- **Framework Preset:** Next.js
- **Build Command:** `pnpm run build`
- **Install Command:** `pnpm install`
- **Output Directory:** (leave default)

### 3. Node.js Version
```
20
```

### 4. Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for meal generation
- `MAILJET_API_KEY` - Mailjet API key for magic link emails
- `MAILJET_API_SECRET` - Mailjet API secret
- `JWT_SECRET` - Secret for JWT token signing

**Optional:**
- `OPENAI_MODEL` - OpenAI model (default: gpt-4)

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
git push -u origin feat/vercel-nextjs-migration-final
```

### Step 2: Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **General**
4. Set **Root Directory** to `apps/web`
5. Go to **Settings** → **Environment Variables**
6. Add all required environment variables
7. Go to **Deployments**
8. Click **...** (three dots) → **Redeploy**
9. ✅ Check **"Clear Build Cache"**
10. Click **Redeploy**

---

## 🧪 Smoke Tests

After deployment, test these endpoints:

### 1. Home Page
```
https://familyplate.ai/
```
**Expected:** Landing page loads

### 2. tRPC API
```
https://familyplate.ai/api/trpc/health
```
**Expected:** tRPC endpoint responds

### 3. Auth Error Page
```
https://familyplate.ai/auth/error?message=invalid_token
```
**Expected:** Shows "Invalid or expired magic link"

### 4. 404 Page
```
https://familyplate.ai/nonexistent-page
```
**Expected:** Shows custom 404 page

### 5. Magic Link Verify
```
https://familyplate.ai/auth/verify?token=test&email=test@example.com
```
**Expected:** Shows error (invalid token) or redirects

---

## 🔍 Troubleshooting

### Build fails with "Html should not be imported"
- ✅ **Fixed:** Removed `pages/_document.tsx`
- ✅ **Fixed:** Pinned Next.js 15.5.9

### Build fails with "useContext is null"
- ✅ **Fixed:** Removed local `apps/web/pnpm-lock.yaml`
- ✅ **Fixed:** Using root lockfile only

### Build fails with "useSearchParams should be wrapped in suspense"
- ✅ **Fixed:** Split `auth/error/page.tsx` into Server + Client components

### Vercel shows wrong Next.js version
- Clear build cache and redeploy
- Verify `pnpm.overrides` in root `package.json`

---

## 📝 Architecture

### Monorepo Structure
```
/
├── apps/
│   └── web/              ← Next.js 15 App Router (Vercel)
├── packages/
│   └── api/              ← (Future) Shared tRPC API
├── pnpm-lock.yaml        ← Root lockfile (ONLY)
├── package.json          ← Root with pnpm.overrides
└── .nvmrc                ← Node 20
```

### API Structure
```
apps/web/
├── app/
│   ├── api/trpc/[trpc]/route.ts  ← tRPC endpoint
│   ├── auth/
│   │   ├── verify/route.ts       ← Magic Link verify
│   │   └── error/page.tsx        ← Auth error page
│   ├── layout.tsx                ← Root layout
│   └── page.tsx                  ← Landing page
├── server/
│   ├── trpc/                     ← tRPC setup
│   ├── services/                 ← Mailjet, OpenAI
│   └── db/                       ← Database
└── package.json                  ← Pinned versions
```

### Session Flow
1. User requests magic link → Mailjet sends email
2. User clicks link → `/auth/verify?token=xxx`
3. Verify route validates token → creates session
4. Sets `fp_session` cookie (httpOnly, secure)
5. Redirects to `/dashboard` (or deep link)

---

## ✅ Final Checklist

- [x] Next.js 15.5.9 pinned
- [x] React 19.1.0 pinned
- [x] Root lockfile only
- [x] `.gitignore` lockfile guardrail
- [x] Node 20 pinned (.nvmrc)
- [x] Suspense boundaries fixed
- [x] Legacy pages/ removed
- [x] Build success (7/7 pages)
- [x] Vercel settings documented
- [x] Environment variables documented
- [x] Smoke tests defined

---

## 🎯 Next Steps

1. **Deploy to Vercel** (follow steps above)
2. **Test all endpoints** (smoke tests)
3. **Monitor logs** for any runtime errors
4. **Update Expo mobile app** to use production API URL
5. **Phase 2:** Migrate to shared `packages/api` structure

---

## 📞 Support

For deployment issues:
- Check Vercel build logs
- Verify environment variables
- Clear build cache and redeploy
- Check this guide for troubleshooting

---

**Branch:** `feat/vercel-nextjs-migration-final`  
**Commit:** `84d21f9`  
**Date:** Jan 10, 2026
