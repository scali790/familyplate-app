# FamilyPlate Marketing Website

This is the **marketing-only** website for FamilyPlate. It is completely isolated from the web app (`apps/web`) and mobile app (`apps/mobile`).

## Purpose

- **Public-facing marketing pages**
- **SEO-optimized content**
- **Conversion-focused landing pages**
- **No app logic, no authentication, no backend calls**

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**

## Pages

- `/` - Homepage (landing page)
- `/about` - About FamilyPlate
- `/contact` - Contact page
- `/privacy` - Privacy Policy
- `/terms` - Terms of Use
- `/blog` - Blog (placeholder for future content)

## Development

```bash
# Install dependencies
pnpm install

# Run dev server (port 3001)
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start
```

## Deployment

This app is deployed to Vercel:

- **Production:** `familyplate.ai` (+ `www.familyplate.ai`)
- **Root Directory:** `apps/marketing`

### Vercel Configuration

1. Create a new Vercel project
2. Link to `scali790/familyplate-app` repository
3. Set **Root Directory** to `apps/marketing`
4. Framework Preset: **Next.js**
5. Build Command: `pnpm run build`
6. Install Command: `pnpm install`
7. Domain: `familyplate.ai` (+ `www`)

## Separation from Web App

| Aspect | Marketing (`apps/marketing`) | Web App (`apps/web`) |
|--------|------------------------------|----------------------|
| **Domain** | `familyplate.ai` | `staging.familyplate.ai` (later `app.familyplate.ai`) |
| **Purpose** | Marketing, SEO, Conversion | Logged-in product experience |
| **Auth** | ❌ No | ✅ Yes |
| **tRPC** | ❌ No | ✅ Yes |
| **Database** | ❌ No | ✅ Yes |
| **Client State** | ❌ Minimal | ✅ Yes |

## SEO

- ✅ Server Components (default)
- ✅ Metadata exports for each page
- ✅ OpenGraph + Twitter Cards
- ✅ Semantic HTML
- ✅ One H1 per page
- ✅ Keyword-optimized H2s

## CTA Links

All CTAs link to `https://staging.familyplate.ai/auth` (the web app's auth page).

Once the web app moves to `app.familyplate.ai`, update these links to:
- `https://app.familyplate.ai/auth`

## Future Enhancements

- [ ] Blog content (SEO-driven articles)
- [ ] Analytics integration (Plausible or Vercel Analytics)
- [ ] A/B testing for CTAs
- [ ] Localization (multi-language support)
