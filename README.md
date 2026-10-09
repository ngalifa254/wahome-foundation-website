# Responsive Nonprofit Website

This repository contains the Wahome Foundation website and the Miles for Minds event registration flow.

## Run locally in VS Code

Use two integrated terminal tabs from the repository root:

1. Start the Firebase Functions and Firestore emulators:

   ```powershell
   npm run emulators
   ```

   The Emulator Suite UI is at <http://127.0.0.1:4000>.

2. Start the Vite website:

   ```powershell
   npm run dev -- --host 127.0.0.1 --port 5173
   ```

   Open <http://127.0.0.1:5173/#/miles-for-minds> to use the event page. In development, the Firebase client connects to the local emulators. The checked-in Firebase project alias is `wahome-foundation-dev`; emulator data stays on your computer unless you explicitly deploy or export it.

The local environment file `.env.development.local` is ignored by Git. It should contain the Firebase web app settings and Cloudflare's published Turnstile test site key. The Functions emulator uses the matching test secret fallback; no Secret Manager setup or billing upgrade is needed for local testing.

## Firebase project and billing

The production Cloud Functions deployment requires Firebase's Blaze plan. This project is kept on Spark, so use the emulators for development and do not run `firebase deploy --only functions` while staying on Spark. Firestore rules deny all direct client reads and writes; registrations are accepted only through the server function.
