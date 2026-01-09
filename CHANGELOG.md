# Changelog

All notable changes to FamilyPlate will be documented in this file.

---

## [Unreleased] - 2026-01-09

### Fixed
- **Metro Bundler Crash**: Downgraded NativeWind from v4.2.1 to v4.1.x to fix compatibility issue with Expo SDK 54
  - **Issue**: Metro bundler crashed with `TypeError: Cannot read properties of undefined (reading 'cacheStores')`
  - **Root Cause**: NativeWind v4.2.1 has a breaking change in metro config that conflicts with Expo SDK 54
  - **Solution**: Downgraded to NativeWind v4.1.x which is stable with Expo SDK 54
  - **Future**: Can upgrade to NativeWind v4.2.x once Expo SDK 55 is stable
  - **Reference**: See `metro.config.js` for detailed comments

### Added
- **Vercel Architecture Documentation** (`VERCEL_ARCHITECTURE.md`)
  - Complete overview of all Vercel endpoints (legacy and new)
  - Database schema documentation
  - tRPC API routes reference
  - Migration plan from split architecture to unified app

- **Vercel Deployment Guide** (`VERCEL_DEPLOYMENT_GUIDE.md`)
  - Step-by-step deployment instructions
  - Database setup with SQL migration script
  - Environment variables configuration
  - Troubleshooting guide and rollback procedures

- **Feature Overview on Home Screen**
  - Added 6 feature cards showing available and upcoming features
  - Clear visual indicators for "Coming Soon" features
  - Direct navigation to all app features from home screen

- **Edit Preferences Button in Dashboard**
  - Users can now easily access and edit their preferences from the dashboard
  - Button placed next to "Share to Vote" for easy discovery

### Changed
- **Database Migration**: Prepared for migration from MySQL to Vercel Postgres
  - Generated Postgres migration SQL for all 6 tables
  - Updated database connection logic to support both MySQL and Postgres
  - Ready for production deployment on Vercel

---

## Technical Details

### Dependencies Changed
- `nativewind`: `^4.2.1` → `^4.1.0` (downgrade for stability)

### Files Modified
- `metro.config.js`: Added compatibility fix and documentation
- `app/(tabs)/index.tsx`: Added feature overview cards
- `app/dashboard.tsx`: Added "Edit Preferences" button
- `drizzle/schema-postgres.ts`: Postgres schema for Vercel deployment
- `server/db.ts`: Updated for Postgres compatibility

### Known Issues
- TypeScript errors in test files (227 errors) - non-blocking, tests still run
- Metro bundler requires NativeWind v4.1.x for Expo SDK 54

---

## Future Roadmap

### Short Term (Next 2 Weeks)
- [ ] Deploy to Vercel with Postgres database
- [ ] Test complete user flow on production
- [ ] Deprecate old backend (`familyplate-backend.vercel.app`)

### Medium Term (Next Month)
- [ ] Implement Nutrition Tracking feature
- [ ] Add multi-week dashboard view
- [ ] Upgrade to Expo SDK 55 (when stable)
- [ ] Upgrade to NativeWind v4.2.x (after Expo SDK 55)

### Long Term (Next Quarter)
- [ ] Add family member profiles
- [ ] Implement meal history and favorites
- [ ] Add recipe rating system
- [ ] Integrate with grocery delivery APIs

---

## Maintenance Notes

### When to Upgrade NativeWind
**Conditions for upgrading to v4.2.x:**
1. Expo SDK 55 is released as stable
2. NativeWind v4.2.x confirms compatibility with Expo SDK 55
3. Test thoroughly in development before deploying

**Upgrade Command:**
\`\`\`bash
pnpm remove nativewind
pnpm add nativewind@^4.2.0
\`\`\`

### Database Migration Checklist
Before deploying to production:
- [ ] Run SQL migration in Vercel Postgres
- [ ] Configure environment variables
- [ ] Test database connection
- [ ] Verify data persistence
- [ ] Test magic link authentication
- [ ] Test meal plan generation and voting

---

**Last Updated**: January 9, 2026  
**Maintainer**: Manus AI Agent  
**Contact**: scali79@gmail.com
