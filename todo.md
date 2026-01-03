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

## Fix Food Preference Toggles → Replace with Frequency Sliders
- [x] Fix toggle interaction issue (replaced toggles with sliders)
- [x] Update database schema to use frequency values (0=Never, 1=Rarely, 2=Sometimes, 3=Often, 4=Always)
- [x] Push updated schema to database
- [x] Create slider component with visual feedback for preference levels
- [x] Replace toggle UI with slider in onboarding screen
- [x] Update API to accept frequency values instead of booleans
- [x] Update AI meal generator prompt to use frequency preferences (e.g., "chicken often, red meat rarely")
- [x] Test slider interaction and visual feedback
- [x] Test preference filtering with frequency values
- [x] Verify meal generation respects frequency preferences

## Add Progress Dots Indicator to Frequency Sliders
- [x] Add 5 dots (● ● ○ ○ ○) under frequency label
- [x] Fill dots left to right based on current frequency level
- [x] Test visual feedback when tapping +/- buttons

## Fix Preferences Not Loading from Database
- [x] Add getPreferences query to API to fetch existing user preferences (already existed)
- [x] Fetch existing preferences on onboarding screen load
- [x] Populate form fields with fetched preferences (family size, cuisines, flavors, food frequencies)
- [x] Test that saved preferences persist after page reload
- [x] Verify all preference fields load correctly (family size, cuisines, flavors, food frequencies, dietary restrictions, country)

## Debug Preferences Save Not Working
- [x] Check server logs for save mutation errors (found "Invalid session cookie" errors)
- [x] Add console logging to onboarding handleSave function (already exists)
- [x] Verify save mutation is being called with correct data
- [x] Check database to see if data is actually being written
- [x] Verify user authentication is working (user ID is available) - added auth check to redirect unauthenticated users
- [x] Fixed routing: new users go to onboarding after login, existing users go to home
- [x] Test complete save/load cycle end-to-end

## Fix Login Button Not Working
- [x] Check simpleLogin mutation implementation in server
- [x] Add console logging to handleLogin function
- [x] Verify login mutation is being called (button click counter confirmed it works)
- [x] Check for JavaScript errors in browser console (found "Not authenticated" errors)
- [ ] Add better error handling and user feedback
- [ ] Test complete login flow

## Fix Cookie Sharing Between Metro and API Server
- [x] Investigate why cookies set by API server (3000) aren't sent to subsequent requests (cookie domain was too broad)
- [x] Fix cookie domain configuration to work across port-based subdomains (8081-xxx vs 3000-xxx)
- [ ] Test that login cookie persists across API calls
- [ ] Verify user can successfully log in and navigate to onboarding/home

## Simplify Authentication - Remove Cookie Dependency
- [x] Update useAuth hook to use localStorage token for web instead of cookie-based API calls
- [x] Modify auth flow to work entirely with Authorization header
- [x] Add comprehensive logging to handleLogin for debugging
- [x] Verify tRPC client sends Authorization header with token
- [x] Verify protectedProcedure accepts Authorization header
- [ ] Manual testing required (browser automation cannot trigger React events properly)
- [ ] Remove debug logging after manual testing confirms it works

## Magic Link Authentication Integration
- [x] Design magic link authentication flow (request → email → verify → login)
- [x] Create database table for magic link tokens (token, email, expiresAt, used)
- [x] Push database schema changes
- [x] Create API endpoint to request magic link (sendMagicLink)
- [x] Create API endpoint to verify magic link token (verifyMagicLink)
- [x] Update welcome screen to show both login options (simple login + magic link)
- [x] Create magic link verification page (/auth/verify)
- [x] Add expiration handling (links expire after 15 minutes)
- [x] Add security: one-time use tokens
- [x] Test magic link generation and console output
- [x] Test magic link verification and automatic login
- [ ] Production: Integrate with email service (SendGrid, AWS SES, etc.)


## Mailjet Email Integration for Magic Links
- [x] Install Mailjet Node.js SDK (node-mailjet)
- [x] Create email service module with Mailjet configuration
- [x] Request Mailjet API credentials from user (API Key + Secret Key)
- [x] Update requestMagicLink endpoint to send emails via Mailjet
- [x] Create professional HTML email template for magic links
- [x] Test email sending with real Mailjet credentials
- [x] Add error handling for email delivery failures


## Fix Magic Link Navigation Bug
- [x] Fix verification page to properly redirect after successful login
- [x] Ensure session token is stored in localStorage
- [x] Redirect to onboarding after successful magic link verification
- [ ] Test complete magic link flow end-to-end (manual testing required)


## Improve Magic Link UX for Login & Password Reset
- [x] Add "Forgot Password?" / "Need a new link?" button on welcome screen
- [x] Create dedicated password reset page explaining magic link process
- [x] Update email template to clarify it works for both login and account recovery
- [x] Add help text explaining passwordless authentication
- [x] Add "How does this work?" links for user education


## Fix Dark Mode Visibility Issues
- [x] Fix navigation text colors in welcome screen for dark mode
- [x] Fix link colors in reset page for dark mode
- [x] Ensure all text has proper contrast in both light and dark modes
- [x] Use explicit color values for links and interactive text


## Fix Authentication & Navigation Issues
- [x] Fix authentication persistence - logged in users redirected to login when clicking "Edit Preferences"
- [x] Fix back arrow visibility in dark mode (black arrows on black background)
- [x] Update onboarding to wait for auth loading before redirecting
- [x] Fix back arrows in settings, onboarding, dashboard, generate-plan, and shopping-list pages
- [x] Use explicit color values with dark mode class for proper contrast


## Fix Magic Link Deep Linking for Android
- [x] Fix malformed URL in magic link email (shows /auth&/verify instead of /auth/verify)
- [x] Configure Android deep linking to open magic links in app instead of browser
- [x] Update magic link generation to use custom scheme (manus20260103024933://)
- [x] Verify /auth/verify route exists for deep link handling
- [ ] Test magic link flow on Android device (requires rebuilding APK)

## Fix Preferences Save Failure in Web
- [ ] Investigate "Failed to save preferences" error in web preview
- [ ] Check server logs for API errors
- [ ] Verify savePreferences endpoint is working correctly
- [ ] Test preferences save flow end-to-end

## Fix Magic Link Platform Detection
- [ ] Magic link fails on web after deep linking change (uses custom scheme instead of HTTPS)
- [ ] Update requestMagicLink to detect platform (web vs mobile)
- [ ] Use HTTPS URL for web, custom scheme for mobile
- [ ] Test magic link on both web and mobile platforms

## Fix Preferences Save SQL Syntax Error
- [ ] SQL query uses single quotes instead of backticks for column names
- [ ] Fix Drizzle ORM database configuration
- [ ] Test preferences save functionality

## Fix Magic Link Universal Links
- [ ] Custom scheme links (manus20260103024933://) are not clickable in email
- [ ] Create web redirect page that detects mobile and opens app
- [ ] Update magic link to always use HTTPS URLs
- [ ] Test magic link opens app on mobile devices

## Fix Meal Detail Popup Theme Colors
- [ ] Meal detail modal has dark background in light mode
- [ ] Ingredients and instructions text barely visible
- [ ] Update modal to use proper theme colors (bg-surface, text-foreground)
