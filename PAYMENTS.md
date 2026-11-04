# PayPal checkout setup

Donations and Miles for Minds Run registration use PayPal Checkout. Donors enter an amount in USD. Run registration is displayed locally as KSh 1,000 and charged at US$8.00. PayPal buttons use the public web client ID; Firebase Functions keep the client secret server-side, create the order, and capture it after buyer approval. Captured orders are checked for their reference, completed status, amount, and currency before Firestore is marked paid.

The current PayPal Orders API currency list does not include KES, so checkout uses USD. PayPal supports business accounts in Kenya. Before enabling live checkout, create a PayPal Business account and a REST app in the PayPal Developer Dashboard, then try the sandbox first.

## When PayPal says paid but the dashboard says pending

The admin dashboard verifies new orders through the PayPal capture callback and a signed `PAYMENT.CAPTURE.COMPLETED` webhook. For older pending records, choose **Auto verify** to search PayPal's transaction report using the saved order ID; the server then fetches the matching capture and checks its status, USD amount, currency, and related order before updating Firestore. PayPal's transaction report may take up to three hours to include a capture. If the report cannot find it, enter the receipt's Merchant Transaction ID and choose **Verify capture** as a fallback.

An order ID and a capture/transaction ID are different PayPal identifiers. If PayPal cannot find the saved order ID, use the receipt's Merchant Transaction ID. If the capture lookup succeeds but says it does not match the record, confirm that the transaction was paid through the same live PayPal REST app configured in Firebase and that the capture belongs to that donation or registration. Do not mark a payment verified from a receipt alone when the PayPal API cannot confirm its capture.

Automatic recovery by order ID uses PayPal Transaction Search. Enable the **Transaction Search** permission for the REST app used by Firebase Functions. The webhook and checkout capture callback continue to verify payments immediately; transaction search is the recovery path for earlier payments or missed callbacks.

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

The current `.env.development.local` is missing `VITE_PAYPAL_CLIENT_ID`, which is why the local PayPal button reports that it is not configured. Add a PayPal **sandbox** app client ID there to use PayPal locally; do not copy a live client ID into development. `functions/.secret.local` is also absent, so local Firebase Functions need PayPal sandbox credentials there if you want to test PayPal order creation locally.

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

## Pesapal API 3.0 integration

This repository includes a reusable redirect button at `src/app/components/PesapalCheckoutButton.tsx`. Pesapal does not require a browser SDK for this flow: your server creates the order and returns its hosted `redirect_url`; the component then sends the donor to that URL. There is no npm package to install. Pesapal publishes an official Node sample, but this project's Firebase Functions can call the API 3.0 REST endpoints with `fetch`.

### Configure credentials

Pesapal's consumer key and secret are server credentials. Keep them out of all `VITE_` variables and the browser bundle. For local Functions emulator use, add the two secrets to `functions/.secret.local` (this is ignored by Git):

```env
PESAPAL_CONSUMER_KEY=your-sandbox-consumer-key
PESAPAL_CONSUMER_SECRET=your-sandbox-consumer-secret
```

The other three values are non-secret Firebase Functions parameters. Put them in `functions/.env.local` for the emulator (also ignored by Git):

```env
PESAPAL_MODE=sandbox
PESAPAL_IPN_ID=your-registered-sandbox-ipn-guid
PESAPAL_CALLBACK_URL=https://your-public-https-site.example/payment-return
```

`PESAPAL_CALLBACK_URL` must be a public HTTPS URL configured to return to your site after checkout. Register the deployed `pesapalIpn` endpoint URL (`https://africa-south1-<firebase-project-id>.cloudfunctions.net/pesapalIpn`) against the matching sandbox/live merchant account; put the returned `ipn_id` in `PESAPAL_IPN_ID`. IPNs are sent to the HTTPS Function and payment status is confirmed by querying Pesapal's API. For Firebase deployment, store only the key and secret with `firebase functions:secrets:set PESAPAL_CONSUMER_KEY` and `firebase functions:secrets:set PESAPAL_CONSUMER_SECRET`. Store the mode, IPN ID, and callback URL in `functions/.env.<project-or-alias>` or answer the Firebase parameter prompts at deploy. Use separate sandbox/live settings. Do not put Pesapal credentials in `.env.development.local` or `.env.cloud.local`; no client environment variable is needed.

### Wire the component to the donation flow

The `createOrder` callback passed to the component must call a Firebase callable (for example, `startDonationPesapalOrder`) which validates the donation, creates a pending Firestore record, obtains an API 3.0 bearer token, submits the order, stores Pesapal's tracking ID, and returns `{ donationId, merchantReference, redirectUrl }`. A caller can use it like this in `DonateModal` in `src/app/App.tsx`:

