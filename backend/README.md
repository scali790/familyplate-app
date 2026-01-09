# FamilyPlate Backend (Vercel)

This is the API-only backend for FamilyPlate, deployed on Vercel.

## Architecture

- **Backend (Vercel)**: tRPC API routes, database, auth
- **Frontend (Netlify)**: Expo Web static site
- **Mobile**: Native apps using Vercel API

## Deployment to Vercel

### 1. Create New Vercel Project

```bash
# In this directory
vercel
```

### 2. Configure Environment Variables

In Vercel dashboard, add:

- `DATABASE_URL` - Neon Postgres connection string
- `POSTGRES_URL` - Same as DATABASE_URL
- `MAILJET_API_KEY` - Mailjet API key
- `MAILJET_SECRET_KEY` - Mailjet secret
- `MAILJET_FROM_EMAIL` - noreply@familyplate.ai
- `MAILJET_FROM_NAME` - FamilyPlate
- `OPENAI_API_KEY` - OpenAI API key
- `EXPO_PUBLIC_WEB_URL` - Frontend URL (Netlify)

### 3. Deploy

```bash
vercel --prod
```

## API Endpoints

All endpoints are available at: `https://your-backend.vercel.app`

- `/trpc/*` - tRPC API routes
- `/health` - Health check

## Local Development

```bash
pnpm install
pnpm dev
```

Server runs on http://localhost:3000
