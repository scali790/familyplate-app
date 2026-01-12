
# ARCHITECTURE_MOBILE.md
## FamilyPlate – Mobile App (Expo / Android)

⚠️ **IMPORTANT – READ FIRST**
This document defines the **single source of truth** for the FamilyPlate **Mobile Application**.
Any work on the Mobile App must comply with this document.

---

## 1. Scope & Platform
- Platform: **Expo / React Native**
- Target: **Android**
- Location in repo: `/app`
- Deployment: **Not deployed to Vercel**

🚫 Next.js and `apps/web` are **OUT OF SCOPE** for this document.

---

## 2. Source of Truth
- **Mobile UI source of truth:** `/app`
- Backend, API contracts and database schema are **shared**
- Mobile must NOT change backend behavior unilaterally

---

## 3. Architecture Overview
### Frontend
- Expo SDK 54
- React Native 0.81
- React 19
- Routing: Expo Router

### Styling
- NativeWind **4.1.10 (LOCKED)**
- Tailwind subset only
- Dark mode supported

### State & Storage
- tRPC + TanStack React Query
- AsyncStorage for JWT sessions

---

## 4. Features Implemented
- Magic link authentication
- Taste onboarding
- Preferences management
- Meal plan generation (via backend)
- Dashboard with voting
- Recipe modal
- Shopping list

---

## 5. Missing Features (vs Web)
- Day View
- Week View
- Day/Week toggle

These must be rebuilt **natively** for React Native.

---

## 6. Critical Rules (DO NOT VIOLATE)
- ❌ No shadcn/ui
- ❌ No HTML elements (`div`, `button`, etc.)
- ❌ No Next.js assumptions
- ❌ No backend or schema changes from mobile context
- ❌ Do NOT upgrade NativeWind without testing Metro

---

## 7. Safe Area & UX Rules
- Always use `useSafeAreaInsets()`
- Bottom padding must account for Android navigation bar

---

## 8. Intended Direction
- Achieve feature parity with Web App
- Preserve native UX (haptics, gestures)
- Prepare for iOS support later

---

## 9. Golden Rule
Mobile work must remain **isolated**, **predictable**, and **coordinated** with the Web App.
