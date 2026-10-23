# PayPal checkout setup

Donations and Miles for Minds Run registration use PayPal Checkout. Donors enter an amount in USD. Run registration is displayed locally as KSh 1,000 and charged at US$8.00. PayPal buttons use the public web client ID; Firebase Functions keep the client secret server-side, create the order, and capture it after buyer approval. Captured orders are checked for their reference, completed status, amount, and currency before Firestore is marked paid.

The current PayPal Orders API currency list does not include KES, so checkout uses USD. PayPal supports business accounts in Kenya. Before enabling live checkout, create a PayPal Business account and a REST app in the PayPal Developer Dashboard, then try the sandbox first.

## Configure local checkout

Add the PayPal sandbox app client ID to each ignored Vite environment file used for local development:

```env
VITE_PAYPAL_CLIENT_ID=your-sandbox-client-id
```

For Functions emulators, place the sandbox credentials in `functions/.secret.local` (ignored by Git):

```env
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
```

The default mode is PayPal sandbox. Use sandbox buyer accounts from the PayPal Developer Dashboard to complete a checkout.

## Configure production

Set production PayPal REST app credentials as Firebase Functions secrets, then set the public client ID as the GitHub Actions repository variable `VITE_PAYPAL_CLIENT_ID` so the Pages build can load the PayPal JavaScript SDK:

```powershell
firebase.cmd functions:secrets:set PAYPAL_CLIENT_ID --project production
firebase.cmd functions:secrets:set PAYPAL_CLIENT_SECRET --project production
```

Deploy the updated functions explicitly to the production alias:

```powershell
firebase.cmd deploy --only functions --project production
```

The Functions use PayPal sandbox by default. Firebase prompts for `PAYPAL_MODE` when deploying; choose `live` only after sandbox checkout and capture have been confirmed. Use live app credentials and a live client ID for a live Pages build.

Never expose `PAYPAL_CLIENT_SECRET` in Vite variables, source files, GitHub repository variables, or chat. Only `VITE_PAYPAL_CLIENT_ID` is public.
