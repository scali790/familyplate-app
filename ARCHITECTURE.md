# FamilyPlate Architecture

**Monorepo Structure** - One codebase, multiple deployment targets

## 📁 Directory Structure

```
familyplate-app/
├── backend/              # Vercel API Backend
│   ├── api/              # Serverless functions
│   ├── server/           # tRPC routes & business logic
│   ├── drizzle/          # Database schema
│   ├── shared/           # Shared types
│   ├── package.json      # Backend dependencies
│   └── vercel.json       # Vercel configuration
│
├── app/                  # Expo App (Mobile + Web)
│   ├── (tabs)/           # Tab navigation screens
│   ├── auth/             # Authentication screens
│   ├── shared/           # Shared voting page
│   └── ...               # Other screens
│
├── server/               # Original server code (source)
├── drizzle/              # Original schema (source)
├── shared/               # Shared types (source)
├── components/           # React Native components
├── lib/                  # Utilities & hooks
├── constants/            # App constants
├── tests/                # Unit tests
│
├── package.json          # Root dependencies
├── app.config.ts         # Expo configuration
├── metro.config.js       # Metro bundler config
├── tailwind.config.js    # Tailwind CSS config
└── ARCHITECTURE.md       # This file
```

## 🚀 Deployment Architecture

### 1. Backend (Vercel)
- **Location**: `/backend` directory
- **Deployment**: Vercel Serverless Functions
- **URL**: `https://familyplate-app.vercel.app`
- **Purpose**: API-only (tRPC routes, database, auth)

**Vercel Configuration** (`backend/vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.ts"
    }
  ]
}
```

**Environment Variables** (Vercel Dashboard):
- `DATABASE_URL` - Neon Postgres connection
- `POSTGRES_URL` - Same as DATABASE_URL
- `MAILJET_API_KEY` - Email service
- `MAILJET_SECRET_KEY` - Email service
- `MAILJET_FROM_EMAIL` - noreply@familyplate.ai
- `MAILJET_FROM_NAME` - FamilyPlate
- `OPENAI_API_KEY` - AI meal generation
- `EXPO_PUBLIC_WEB_URL` - Frontend URL for magic links

### 2. Frontend Web (Netlify)
- **Location**: Root directory (Expo App)
- **Deployment**: Netlify Static Hosting
- **URL**: `https://familyplate.netlify.app` (or custom domain)
- **Purpose**: Web UI (Expo Web build)

**Netlify Configuration** (`netlify.toml`):
```toml
[build]
  command = "npx expo export --platform web"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
  EXPO_PUBLIC_API_URL = "https://familyplate-app.vercel.app"
```

**Environment Variables** (Netlify Dashboard):
- `EXPO_PUBLIC_API_URL` - Backend API URL (Vercel)
- `EXPO_PUBLIC_WEB_URL` - Frontend URL (self-reference for magic links)

### 3. Mobile Apps (Expo Go / APK)
- **Location**: Root directory (Expo App)
- **Deployment**: Expo Go (development) / APK (production)
- **Purpose**: Native iOS/Android apps

**Configuration** (`app.config.ts`):
- Uses same backend API as web
- Deep linking configured for magic links
- Bundle ID: `space.manus.easyplate.*`

## 🔄 Data Flow

```
┌─────────────┐
│  Mobile App │ ──┐
└─────────────┘   │
                  │
┌─────────────┐   │    ┌──────────────┐    ┌─────────────────┐
│   Web App   │ ──┼───▶│ Vercel API   │───▶│ Neon Postgres   │
└─────────────┘   │    │  (Backend)   │    │   (Database)    │
                  │    └──────────────┘    └─────────────────┘
┌─────────────┐   │           │
│  Marketing  │ ──┘           │
│   Website   │               ▼
└─────────────┘    ┌──────────────────┐
                   │  External APIs   │
                   │ • Mailjet        │
                   │ • OpenAI         │
                   └──────────────────┘
```

## 🛠️ Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Run dev server (API + Metro)
pnpm dev

# API runs on: http://localhost:3000
# Metro runs on: http://localhost:8081
```

### Backend Development

```bash
cd backend
pnpm install
pnpm dev

# Server runs on: http://localhost:3000
# Test API: http://localhost:3000/trpc/auth.getMe
```

### Deploy Backend to Vercel

```bash
cd backend
vercel --prod

# Or link to existing project:
vercel link
vercel --prod
```

### Deploy Frontend to Netlify

```bash
# Build Expo Web
npx expo export --platform web

# Deploy to Netlify (manual)
netlify deploy --prod --dir=dist

# Or connect GitHub repo to Netlify for auto-deploy
```

## 📊 Database Schema

**Tables** (Neon Postgres):
- `users` - User accounts
- `user_preferences` - Family preferences, cuisines, dietary restrictions
- `meal_plans` - Weekly meal plans
- `meal_votes` - Family voting on meals
- `dish_votes` - Taste onboarding votes
- `magic_link_tokens` - Passwordless authentication

**ORM**: Drizzle ORM
**Migrations**: Located in `drizzle/` directory

## 🔐 Authentication Flow

1. User enters email on welcome screen
2. Backend generates magic link token (15min expiry)
3. Mailjet sends email with magic link
4. User clicks link → Token verified → Session created
5. Session token stored in localStorage (web) or SecureStore (mobile)
6. All API requests include `Authorization: Bearer <token>` header

## 🎨 Styling

- **Mobile**: NativeWind (Tailwind for React Native)
- **Web**: Same NativeWind classes compile to CSS
- **Theme**: Defined in `theme.config.js`
- **Dark Mode**: Automatic via `useColorScheme()`

## 📦 Key Dependencies

**Shared**:
- `@trpc/client` - Type-safe API calls
- `drizzle-orm` - Database ORM
- `zod` - Schema validation

**Frontend**:
- `expo` - React Native framework
- `expo-router` - File-based routing
- `nativewind` - Tailwind CSS for RN
- `react-native-reanimated` - Animations

**Backend**:
- `@trpc/server` - API framework
- `express` - HTTP server
- `node-mailjet` - Email service
- `postgres` - Database driver

## 🚨 Important Notes

### For Vercel Deployment

1. **Root Directory**: Set to `backend` in Vercel project settings
2. **Build Command**: Automatically detected from `vercel.json`
3. **Node Version**: 18.x or higher
4. **Environment Variables**: Must be set in Vercel dashboard

### For Netlify Deployment

1. **Build Command**: `npx expo export --platform web`
2. **Publish Directory**: `dist`
3. **Node Version**: 18.x
4. **Environment Variables**: Must be set in Netlify dashboard

### Metro Config Issue

⚠️ **Known Issue**: Metro bundler has compatibility issues with Expo SDK 54 when building on Vercel.

**Solution**: Build Expo Web locally or on Netlify, not on Vercel. Vercel should only build the backend.

## 📝 Future Improvements

- [ ] Separate `backend/` into its own Git submodule
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Add E2E tests (Playwright)
- [ ] Add monitoring (Sentry)
- [ ] Add analytics (PostHog)

## 🤝 Contributing

When working on this codebase:

1. **Backend changes**: Edit files in `backend/` directory
2. **Frontend changes**: Edit files in `app/`, `components/`, `lib/`
3. **Shared types**: Edit files in `shared/` directory (sync to `backend/shared/`)
4. **Database schema**: Edit `drizzle/schema.ts` (sync to `backend/drizzle/`)

Always keep `backend/` in sync with root `server/`, `drizzle/`, `shared/` directories.

## 📞 Support

For questions or issues:
- Email: info@btwmarketing.com
- GitHub: https://github.com/scali790/familyplate-app
