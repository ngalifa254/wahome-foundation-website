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
const functionsEmulatorHost = import.meta.env.VITE_FUNCTIONS_EMULATOR_HOST || "127.0.0.1";
const functionsEmulatorPort = Number(import.meta.env.VITE_FUNCTIONS_EMULATOR_PORT) || 5001;

/** Posts JSON to a public HTTPS function endpoint (used for Pesapal order creation). */
export async function postHttpFunction<TRequest, TResponse>(name: string, data: TRequest): Promise<TResponse> {
  const projectId = firebaseApp?.options.projectId;
  if (!projectId) throw new Error("The Firebase project is not configured.");

  const endpoint = useFunctionsEmulator ?
    `http://${functionsEmulatorHost}:${functionsEmulatorPort}/${projectId}/africa-south1/${name}` :
    `https://africa-south1-${projectId}.cloudfunctions.net/${name}`;
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {Accept: "application/json", "Content-Type": "application/json"},
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error(useFunctionsEmulator ?
      `The Functions endpoint is unavailable at ${endpoint}. Start the emulator for ${projectId} with pnpm run emulators.` :
      "Cannot reach the deployed payment function. Please try again later.");
  }
  const result = await response.json() as {error?: unknown} & Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof result.error === "string" ? result.error : "The payment request could not be completed.");
  }
  return result as TResponse;
}

if (useFirestoreEmulator && firestore) {
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  console.info("Firebase client connected to the local Firestore emulator.");
}

if (useFunctionsEmulator && functions) {
  connectFunctionsEmulator(functions, functionsEmulatorHost, functionsEmulatorPort);
  console.info(`Firebase client connected to the local Functions emulator at ${functionsEmulatorHost}:${functionsEmulatorPort}.`);
} else if (import.meta.env.DEV && functions) {
  console.info("Firebase client using deployed Cloud Functions in africa-south1.");
}
