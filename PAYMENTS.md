# Race payment setup

The Miles for Minds registration fee is KSh 1,000 and checkout is handled by Flutterwave for Kenyan M-Pesa or card. Registration remains pending until the Flutterwave webhook is authenticated and the transaction is verified for its reference, status, amount, and KES currency. Card data is entered on Flutterwave-hosted checkout and is never sent to this site.

## Configure production Firebase Functions

Set the production Turnstile secret and Flutterwave test-mode key and webhook hash as Firebase Functions secrets. The local `.secret.local` contains only the emulator test secret; do not use that value in production. Do not put provider credentials in source files or send them in chat.

```powershell
firebase.cmd functions:secrets:set TURNSTILE_SECRET_KEY --project production
firebase.cmd functions:secrets:set FLUTTERWAVE_SECRET_KEY --project production
firebase.cmd functions:secrets:set FLUTTERWAVE_WEBHOOK_HASH --project production
```

Run each command in a local terminal and paste the value from its provider prompt. Use the production Cloudflare Turnstile secret for the registered website hostname, plus Flutterwave test-mode credentials for the first payment checks.

Configure Flutterwave's webhook URL after deploying Functions (project alias: `production`, project ID: `wahome-foundation`):

`https://africa-south1-wahome-foundation.cloudfunctions.net/flutterwavePaymentWebhook`

The webhook secret hash configured in Flutterwave must match `FLUTTERWAVE_WEBHOOK_HASH`.

## Run the local mock payment tests

From the repository root:

```powershell
npm test --prefix functions
```

The tests stub Flutterwave's HTTP responses and verify both M-Pesa and card checkout payloads, plus acceptance/rejection of transaction verification. They make no network requests and do not process real payments.

For an optional end-to-end provider sandbox session, configure Flutterwave test-mode credentials. Flutterwave's test environment uses test keys and mock card details; no live credentials should be used in local development.
