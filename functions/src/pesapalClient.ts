export interface PesapalAddress {
  email_address?: string;
  phone_number?: string;
  country_code?: string;
  first_name?: string;
  last_name?: string;
}

export interface PesapalOrderInput {
  consumerKey: string;
  consumerSecret: string;
  mode: string;
  merchantReference: string;
  amount: number;
  currency: string;
  description: string;
  callbackUrl: string;
  ipnId: string;
  billingAddress: PesapalAddress;
}

export interface PesapalOrderResult {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  status?: string;
  error?: {message?: string; code?: string} | null;
}

export interface PesapalTransactionStatus {
  order_tracking_id?: string;
  merchant_reference?: string;
  payment_status_description?: string;
  status_code?: number;
  amount?: number;
  currency?: string;
  confirmation_code?: string;
  payment_method?: string;
  error?: {message?: string; code?: string} | null;
}

const baseUrl = (mode: string) => mode === "live" ?
  "https://pay.pesapal.com/v3" :
  "https://cybqa.pesapal.com/pesapalv3";

async function getAccessToken(consumerKey: string, consumerSecret: string, root: string): Promise<string> {
  const response = await fetch(`${root}/api/Auth/RequestToken`, {
    method: "POST",
    headers: {Accept: "application/json", "Content-Type": "application/json"},
    body: JSON.stringify({consumer_key: consumerKey, consumer_secret: consumerSecret}),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json() as {token?: string; message?: string; error?: {message?: string}};
  if (!response.ok || !result.token) {
    throw new Error(result.error?.message || result.message || "Pesapal authentication failed.");
  }
  return result.token;
}

/** Creates a Pesapal API 3.0 order using server-owned price and reference data.
 * @param {PesapalOrderInput} input Order details and server credentials.
 * @return {Promise<PesapalOrderResult>} Pesapal redirect URL and tracking ID.
 */
export async function createPesapalOrder(input: PesapalOrderInput): Promise<PesapalOrderResult> {
  const root = baseUrl(input.mode);
  const token = await getAccessToken(input.consumerKey, input.consumerSecret, root);
  const response = await fetch(`${root}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: input.merchantReference,
      currency: input.currency,
      amount: input.amount,
      description: input.description,
      callback_url: input.callbackUrl,
      notification_id: input.ipnId,
      billing_address: input.billingAddress,
    }),
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json() as PesapalOrderResult;
  if (!response.ok || !result.redirect_url || !result.order_tracking_id ||
      result.merchant_reference !== input.merchantReference) {
    throw new Error(result.error?.message || "Pesapal could not create the checkout order.");
  }
  return result;
}

/** Queries Pesapal for an order's authoritative status.
 * @param {string} consumerKey Pesapal merchant consumer key.
 * @param {string} consumerSecret Pesapal merchant consumer secret.
 * @param {string} mode sandbox or live.
 * @param {string} trackingId Pesapal order tracking ID.
 * @return {Promise<PesapalTransactionStatus>} Current transaction details.
 */
export async function getPesapalTransactionStatus(
  consumerKey: string,
  consumerSecret: string,
  mode: string,
  trackingId: string,
): Promise<PesapalTransactionStatus> {
  const root = baseUrl(mode);
  const token = await getAccessToken(consumerKey, consumerSecret, root);
  const response = await fetch(
    `${root}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(trackingId)}`,
    {
      headers: {Accept: "application/json", Authorization: `Bearer ${token}`},
      signal: AbortSignal.timeout(15000),
    },
  );
  const result = await response.json() as PesapalTransactionStatus;
  if (!response.ok || result.error?.message) {
    throw new Error(result.error?.message || "Pesapal transaction status could not be retrieved.");
  }
  return result;
}
