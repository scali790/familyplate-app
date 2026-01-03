import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase Configuration
 * 
 * To use this app, you need to:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Email/Password authentication in Firebase Console
 * 3. Create a Firestore database in Firebase Console
 * 4. Add your Firebase config values to .env file:
 *    FIREBASE_API_KEY=your_api_key
 *    FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
 *    FIREBASE_PROJECT_ID=your_project_id
 *    FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
 *    FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 *    FIREBASE_APP_ID=your_app_id
 */

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