```tsx
<PesapalCheckoutButton
  createOrder={async () => {
    const startOrder = httpsCallable<
      {amount: number; firstName: string; lastName: string; email: string},
      {donationId: string; merchantReference: string; redirectUrl: string}
    >(functions!, "startDonationPesapalOrder");
    const result = await startOrder({amount: Number(amount), firstName, lastName, email});
    sessionStorage.setItem("pesapal-donation", JSON.stringify(result.data));
    return {redirectUrl: result.data.redirectUrl};
  }}
  onError={(error) => setPaymentError(error instanceof Error ? error.message : "Pesapal checkout could not start.")}
/>
```

The donation and run buttons now call `startDonationPesapalOrder` and `startRacePesapalOrder` Firebase Functions. These handlers keep prices on the server, create pending Firestore records, submit Pesapal API 3.0 orders, and return the hosted checkout URL. Do not mark a payment paid from the redirect URL or browser storage.

### Confirm the result on the server

The IPN handler is `pesapalIpn` in `functions/src/index.ts`; Pesapal REST helpers are in `functions/src/pesapalClient.ts`. API 3.0 uses `https://cybqa.pesapal.com/pesapalv3` for sandbox and `https://pay.pesapal.com/v3` for live. The backend authenticates with `POST /api/Auth/RequestToken`, creates orders with `POST /api/Transactions/SubmitOrderRequest`, and checks them using `GET /api/Transactions/GetTransactionStatus?orderTrackingId=...`. Register the IPN URL first; its returned GUID is required as `notification_id` on every order.

Pesapal calls the IPN with `OrderTrackingId` and `OrderMerchantReference`. Those values identify the transaction but do not prove payment. The backend queries Pesapal's status endpoint, matches the returned `merchant_reference`, expected amount, and currency to the pending Firestore record, and sets `paymentStatus: "verified"` only when `status_code` is `1` (`COMPLETED`). Pending transactions remain pending; failed/reversed statuses are recorded as failed. The IPN returns Pesapal's acknowledgement after processing. The IPN is the durable update path if the customer closes the browser; race registration polls the Firestore payment status after returning to the site.

The existing donation modal accepts USD; the Pesapal donation handler currently submits that server-validated amount in USD and therefore requires a Pesapal merchant account enabled for USD. Run registration uses the server-fixed KSh 1,000 fee. Never let the browser choose the amount/currency that gets written as paid.

### Sandbox setup checklist

1. In the Pesapal Sandbox Developer Dashboard, create/find the sandbox merchant account and copy its **Consumer Key** and **Consumer Secret** into `functions/.secret.local` locally. For cloud Functions use Firebase Secrets:

   ```powershell
   firebase.cmd functions:secrets:set PESAPAL_CONSUMER_KEY --project <dev-project-id>
   firebase.cmd functions:secrets:set PESAPAL_CONSUMER_SECRET --project <dev-project-id>
   ```

2. Deploy Functions to the development Firebase project so `pesapalIpn` has a public HTTPS URL, or use an HTTPS tunnel during local testing. In Pesapal **IPN Settings**, register that URL with method **GET**, then copy the returned **IPN ID / notification_id** to `PESAPAL_IPN_ID`.
3. Set `PESAPAL_MODE=sandbox`, `PESAPAL_IPN_ID=<the GUID>`, and `PESAPAL_CALLBACK_URL=<your public HTTPS return page>` in `functions/.env.local` for the emulator or `functions/.env.<project-or-alias>` for deploy.
4. Confirm the sandbox merchant supports the two configured currencies (USD donations and KES run registration). If USD is not enabled, decide whether donations should also be entered/displayed in KES before changing the backend currency policy.
5. Deploy Functions, complete a sandbox donation and registration, then confirm Firestore only changes to `verified` after the IPN's server-side status lookup reports `COMPLETED` with the saved amount/currency.
6. For production, repeat with live Consumer Key/Secret, live IPN registration and GUID, `PESAPAL_MODE=live`, and production callback URL. Keep the sandbox/live credentials and settings separate.

Pesapal API 3.0 references: [Authentication](https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/authentication), [Register IPN URL](https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/registeripnurl), [Submit Order Request](https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/submitorderrequest), [Get Transaction Status](https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/gettransactionstatus), and [Pesapal's Node sample](https://github.com/Pesapal-Ltd/Sample_Api3_node).
