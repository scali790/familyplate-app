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

## Navigation Improvements
- [x] Audit all screens for navigation issues
- [x] Add back button to dashboard header
- [x] Add back button to onboarding screen
- [x] Add back button to settings screen
- [x] Add back button to generate-plan screen
- [x] Test navigation flow from all screens
- [x] Ensure users can always return to main menu/dashboard

## Recipe Details Modal Feature
- [x] Update database schema to include recipe details (ingredients, instructions, prep/cook time)
- [x] Push updated schema to database
- [x] Update AI meal generation prompt to include recipe details
- [x] Create RecipeModal component with full recipe information
- [x] Add tap handler to meal cards on dashboard
- [x] Add tap handler to meal cards on shared view
- [x] Test recipe modal on web preview
- [x] Verify all recipe details display correctly

## Recipe Modal Styling Fixes
- [x] Add solid background color to modal overlay
- [x] Improve modal content background and contrast
- [x] Ensure modal is properly centered and scrollable
- [x] Test modal visibility and readability on web preview

## Recipe Modal Dark Mode Text Fixes
- [x] Fix meal name and description text colors for dark mode
- [x] Fix prep/cook time badge text colors for dark mode
- [x] Ensure all modal text uses theme-aware colors
- [x] Test modal in dark mode on web preview

## Shopping List Generator Feature
- [x] Add country field to user preferences schema
- [x] Add country selector dropdown to preferences screen (UAE, US, India, UK, Saudi Arabia)
- [x] Create shopping list generation API endpoint
- [x] Implement AI-powered ingredient consolidation and localization
- [x] Add country-specific unit conversion (metric/imperial)
- [x] Add local brand/product suggestions
- [x] Group ingredients by category (produce, dairy, meat, pantry)
- [x] Create shopping list screen UI
- [x] Add deep links to local grocery stores (Noon, Carrefour, Amazon for UAE)
- [x] Add "Generate Shopping List" button to dashboard
- [x] Test shopping list generation for different countries
- [x] Push updated schema to database

## Shopping List Store Links Improvement
- [x] Remove generic store homepage links from top of shopping list
- [x] Add individual "Find on Noon" button to each ingredient card
- [x] Use Noon referral link (https://s.noon.com/EbUHWfvUeiU) with search parameters
- [x] Generate search-optimized ingredient names for better results
- [x] Test ingredient search links on Noon
- [x] Add "Copy List" button for manual shopping

## Noon Supermarket Search Fix
- [x] Update search URL to use Noon Supermarket section (https://www.noon.com/uae-en/noon-supermarket/search/)
- [x] Test Noon Supermarket search links to verify grocery products appear

## Dark Mode Toggle & Text Color Fixes
- [x] Add dark/light mode toggle switch to settings screen
- [x] Fix unreadable text colors in dark mode (meal cards, buttons, badges)
- [x] Ensure all text uses theme-aware colors (text-foreground, text-muted)
- [x] Test dark mode across all screens (dashboard, settings, shopping list, recipe modal)

## Shopping List Week Information
- [x] Add week plan date range to shopping list header (e.g., "Week of Dec 29 - Jan 4")
- [x] Display which meal plan the shopping list is generated from

## Meal Swap Feature
- [x] Create API endpoint for regenerating a single meal
- [x] Add "🔄 Regenerate" button to each meal card on dashboard
- [x] Implement meal regeneration logic that preserves other meals
- [x] Update meal plan in database with new meal
- [x] Test meal swap functionality on web preview

## Talabat Grocery Store Integration
- [x] Add "Find on Talabat" button next to each ingredient
- [x] Use Talabat affiliate tracking URL (http://go.pjarabialinks.com/?t_c=No_pn=talabat_pt=r=lp)
- [x] Add search parameter for each ingredient to Talabat URL
- [x] Test Talabat search links with affiliate tracking

## Talabat Instruction Text
- [x] Add instruction text above Talabat button explaining area confirmation and search process
- [x] Display ingredient-specific search term in instruction (e.g., "search for: 'Onion'")
- [x] Test instruction display on shopping list

## Family Voting Functionality Fix
- [x] Test shared meal plan link to reproduce voting issue
- [x] Identify why thumbs up/down buttons are not clickable
- [x] Fix voting mutation/handler in shared view (already working)
- [x] Ensure votes are properly saved to database (already working)
- [x] Improve button styling to show interactive state clearly
- [x] Add visual feedback when buttons are disabled
- [x] Show helper text when user tries to vote without entering name
- [x] Test improved UX on shared link

## Food Category Icons Feature
- [x] Update database schema to add tags field to meals (protein type, dietary style, meal type)
- [x] Push updated schema to database
- [x] Create icon mapping utility function (tags → emoji icons)
- [x] Update AI meal generation prompt to include recipe tags
- [x] Add icon display next to meal titles on dashboard
- [x] Add icon display next to meal titles on shared meal plan view
- [x] Add icon display next to meal titles in recipe modal
- [x] Test icon display on all screens (icons will appear once new meal plans with tags are generated)

## Food Preferences with Icon Toggles
- [x] Update database schema to add food preference toggles (meat, chicken, fish, vegetarian, vegan, spicy, kid-friendly, healthy)
- [x] Push updated schema to database
- [x] Add Food Preferences section to onboarding screen with icon toggles
- [x] Add Food Preferences section to settings screen with icon toggles (users can edit via onboarding screen)
- [x] Update AI meal generator to filter recipes based on preference toggles
- [x] Test preference filtering in meal generation
- [x] Verify excluded categories don't appear in generated meal plans
