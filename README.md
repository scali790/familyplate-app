# EasyPlate - AI Family Meal Planner

**Easy Meals, Happy Tables**

EasyPlate is an AI-powered family meal planner that generates personalized 7-day dinner plans based on user preferences to reduce family disputes over meals. Built with React Native and Expo for cross-platform iOS and Android support.

## Features

- 🔐 **Firebase Authentication**: Secure email/password sign-up and login
- 🍽️ **AI Meal Planning**: OpenAI-powered personalized 7-day meal plans
- 👨‍👩‍👧‍👦 **Family Preferences**: Customizable family size, cuisines, flavors, and dietary restrictions
- 👍👎 **Family Voting**: Vote on meals to help decide what the family likes
- 💾 **Offline Support**: Cached meal plans and preferences work offline
- 🎨 **Beautiful UI**: Minimalist design with warm colors and smooth animations
- 🌙 **Dark Mode**: Automatic theme switching based on system settings

## Tech Stack

- **Frontend**: React Native 0.81 with Expo SDK 54
- **Styling**: NativeWind 4 (Tailwind CSS for React Native)
- **Backend**: Firebase Authentication + Firestore Database
- **AI**: OpenAI API (gpt-4o-mini model)
- **State Management**: React Context + Hooks
- **Offline Storage**: AsyncStorage
- **Language**: TypeScript 5.9

## Prerequisites

Before running the app, you need:

1. **Node.js** (v18 or higher)
2. **pnpm** (package manager)
3. **Expo Go** app on your mobile device ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
4. **Firebase Project** (see setup below)
5. **OpenAI API Key** (see setup below)

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
pnpm install
\`\`\`

### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable **Email/Password** authentication:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
4. Create a **Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in **test mode** (for development)
5. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Add web app
   - Copy the config object
6. Add Firebase credentials to the app:
   - The app will prompt you for these values on first run
   - Or add them manually to Settings → Secrets in the Management UI

### 3. OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Important**: Set up billing in your OpenAI account
6. Add the API key when prompted by the app

**Cost**: Each meal plan generation costs approximately $0.01-0.02 using the `gpt-4o-mini` model.

### 4. Run the App

\`\`\`bash
pnpm dev
\`\`\`

This will start the Expo development server. You'll see a QR code in the terminal.

### 5. Test on Your Device

1. Open **Expo Go** app on your phone
2. Scan the QR code from the terminal
3. The app will load on your device

**Note**: Make sure your phone and computer are on the same Wi-Fi network.

## Project Structure

\`\`\`
easyplate/
├── app/                      # App screens (Expo Router file-based routing)
│   ├── (tabs)/              # Tab navigation
│   │   └── index.tsx        # Home/routing screen
│   ├── auth/                # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── welcome.tsx          # Splash/welcome screen
│   ├── onboarding.tsx       # User preferences setup
│   ├── dashboard.tsx        # Main meal plan screen
│   ├── generate-plan.tsx    # AI generation screen
│   ├── settings.tsx         # Settings screen
│   └── premium-modal.tsx    # Premium features modal
├── components/              # Reusable UI components
│   ├── screen-container.tsx # SafeArea wrapper
│   └── ui/
│       └── icon-symbol.tsx  # Icon component
├── lib/                     # Core services and utilities
│   ├── firebase.ts          # Firebase configuration
│   ├── auth-provider.tsx    # Authentication context
│   ├── openai-service.ts    # OpenAI meal plan generation
│   ├── offline-storage.ts   # AsyncStorage utilities
│   └── utils.ts             # Helper functions
├── hooks/                   # Custom React hooks
│   ├── use-auth.ts
│   ├── use-colors.ts
│   └── use-color-scheme.ts
├── assets/                  # Images and static files
│   └── images/
│       └── icon.png         # App logo
├── theme.config.js          # Theme colors configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── app.config.ts            # Expo app configuration
└── package.json             # Dependencies

\`\`\`

## Database Schema (Firestore)

### Collections

**users**
- `userId`: string (Firebase Auth UID)
- `email`: string

**preferences**
- `userId`: string
- `familySize`: string (e.g., "4")
- `cuisines`: array of strings
- `flavors`: array of strings
- `restrictions`: string
- `createdAt`: ISO timestamp

**plans**
- `userId`: string
- `planId`: auto-generated
- `meals`: array of objects
  - `day`: string (e.g., "Monday")
  - `title`: string
  - `description`: string
- `createdAt`: ISO timestamp

**votes**
- `userId`: string
- `mealId`: string (format: `{planId}_{day}`)
- `likes`: number
- `dislikes`: number

## Key Features Explained

### AI Meal Plan Generation

The app uses OpenAI's `gpt-4o-mini` model to generate personalized meal plans. The prompt includes:
- Family size
- Preferred cuisines (up to 5)
- Flavor preferences (spicy, mild, quick-prep, healthy, comfort)
- Dietary restrictions

The AI returns a JSON array of 7 meals with titles and descriptions.

### Offline Support

The app caches:
- Last generated meal plan
- User preferences

When offline, the app displays cached data. All data syncs when back online.

### Freemium Model

The app includes a premium teaser:
- Premium badge on meal cards
- Modal showing benefits (full recipes, shopping lists, nutrition info)
- Static "$4.99/mo" pricing (no actual payment integration)

## Customization

### Theme Colors

Edit `theme.config.js` to change app colors:

\`\`\`javascript
const themeColors = {
  primary: { light: '#FF9F1C', dark: '#FF9F1C' },  // Soft orange
  success: { light: '#4CAF50', dark: '#4CAF50' },  // Fresh green
  background: { light: '#F5F5DC', dark: '#151718' }, // Beige
  // ... more colors
};
\`\`\`

### App Branding

Edit `app.config.ts` to change app name and metadata:

\`\`\`typescript
const env = {
  appName: "EasyPlate",
  appSlug: "easyplate",
  logoUrl: "...",
};
\`\`\`

## Testing

Run tests:

\`\`\`bash
pnpm test
\`\`\`

Tests include:
- Firebase configuration validation
- OpenAI API key validation

## Deployment

### Build for iOS

\`\`\`bash
pnpm ios
\`\`\`

### Build for Android

\`\`\`bash
pnpm android
\`\`\`

### Production Build

For app store deployment, use EAS Build:

\`\`\`bash
npx eas build --platform all
\`\`\`

See [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/) for details.

## Troubleshooting

### Firebase Errors

- **"API key invalid"**: Check that you've entered the correct Firebase config
- **"Permission denied"**: Make sure Firestore is in test mode or set up proper security rules

### OpenAI Errors

- **"Invalid API key"**: Verify your key starts with `sk-` and is active
- **"Quota exceeded"**: Add billing information to your OpenAI account
- **"Rate limit"**: Wait a few seconds and try again

### Expo Go Issues

- **"Unable to connect"**: Ensure phone and computer are on the same network
- **"Network error"**: Check firewall settings

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase and OpenAI documentation
3. Check Expo documentation for mobile-specific issues

## Acknowledgments

- **Expo** for the amazing React Native framework
- **Firebase** for authentication and database
- **OpenAI** for AI-powered meal planning
- **NativeWind** for Tailwind CSS in React Native

---

Built with ❤️ using React Native and Expo
