# FamilyPlate Monorepo Deployment Guide

**Architecture**: Backend on Vercel + Frontend on Netlify

## Quick Start

### 1. Deploy Backend (Vercel)

```bash
cd /home/ubuntu/easyplate
git add .
git commit -m "Add monorepo structure"
git push origin main
```

Then in Vercel:
1. Import `scali790/familyplate-app`
2. **Set Root Directory to `backend`** ⚠️
3. Add environment variables (see below)
4. Deploy

### 2. Deploy Frontend (Netlify)

```bash
# Build locally (Metro issue workaround)
export EXPO_PUBLIC_API_URL=https://familyplate-app.vercel.app
npx expo export --platform web

# Commit build
git add dist/
git commit -m "Add web build"
git push
```

Then in Netlify:
1. Import `scali790/familyplate-app`
2. Build command: `echo "Using pre-built dist"`
3. Publish directory: `dist`
4. Deploy

## Environment Variables

### Vercel (Backend)
```
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAILJET_FROM_EMAIL=noreply@familyplate.ai
MAILJET_FROM_NAME=FamilyPlate
OPENAI_API_KEY=...
EXPO_PUBLIC_WEB_URL=https://familyplate.netlify.app
```

### Netlify (Frontend)
```
EXPO_PUBLIC_API_URL=https://familyplate-app.vercel.app
EXPO_PUBLIC_WEB_URL=https://familyplate.netlify.app
```

## Testing

```bash
# Backend
curl https://familyplate-app.vercel.app/health

# Frontend
open https://familyplate.netlify.app
```

## Troubleshooting

### Metro cacheStores Error

**Solution**: Build locally, commit `dist/` folder

```bash
npx expo export --platform web
git add dist/
git commit -m "Update build"
git push
```

### Backend 500 Error

Check Vercel logs and verify all environment variables are set.

### Frontend Blank Screen

Check browser console. Verify `EXPO_PUBLIC_API_URL` is set correctly.

## See Also

- `ARCHITECTURE.md` - Complete architecture overview
- `DEPLOYMENT.md` - Original deployment guide (single Vercel deployment)
- `backend/README.md` - Backend-specific documentation
