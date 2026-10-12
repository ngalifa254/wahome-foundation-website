import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export { onAuthStateChanged, signInWithEmailAndPassword };

// Reuse existing initialized app or initialize
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "wahome-foundation-dev",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export interface AdminUser {
  uid: string;
  email: string;
  role: "superadmin" | "staff";
}

export async function verifyAdminRole(user: User): Promise<AdminUser | null> {
  try {
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      return {
        uid: user.uid,
        email: user.email || "",
        role: data.role || "staff",
      };
    }
    return null;
  } catch (error) {
    console.error("Error verifying admin role:", error);
    return null;
  }
}

// Added function required by App.tsx
export async function signOutAdmin(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out admin:", error);
    throw error;
  }
}
