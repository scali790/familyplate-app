# Vercel Deployment Guide

## Configuration

### Vercel Project Settings

**Root Directory:** `apps/web`

**Build Settings:**
- Build Command: `pnpm run build`
- Install Command: `pnpm install`
- Output Directory: `.next` (default)

**Environment:**
- Node.js Version: `20.x`
- Package Manager: `pnpm`

### Environment Variables

Required environment variables in Vercel:

```bash
# Database
DATABASE_URL=postgresql://...

# OpenAI
OPENAI_API_KEY=sk-...

# Mailjet (Magic Link Email)
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...

# Session Secret
SESSION_SECRET=...  # Generate with: openssl rand -base64 32
```

## Deployment Steps

1. **Connect Repository to Vercel**
   - Import project from GitHub
   - Select `apps/web` as Root Directory

2. **Configure Build Settings**
   - Framework Preset: `Next.js`
   - Build Command: `pnpm run build`
   - Install Command: `pnpm install`
   - Node.js Version: `20.x`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above

4. **Deploy**
   - Push to `main` branch to trigger deployment
   - Or use "Redeploy" button in Vercel Dashboard

## Troubleshooting

### Build Fails with "Html should not be imported"

**Cause:** Vercel is running `next build` directly instead of using package scripts.

**Fix:**
1. Ensure Root Directory is set to `apps/web`
2. Use `pnpm run build` as Build Command (not `next build`)
3. Clear Vercel build cache and redeploy

### React Version Conflicts

**Cause:** Multiple React versions in monorepo.

**Fix:**
- Root `package.json` has `pnpm.overrides` for `react@19.1.0`
- Run `pnpm install` to apply overrides

### Database Connection Fails

**Cause:** Missing or incorrect `DATABASE_URL`.

**Fix:**
1. Verify `DATABASE_URL` in Vercel Environment Variables
2. Ensure database allows connections from Vercel IPs
3. Enable SSL if required: `?sslmode=require`

## API Endpoints

After deployment, the following endpoints are available:

- **tRPC API:** `https://your-domain.vercel.app/api/trpc`
- **Magic Link Verify:** `https://your-domain.vercel.app/auth/verify`

## Mobile App Configuration

Update Expo Mobile App to use production API:

```typescript
// lib/trpc.ts
const API_URL = 'https://your-domain.vercel.app/api/trpc';
```

## Monitoring

- **Build Logs:** Vercel Dashboard → Deployments → Build Logs
- **Runtime Logs:** Vercel Dashboard → Deployments → Function Logs
- **Analytics:** Vercel Dashboard → Analytics

## Support

For deployment issues:
- Check Vercel build logs
- Verify environment variables
- Test locally with `pnpm run build` first
