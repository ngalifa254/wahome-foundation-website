import { getApps, initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const isConfigured = Boolean(
  typeof firebaseConfig.apiKey === "string" && /^AIza[0-9A-Za-z_-]{35}$/.test(firebaseConfig.apiKey) &&
  firebaseConfig.projectId && firebaseConfig.appId,
);

export const firebaseApp = isConfigured
  ? (getApps()[0] ?? initializeApp(firebaseConfig))
  : null;
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null;
export const functions = firebaseApp ? getFunctions(firebaseApp, "africa-south1") : null;

const useFunctionsEmulator = import.meta.env.DEV &&
  import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === "true";
const useFirestoreEmulator = import.meta.env.DEV &&
  import.meta.env.VITE_USE_FIRESTORE_EMULATOR === "true";

if (useFirestoreEmulator && firestore) {
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  console.info("Firebase client connected to the local Firestore emulator.");
}

if (useFunctionsEmulator && functions) {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  console.info("Firebase client connected to the local Functions emulator.");
} else if (import.meta.env.DEV && functions) {
  console.info("Firebase client using deployed Cloud Functions in africa-south1.");
}
