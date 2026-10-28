export interface PayPalOrderInput {
  clientId: string;
  clientSecret: string;
  amount: string;
  currency: string;
  reference: string;
  description: string;
  fetchImpl?: typeof fetch;
}

export interface PayPalOrderResult {
  id: string;
  status?: string;
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    amount?: {currency_code?: string; value?: string};
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        custom_id?: string;
        amount?: {currency_code?: string; value?: string};
      }>;
    };
  }>;
}

export interface PayPalCaptureVerificationDiagnostics {
  httpStatus: number;
  paypalDebugId: string | null;
  expected: {
    orderStatus: "COMPLETED";
    captureStatus: "COMPLETED";
    reference: string;
    amount: string;
    currency: string;
  };
  received: {
    orderStatus: string | null;
    purchaseUnitReferenceId: string | null;
    purchaseUnitCustomId: string | null;
    captureCustomId: string | null;
    captureStatus: string | null;
    amount: string | null;
    currency: string | null;
  };
  matches: {
    orderStatus: boolean;
    reference: boolean;
    captureStatus: boolean;
    amount: boolean;
    currency: boolean;
  };
}

const paypalBaseUrl = (mode: string | undefined) => mode === "live" ?
  "https://api-m.paypal.com" :
  "https://api-m.sandbox.paypal.com";

/** Gets a PayPal access token for the selected environment.
 * @param {PayPalOrderInput} input Credentials for the PayPal REST app.
 * @param {string} baseUrl PayPal API base URL.
 * @param {Function} fetchImpl Fetch implementation for the request.
 * @return {Promise<string>} The OAuth access token.
 */
async function getAccessToken(
  input: PayPalOrderInput,
  baseUrl: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  const response = await fetchImpl(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(
        `${input.clientId}:${input.clientSecret}`,
      ).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json() as {
    access_token?: string;
    error_description?: string;
  };
  if (!response.ok || !result.access_token) {
    throw new Error(
      result.error_description || "PayPal authentication failed.",
    );
  }
  return result.access_token;
}

/** Creates a PayPal order using server-verified amount and reference data.
 * @param {PayPalOrderInput} input Order details and server credentials.
 * @param {string | undefined} mode PayPal environment: sandbox or live.
 * @return {Promise<PayPalOrderResult>} The created PayPal order.
 */
export async function createPayPalOrder(
  input: PayPalOrderInput,
  mode: string | undefined = "sandbox",
): Promise<PayPalOrderResult> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const baseUrl = paypalBaseUrl(mode);
  const accessToken = await getAccessToken(input, baseUrl, fetchImpl);
  const response = await fetchImpl(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: input.reference,
        custom_id: input.reference,
        description: input.description,
        amount: {currency_code: input.currency, value: input.amount},
      }],
    }),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json() as PayPalOrderResult & {
    message?: string;
    name?: string;
  };
  if (!response.ok || !result.id) {
    throw new Error(
      result.message || result.name || "PayPal checkout could not be created.",
    );
  }
  return result;
}

/** Captures an approved PayPal order and validates its captured amount.
 * @param {PayPalOrderInput} input Expected order details and
 *   server credentials.
 * @param {string} orderId PayPal order ID returned to the browser.
 * @param {string | undefined} mode PayPal environment: sandbox or live.
 * @param {Function} onVerificationMismatch Optional safe mismatch diagnostics
 *   callback.
 * @return {Promise<PayPalOrderResult | null>} Valid completed payment or null.
 */
export async function capturePayPalOrder(
  input: PayPalOrderInput,
  orderId: string,
  mode: string | undefined = "sandbox",
  onVerificationMismatch?: (
    diagnostics: PayPalCaptureVerificationDiagnostics,
  ) => void,
): Promise<PayPalOrderResult | null> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const baseUrl = paypalBaseUrl(mode);
  const accessToken = await getAccessToken(input, baseUrl, fetchImpl);
  const response = await fetchImpl(
    `${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: "{}",
      signal: AbortSignal.timeout(15000),
    },
  );
  const result = await response.json() as PayPalOrderResult & {
    message?: string;
    name?: string;
  };
  if (!response.ok) {
    throw new Error(
      result.message || result.name || "PayPal payment could not be captured.",
    );
  }
  const unit = result.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const matches = {
    orderStatus: result.status === "COMPLETED",
    reference: unit?.custom_id === input.reference,
    captureStatus: capture?.status === "COMPLETED",
    amount: capture?.amount?.value === input.amount,
    currency: capture?.amount?.currency_code === input.currency,
  };
  if (Object.values(matches).some((matchesExpected) => !matchesExpected)) {
    onVerificationMismatch?.({
      httpStatus: response.status,
      paypalDebugId: response.headers.get("paypal-debug-id"),
      expected: {
        orderStatus: "COMPLETED",
        captureStatus: "COMPLETED",
        reference: input.reference,
        amount: input.amount,
        currency: input.currency,
      },
      received: {
        orderStatus: result.status ?? null,
        purchaseUnitReferenceId: unit?.reference_id ?? null,
        purchaseUnitCustomId: unit?.custom_id ?? null,
        captureCustomId: capture?.custom_id ?? null,
        captureStatus: capture?.status ?? null,
        amount: capture?.amount?.value ?? null,
        currency: capture?.amount?.currency_code ?? null,
      },
      matches,
    });
    return null;
  }
  return result;
}
