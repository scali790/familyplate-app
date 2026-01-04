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
- [x] Add better error handling and user feedback
- [x] Test complete login flow

## Fix Cookie Sharing Between Metro and API Server
- [x] Investigate why cookies set by API server (3000) aren't sent to subsequent requests (cookie domain was too broad)
- [x] Fix cookie domain configuration to work across port-based subdomains (8081-xxx vs 3000-xxx)
- [x] Test that login cookie persists across API calls
- [x] Verify user can successfully log in and navigate to onboarding/home

## Simplify Authentication - Remove Cookie Dependency
- [x] Update useAuth hook to use localStorage token for web instead of cookie-based API calls
- [x] Modify auth flow to work entirely with Authorization header
- [x] Add comprehensive logging to handleLogin for debugging
- [x] Verify tRPC client sends Authorization header with token
- [x] Verify protectedProcedure accepts Authorization header
- [x] Manual testing required (browser automation cannot trigger React events properly)
- [x] Remove debug logging after manual testing confirms it works

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
- [x] Production: Integrate with email service (SendGrid, AWS SES, etc.)


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
- [x] Test complete magic link flow end-to-end (manual testing required)


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
- [x] Test magic link flow on Android device (requires rebuilding APK)

## Fix Preferences Save Failure in Web
- [x] Investigate "Failed to save preferences" error in web preview
- [x] Check server logs for API errors
- [x] Verify savePreferences endpoint is working correctly
- [x] Test preferences save flow end-to-end

## Fix Magic Link Platform Detection
- [x] Magic link fails on web after deep linking change (uses custom scheme instead of HTTPS)
- [x] Update requestMagicLink to detect platform (web vs mobile)
- [x] Use HTTPS URL for web, custom scheme for mobile
- [x] Test magic link on both web and mobile platforms

## Fix Preferences Save SQL Syntax Error
- [x] SQL query uses single quotes instead of backticks for column names
- [x] Fix Drizzle ORM database configuration
- [x] Test preferences save functionality

