# Race payment setup

The Miles for Minds registration fee is KSh 1,000 and checkout is handled by Flutterwave for Kenyan M-Pesa or card. Registration remains pending until the Flutterwave webhook is authenticated and the transaction is verified for its reference, status, amount, and KES currency. Card data is entered on Flutterwave-hosted checkout and is never sent to this site.

## Configure Firebase Functions

Set the Flutterwave secret key and webhook secret hash as Firebase Functions secrets. Use test-mode credentials for development; do not put credentials in source files or send them in chat.

```powershell
firebase functions:secrets:set FLUTTERWAVE_SECRET_KEY
firebase functions:secrets:set FLUTTERWAVE_WEBHOOK_HASH
```

Configure Flutterwave's webhook URL after deploying Functions (project alias: `wahome-foundation-dev`):

`https://africa-south1-wahome-foundation-dev.cloudfunctions.net/flutterwavePaymentWebhook`

The webhook secret hash configured in Flutterwave must match `FLUTTERWAVE_WEBHOOK_HASH`.

## Run the local mock payment tests

From the repository root:

```powershell
npm test --prefix functions
```

The tests stub Flutterwave's HTTP responses and verify both M-Pesa and card checkout payloads, plus acceptance/rejection of transaction verification. They make no network requests and do not process real payments.

For an optional end-to-end provider sandbox session, configure Flutterwave test-mode credentials. Flutterwave's test environment uses test keys and mock card details; no live credentials should be used in local development.
