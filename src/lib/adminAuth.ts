import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseApp } from "./firebase";

export { onAuthStateChanged, signInWithEmailAndPassword };

// The public site can render without Firebase config (for example, in an
// unconfigured Pages preview). Firebase-backed actions stay unavailable then.
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;

export interface AdminUser {
  uid: string;
  email: string;
  role: "superadmin" | "staff";
}

export async function verifyAdminRole(user: User): Promise<AdminUser | null> {
  if (!db) return null;
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
  if (!auth) throw new Error("Firebase Auth is not configured for this deployment.");
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out admin:", error);
    throw error;
  }
}
