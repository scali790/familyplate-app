# EasyPlate - Mobile App Design Documentation

## Overview
EasyPlate is an AI-powered family meal planner designed for busy families and housewives. The app generates personalized 7-day dinner plans based on user preferences to reduce family disputes over meals.

## Design Philosophy
- **Mobile-first**: Designed for portrait orientation (9:16) with one-handed usage in mind
- **iOS HIG Compliance**: Follows Apple Human Interface Guidelines for a native iOS feel
- **Minimalist & Warm**: Clean interface with rounded corners, soft shadows, and a cozy color palette

## Color Palette
- **Primary (Soft Orange)**: `#FF9F1C` - Used for primary buttons, CTAs, energy and warmth
- **Secondary (Fresh Green)**: `#4CAF50` - Health accents, success states, positive actions
- **Neutral (Beige)**: `#F5F5DC` - Background color for coziness and warmth
- **Text (Deep Blue-Gray)**: `#455A64` - Primary text color for trust and readability
- **Muted Text**: `#687076` (light) / `#9BA1A6` (dark) - Secondary text
- **Error**: `#EF4444` - Error states and destructive actions
- **Border**: `#E5E7EB` (light) / `#334155` (dark) - Dividers and borders

## Typography
- **Font Family**: Poppins (rounded sans-serif for readability)
- **Sizes**:
  - Heading: 24-32px, bold
  - Subheading: 18-20px, semibold
  - Body: 14-16px, regular
  - Caption: 12-14px, regular

## Screen List & Content

### 1. Splash/Welcome Screen
**Purpose**: First impression and app branding
**Content**:
- Centered app logo (stylized empty plate with fork/knife)
- Tagline: "Easy Meals, Happy Tables"
- "Get Started" button (primary orange)

**Flow**: 
- If not logged in → Authentication screens
- If logged in → Dashboard

### 2. Authentication Screens
**Purpose**: User sign-up and login

**Sign Up Screen**:
- Email input field
- Password input field (with show/hide toggle)
- "Sign Up" button (primary)
- "Already have an account? Log In" link

**Login Screen**:
- Email input field
- Password input field (with show/hide toggle)
- "Log In" button (primary)
- "Don't have an account? Sign Up" link

**Flow**: After successful auth → Onboarding (first time) or Dashboard (returning users)

### 3. Onboarding Screen
**Purpose**: Collect user preferences for meal plan generation
**Content**:
- Screen title: "Tell Us About Your Family"
- Family size dropdown (2, 3, 4, 5, 6+)
- Preferred cuisines section:
  - Multi-select chips: Indian, Italian, Chinese, American, Mexican, Korean
  - Limit to 5 selections
  - Visual feedback on selection (filled chips with green accent)
- Flavor preferences section:
  - Checkboxes: Spicy, Mild, Quick-prep (<30 mins), Healthy/Low-carb, Comfort food
- Dietary restrictions text input (placeholder: "e.g., gluten-free, vegan")
- "Save Preferences" button (primary orange)

**Flow**: After save → Dashboard with success toast

### 4. Dashboard/Main Screen
**Purpose**: Central hub for meal plan management
**Layout**:
- **App Bar**:
  - Logo (left)
  - Profile icon (right) → Settings/Logout
- **Hero Section**:
  - "Generate New Plan" button (large, primary orange, centered)
  - Loading spinner during generation
- **Meal Plan Display** (scrollable):
  - 7 cards (one per day)
  - Each card shows:
    - Day label (e.g., "Monday")
    - Meal title (e.g., "Chicken Tikka Masala")
    - Short description (ingredients highlights, prep time, serves)
    - Thumbs up/down icons with vote counts
    - Premium badge overlay (blurred) with "Unlock full recipe" text
- **Empty State** (no plan):
  - Illustration or icon
  - "No meal plan yet"
  - Prompt to generate one

**Interactions**:
- Tap meal card → Show premium modal
- Tap thumbs up/down → Update vote count in real-time
- Pull to refresh → Reload plan

### 5. Settings Screen
**Purpose**: Edit user preferences and manage account
**Content**:
- "Edit Preferences" button → Onboarding screen (pre-filled)
- "Log Out" button (destructive style)
- App version info

### 6. Premium Modal
**Purpose**: Tease premium features (freemium model)
**Content**:
- Modal overlay (semi-transparent background)
- Card with:
  - "Unlock Premium Features" heading
  - List of benefits:
    - Full recipes with step-by-step instructions
    - Shopping lists
    - Nutritional information
  - "Subscribe for $4.99/mo" button (static, no payment integration)
  - "Maybe Later" dismiss button

## Key User Flows

### Flow 1: New User Onboarding
1. User opens app → Splash screen
2. Tap "Get Started" → Sign Up screen
3. Enter email/password → Tap "Sign Up"
4. Redirect to Onboarding screen
5. Fill preferences → Tap "Save Preferences"
6. Redirect to Dashboard with success toast

### Flow 2: Generate Meal Plan
1. User on Dashboard → Tap "Generate New Plan"
2. Show loading spinner
3. Fetch user preferences from Firestore
4. Call OpenAI API with preferences
5. Parse JSON response
6. Save plan to Firestore
7. Display 7 meal cards
8. Success state with vote buttons enabled

### Flow 3: Vote on Meal
1. User views meal card → Tap thumbs up/down
2. Update vote count in Firestore
3. Show updated count with animation
4. Haptic feedback on tap

### Flow 4: Premium Tease
1. User taps meal card → Premium modal appears
2. Show benefits and pricing
3. User taps "Maybe Later" → Modal dismisses
4. (No actual payment integration)

## Accessibility
- High contrast ratios (WCAG AA compliant)
- Large tappable areas (minimum 44x44pt)
- Screen reader support (proper labels and hints)
- Dark mode support (automatic based on system settings)

## Offline Support
- Cache last generated meal plan using AsyncStorage
- Cache user preferences
- Show cached data when offline
- Display "Offline" indicator in app bar
- Retry button for failed API calls

## Technical Notes
- Use React Native with Expo for cross-platform support
- Firebase Authentication for email/password auth
- Firestore for real-time database
- OpenAI API (gpt-4o-mini) for meal generation
- AsyncStorage for offline caching
- Expo Haptics for tactile feedback
- NativeWind (Tailwind CSS) for styling
