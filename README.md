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

The local environment file `.env.development.local` is ignored by Git. It should contain the development Firebase web app settings, Cloudflare's published Turnstile test site key, the PayPal sandbox web client ID, and both `VITE_USE_FUNCTIONS_EMULATOR=true` and `VITE_USE_FIRESTORE_EMULATOR=true`. Registration calls and data stay in the local emulators; no Secret Manager setup or billing upgrade is needed for local registration testing. See [PAYMENTS.md](PAYMENTS.md) to enable PayPal sandbox checkout.

To test against the cloud project instead, use the separate ignored `.env.cloud.local` file and run `npm.cmd run dev:cloud -- --host localhost --port 5173`; open `http://localhost:5173/#/miles-for-minds`. Set its `VITE_TURNSTILE_SITE_KEY` to a Cloudflare Turnstile site key configured for `localhost`, and set the matching `TURNSTILE_SECRET_KEY` in the production Firebase project. Cloudflare supports registering `localhost` as an allowed hostname for development. Deploy only the registration and dashboard functions:

```powershell
firebase.cmd functions:secrets:set TURNSTILE_SECRET_KEY --project production
firebase.cmd deploy --only functions:registerEvent,functions:listEventRegistrations --project production
```

The cloud mode writes test registrations to production Firestore. They remain unpaid unless someone starts PayPal checkout. To show registrations on the admin dashboard, enable Email/Password sign-in in Firebase Authentication, create an admin Auth user, and add `admins/{uid}` in Firestore with a `role` of `staff` or `superadmin`.

## Firebase project and billing

The Firebase CLI aliases are `default` (`wahome-foundation-dev`) for development and `production` (`wahome-foundation`) for the live project. Keep local development on the emulators. The production project uses the Blaze plan so it can run Cloud Functions.

Before the first production deployment, configure the `TURNSTILE_SECRET_KEY`, `PAYPAL_CLIENT_ID`, and `PAYPAL_CLIENT_SECRET` Functions secrets in the production project. Set `VITE_PAYPAL_CLIENT_ID` as a GitHub Actions repository variable for the Pages build. Follow [PAYMENTS.md](PAYMENTS.md) to configure PayPal sandbox and live checkout. Deploy production services with an explicit project alias, for example:

```powershell
firebase.cmd deploy --only firestore --project production
firebase.cmd deploy --only functions --project production
```

Firestore rules deny all direct client reads and writes; registrations are accepted only through the server function. The dev alias remains the default, so a bare deploy command does not target production.
