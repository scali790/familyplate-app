import { describe, it, expect } from "vitest";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

describe("Firebase Configuration", () => {
  it("should initialize Firebase with valid credentials", () => {
    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };

    // Check that all required config values are present
    expect(firebaseConfig.apiKey).toBeDefined();
    expect(firebaseConfig.apiKey).not.toBe("");
    expect(firebaseConfig.authDomain).toBeDefined();
    expect(firebaseConfig.projectId).toBeDefined();
    expect(firebaseConfig.storageBucket).toBeDefined();
    expect(firebaseConfig.messagingSenderId).toBeDefined();
    expect(firebaseConfig.appId).toBeDefined();

    // Try to initialize Firebase
    const app = initializeApp(firebaseConfig, "test-app");
    expect(app).toBeDefined();
    expect(app.name).toBe("test-app");

    // Try to initialize Auth and Firestore
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
  });
});
