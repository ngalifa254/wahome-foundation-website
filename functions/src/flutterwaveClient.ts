/* eslint-disable max-len, quote-props */
export type FlutterwavePaymentMethod = "mpesa" | "card";

type FetchLike = typeof fetch;

export interface HostedCheckoutInput {
  secretKey: string;
  txRef: string;
  amountKes: number;
  method: FlutterwavePaymentMethod;
  returnUrl: string;
  customer: {email: string; name: string; phone: string};
  registrationId: string;
  eventSlug: string;
  fetchImpl?: FetchLike;
}

/** Creates a hosted Flutterwave checkout for the selected payment method.
 * @param {HostedCheckoutInput} input Checkout and registration details.
 * @return {Promise<string>} Flutterwave's hosted checkout URL.
 */
export async function createHostedCheckout(input: HostedCheckoutInput): Promise<string> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {Authorization: `Bearer ${input.secretKey}`, "content-type": "application/json"},
    body: JSON.stringify({
      tx_ref: input.txRef,
      amount: input.amountKes,
      currency: "KES",
      redirect_url: input.returnUrl,
      payment_options: input.method,
      customer: {
        email: input.customer.email,
        name: input.customer.name,
        phonenumber: input.customer.phone,
      },
      meta: {registration_id: input.registrationId, event_slug: input.eventSlug},
      customizations: {title: "Miles for Minds Registration", description: `Race registration ${input.txRef}`},
    }),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json() as {status?: string; message?: string; data?: {link?: string}};
  if (!response.ok || result.status !== "success" || !result.data?.link) {
    throw new Error(result.message || "Flutterwave checkout could not be created.");
  }
  return result.data.link;
}

export interface VerifiedFlutterwavePayment {
  status?: string;
  data?: {status?: string; tx_ref?: string; amount?: number; currency?: string; flw_ref?: string};
}

/** Confirms a payment against Flutterwave and the expected registration data.
 * @param {object} input Verification keys and expected transaction data.
 * @return {Promise<VerifiedFlutterwavePayment | null>} Verified transaction or null.
 */
export async function verifyFlutterwaveTransaction(input: {
  secretKey: string;
  transactionId: string | number;
  expectedTxRef: string;
  expectedAmountKes: number;
  fetchImpl?: FetchLike;
}): Promise<VerifiedFlutterwavePayment | null> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(input.transactionId)}/verify`, {
    headers: {Authorization: `Bearer ${input.secretKey}`},
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json() as VerifiedFlutterwavePayment;
  const payment = result.data;
  if (!response.ok || result.status !== "success" || payment?.status !== "successful" ||
    payment.tx_ref !== input.expectedTxRef || payment.amount !== input.expectedAmountKes || payment.currency !== "KES") {
    return null;
  }
  return result;
}
