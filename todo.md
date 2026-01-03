# EasyPlate TODO (Clean Rebuild)

## Database & API
- [x] Create database schema (user_preferences, meal_plans, meal_votes)
- [x] Push database schema
- [x] Create tRPC API routes for meal planning
- [x] Test API routes

## Branding
- [x] Generate custom app logo
- [x] Update app.config.ts with branding
- [x] Update theme colors

## Authentication
- [x] Create welcome screen
- [x] Integrate built-in OAuth authentication
- [x] Test login flow

## Onboarding
- [x] Create onboarding screen
- [x] Add family size, cuisines, flavors, dietary restrictions inputs
- [x] Save preferences via API
- [x] Navigate to dashboard

## Dashboard
- [x] Create dashboard screen
- [x] Display meal plan from API
- [x] Add voting functionality
- [x] Add pull-to-refresh
- [x] Add empty state

## Meal Plan Generation
- [x] Create generate plan screen
- [x] Call AI API to generate meals
- [x] Save to database
- [x] Display generated plan

## Settings & Polish
- [x] Create settings screen
- [x] Add edit preferences
- [x] Add logout
- [x] Test all flows end-to-end
- [x] Create final checkpoint

## Bug Fixes
- [x] Fix "Get Started" button crash on mobile
- [x] Fix OAuth authentication flow not working in browser preview
- [x] Debug and fix login redirect issue

## New Bugs to Fix
- [x] Fix meal plan generation - loading but nothing happens after clicking Generate Plan
- [x] Debug API endpoint for meal plan generation
- [x] Test end-to-end meal plan generation flow

## Family Sharing Feature
- [x] Add share button to dashboard
- [x] Generate shareable link for meal plan
- [x] Allow anonymous voting via shared link
- [x] Create shared meal plan view page
- [x] Add API endpoints for shared viewing and voting

## Share Link Bug Fix
- [x] Fix share button to generate direct link to shared meal plan view (/shared/[id])
- [x] Test that shared link opens directly to the meal plan for voting