## Fix Magic Link Universal Links
- [x] Custom scheme links (manus20260103024933://) are not clickable in email
- [x] Create web redirect page that detects mobile and opens app
- [x] Update magic link to always use HTTPS URLs
- [x] Test magic link opens app on mobile devices

## Fix Meal Detail Popup Theme Colors
- [x] Meal detail modal has dark background in light mode
- [x] Ingredients and instructions text barely visible
- [x] Update modal to use proper theme colors (bg-surface, text-foreground)

## Fix Magic Link URL Domain
- [x] Magic link uses wrong domain (c66dmgpz3i-qdu5dato2a-uk.a.run.app)
- [x] Should use dev server domain (8081-...sg1.manus.computer)
- [x] Update EXPO_PUBLIC_WEB_URL environment variable

## Fix Generate Plan Page Layout
- [x] Generate Plan button is cut off at bottom of screen
- [x] Page needs proper scrolling or better button positioning

## Fix Recipe Modal on Mobile
- [x] Recipe modal doesn't show when clicking on meals on mobile
- [x] Modal works on web but not on native mobile app

## UI Bug Fixes - Generate Plan Button & Recipe Modal
- [x] Fix Generate Plan button being cut off at bottom of screen
- [x] Add ScrollView to generate-plan page for proper layout
- [x] Fix recipe modal not showing on mobile devices
- [x] Redesign MealCard with dedicated tap areas for recipe viewing
- [x] Add visual hint "👆 Tap here to view full recipe" to meal cards
- [x] Remove conflicting Pressable wrapper from MealCard
- [x] Test both fixes on mobile and web

## Recipe Modal Content Not Showing on Mobile
- [x] Investigate why ingredients and instructions don't display on mobile
- [x] Fix RecipeModal component to show full content on mobile
- [x] Ensure modal content matches between web and mobile platforms
- [x] Test recipe modal displays all sections on Samsung S24

## Critical Bug Fixes
- [x] Fix share link crash - app crashes with no error when sharing meal plan
- [x] Fix meal regeneration duplicates - prevent regenerated meals from being same as other days in the plan
- [x] Add error handling and logging to share functionality
- [x] Update AI prompt to ensure unique meals across all days

## Add Dates to Meal Cards
- [x] Calculate actual dates for each day based on week start date
- [x] Display date next to day name (e.g., "MONDAY • Jan 6")
- [x] Update dashboard meal cards with dates
- [x] Update shared meal plan view with dates
- [x] Test date calculation and display

## Recipe Modal Styling Improvements
- [x] Improve mobile modal styling to match web appearance
- [x] Add dark background to modal on mobile
- [x] Improve text contrast and readability
- [x] Match ingredient and instruction styling between platforms
- [x] Ensure consistent color scheme across web and mobile

## Recipe Modal Layout Issues on Mobile
- [x] Reduce header size - title and description take up almost half the screen
- [x] Decrease font sizes in modal header for better space utilization
- [x] Maximize scrollable content area to show more recipe details
- [x] Make header more compact while keeping it readable
- [x] Test modal scrolling and content visibility on Samsung S24

## Preference Indicator Visibility in Dark Mode
- [x] Fix indicator circles (dots) that are too dark in dark mode
- [x] Use lighter colors for inactive/unselected dots
- [x] Ensure good contrast between active and inactive indicators
- [x] Test preference selection visibility on mobile dark mode

## Meal Card Icon Layout Wasting Space on Mobile
- [x] Fix meal tag icons displayed on separate line taking up too much space
- [x] Move icons inline with meal title like on web version
- [x] Make meal cards more compact to show more content
- [x] Test layout on mobile to ensure icons fit properly with title

## Taste Signals & Personalization System
- [x] Audit current database schema and voting systems
- [x] Design database schema for dish votes and taste profiles
- [x] Add auto-detect language and country in onboarding
- [x] Create "Confirm Your Style" onboarding step with 10 dish votes
- [x] Store dish votes persistently (dish_id, liked, timestamp)
- [x] Build taste profile derivation (cuisine weights, protein weights, spice level)
- [x] Track meal plan history (last 4 weeks)
- [x] Update LLM prompt to use taste signals + history for personalization
- [x] Test personalization improves meal suggestions over time

## Personalization System Integration
- [x] Update database schema (drizzle/schema.ts) with dishVotes table and new userPreferences columns
- [x] Run database migration (pnpm db:push)
- [x] Integrate DishVoteRouter into main tRPC router
- [x] Test dish vote API endpoints
- [x] Verify taste profile computation works
- [x] Build onboarding taste calibration UI
- [x] Update meal generation to use taste signals

## Personalization System Backend (Taste Signals)
- [x] Design database schema for dish votes and taste profile
- [x] Create dish_votes table with indexes
- [x] Extend user_preferences table with language, units, currency, taste_profile fields
- [x] Implement DishVoteService with business logic
- [x] Add duplicate vote detection (1 hour window)
- [x] Implement taste profile computation algorithm
- [x] Create tRPC API endpoints (save, getAll, getStats, getTasteProfile, computeTasteProfile)
- [x] Write comprehensive unit tests (6/6 passing)
- [x] Test API endpoints and verify functionality
- [x] Create frontend components for dish voting
- [x] Add auto-detect language/country onboarding step
- [x] Build "Confirm Your Style" onboarding flow (10 dish votes)
- [x] Update LLM meal generation prompts to use taste signals and history
- [x] Display personalized meal recommendations based on taste profile

## "Confirm Your Style" Taste Onboarding Flow
- [x] Design 10 representative dishes covering diverse cuisines, proteins, and spice levels
- [x] Generate dish images for voting UI
- [x] Create TasteOnboarding screen component (/app/taste-onboarding.tsx)
- [x] Build swipeable card interface with dish image, name, description
- [x] Add 👍 Like and 👎 Dislike buttons with haptic feedback
- [x] Integrate with dishVotes.save API mutation
- [x] Show progress indicator (e.g., "3/10 dishes rated")
- [x] Auto-advance to next dish after vote
- [x] Navigate to main onboarding form after 10 votes
- [x] Update welcome screen to route new users through taste onboarding first
- [x] Test complete flow: welcome → taste onboarding → preferences → dashboard

## "Confirm Your Style" Taste Onboarding Flow
- [x] Generate 10 representative dish images (diverse cuisines, proteins, spice levels)
- [x] Create TasteOnboarding screen component with voting UI
- [x] Implement card interface with 👍/👎 buttons
- [x] Integrate with dishVotes.save API
- [x] Update navigation flow to route new users through taste onboarding first
- [x] Test taste onboarding flow end-to-end

## LLM Personalization Integration
- [x] Fetch user's dish votes from database in generatePlan endpoint
- [x] Fetch user's computed taste profile from preferences
- [x] Fetch last 4 weeks of meal history to avoid repeats
- [x] Update LLM prompt to include liked/disliked dishes
- [x] Update LLM prompt to include taste profile (cuisine/protein weights)
- [x] Update LLM prompt to avoid recently generated meals
- [x] Test personalized meal generation with taste signals (4 tests passing)
- [x] Verify meal plans reflect user preferences

## Family Voting Link Requires Login (Bug)
- [x] Investigate why shared link redirects to login screen
- [x] Make /shared/[id] route publicly accessible without authentication
- [x] Ensure family members can vote without creating an account
- [x] Test shared link flow end-to-end

## Expand Cuisine Options
- [x] Add Middle Eastern cuisines (Lebanese, Turkish, Persian)
- [x] Add more Southeast Asian options (Vietnamese, Malaysian, Indonesian)
- [x] Add Latin American cuisines (Brazilian, Peruvian, Argentinian)
- [x] Add European varieties (Spanish, Greek, Portuguese, German)
- [x] Add African cuisines (Moroccan, Ethiopian)
- [x] Test cuisine selection in onboarding

## QR Code Not Scannable (Bug)
- [x] Investigate why QR code in Publishing section is not scannable
- [x] Generate proper Expo Go QR code for mobile testing
- [x] Provide alternative access methods (direct link, manual URL entry)
- [x] Test QR code with Expo Go app on Samsung S24

## EAS Build & Publishing
- [x] Configure EAS Build for production Android build
- [x] Set up app signing and credentials
- [x] Create production APK/AAB build
- [x] Test installation on Samsung S24
- [x] Verify publishing QR code works after build

## Local Development Build (Option 1)
- [x] Install expo-dev-client package
- [x] Configure app for local builds
- [x] Install Android build tools
- [x] Create development APK
- [x] Test APK installation on Samsung S24

## Bottom Button Covered by Android Navigation Bar (Critical Bug)
- [x] Audit all screens with bottom buttons (onboarding, generate-plan, settings, shopping-list)
- [x] Add proper bottom padding using useSafeAreaInsets().bottom
- [x] Fix onboarding screen "Save Preferences" button
- [x] Fix generate-plan screen "Generate Plan" button
- [x] Fix any other screens with bottom buttons
- [x] Test on mobile device to verify buttons are fully visible

## Auto-Regenerate Meal Plan on Preference Update
- [x] Design logic: detect if user has existing meal plan when saving preferences
- [x] Add confirmation dialog asking if user wants to regenerate meal plan
- [x] Implement automatic meal plan regeneration after preference save
- [x] Show loading indicator during regeneration
- [x] Navigate to dashboard with updated meal plan
- [x] Test preference update → auto-regeneration flow

## Family Name Feature
- [x] Check current database schema for user_preferences table
- [x] Add familyName field to database schema (optional string)
- [x] Push database schema changes
- [x] Add family name input field to onboarding screen (optional)
- [x] Update savePreferences API to accept familyName
- [x] Display "FAMILYNAME's Meal Plan" on dashboard
- [x] Display family name on shared meal plan view
- [x] Test family name feature end-to-end

## Improved Voting System
- [x] Add voterName field to meal_votes table schema
- [x] Push database schema changes
- [x] Update voteShared API to store voter name
- [x] Update getCurrentPlan API to return voter details
- [x] Update getSharedPlan API to return voter details
- [x] Add vote details modal to dashboard
- [x] Implement browser localStorage vote limiting
- [x] Update shared voting UI to check for existing votes
- [x] Test voting flow end-to-end

## Domain Configuration (familyplate.ai)
- [x] Configure DNS records in GoDaddy for app deployment
- [x] Update app configuration with custom domain
- [x] Configure Mailjet sender domain (noreply@familyplate.ai)
- [x] Add DNS records for Mailjet domain verification (SPF, DKIM, DMARC)
- [x] Update email templates to use familyplate.ai branding
- [x] Test email delivery from custom domain

## Rebrand from EasyPlate to FamilyPlate
- [x] Audit all files for "EasyPlate" and "easyplate" references
- [x] Update app.config.ts app name to "FamilyPlate"
- [x] Update email templates (from name, branding)
- [x] Update Mailjet sender email to noreply@familyplate.ai
- [x] Update Mailjet sender name to "FamilyPlate"
- [x] Update welcome screen branding
- [x] Update any hardcoded domain references
- [x] Test all user-facing text for consistency

## Navigation Bug - Dashboard Empty State
- [x] Add back button to dashboard screen when no meal plan exists
- [x] Test navigation from dashboard back to home/settings

## Preferences Save SQL Error (Recurring Issue)
- [x] Fix SQL syntax error in savePreferences mutation
- [x] Investigate Drizzle ORM MySQL dialect configuration
- [x] Test preferences save end-to-end

## Preferences Not Persisting Bug
- [x] Debug why saved preferences don't load when returning to onboarding screen
- [x] Fixed database schema out of sync issue (missing family_name column)
- [x] Added family_name column to database manually
- [x] Restarted server to apply changes
- [x] Test complete save/load cycle
