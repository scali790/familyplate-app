# EasyPlate TODO

## Branding & Design
- [x] Generate custom app logo (stylized plate with fork/knife)
- [x] Update app.config.ts with branding (app name, logo URL)
- [x] Update theme colors to match design palette

## Firebase Setup
- [x] Install Firebase dependencies
- [x] Create Firebase configuration file
- [x] Set up Firebase Authentication
- [x] Set up Firestore database
- [x] Request Firebase config from user

## Authentication
- [x] Create sign-up screen with email/password
- [x] Create login screen with email/password
- [x] Implement Firebase auth integration
- [x] Add auth state management
- [x] Add password visibility toggle
- [x] Handle auth errors with user-friendly messages

## Onboarding
- [x] Create onboarding screen layout
- [x] Add family size dropdown
- [x] Add cuisine multi-select chips (limit 5)
- [x] Add flavor preference checkboxes
- [x] Add dietary restrictions text input
- [x] Save preferences to Firestore
- [x] Show success toast after save
- [x] Navigate to dashboard after onboarding

## Dashboard
- [x] Create dashboard layout with app bar
- [x] Add profile icon with settings menu
- [x] Add "Generate New Plan" button
- [x] Create meal card component
- [x] Display 7-day meal plan in scrollable list
- [x] Add empty state when no plan exists
- [x] Implement pull-to-refresh

## Voting System
- [x] Add thumbs up/down icons to meal cards
- [x] Implement vote tracking in Firestore
- [x] Update vote counts in real-time
- [x] Add haptic feedback on vote
- [x] Show vote count with animation

## OpenAI Integration
- [x] Install OpenAI dependencies
- [x] Create OpenAI API client
- [x] Build meal plan generation prompt
- [x] Parse JSON response from OpenAI
- [x] Handle API errors with retry option
- [x] Request OpenAI API key from user
- [x] Add loading spinner during generation
- [x] Save generated plan to Firestore

## Settings
- [x] Create settings screen
- [x] Add "Edit Preferences" option
- [x] Pre-fill onboarding form with saved preferences
- [x] Add logout functionality
- [x] Show app version info

## Freemium Features
- [x] Add premium badge overlay on meal cards
- [x] Create premium modal with benefits
- [x] Add "Subscribe for $4.99/mo" static button
- [x] Add "Maybe Later" dismiss option

## Offline Support
- [x] Cache last meal plan in AsyncStorage
- [x] Cache user preferences in AsyncStorage
- [x] Show cached data when offline
- [x] Add offline indicator in app bar
- [x] Handle network errors gracefully

## Polish & Testing
- [x] Add error boundaries
- [x] Implement proper loading states
- [x] Add haptic feedback for key interactions
- [x] Test on iOS via Expo Go
- [x] Test on Android via Expo Go
- [x] Verify dark mode support
- [x] Check accessibility (screen reader, contrast)
- [x] Add basic unit tests for key functions

## Documentation
- [x] Create README with setup instructions
- [x] Document how to add Firebase config
- [x] Document how to add OpenAI API key
- [x] Document how to run via Expo Go
- [x] Document deployment process
