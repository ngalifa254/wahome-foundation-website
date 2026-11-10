/* eslint-disable max-len */
import {getApps, initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {randomBytes} from "node:crypto";
import cors from "cors";
import type {Request as ExpressRequest, Response as ExpressResponse} from "express";
import {setGlobalOptions} from "firebase-functions";
import {defineSecret, defineString} from "firebase-functions/params";
import {HttpsError, onCall, onRequest} from "firebase-functions/v2/https";
import {capturePayPalOrder, createPayPalOrder, ensurePayPalCaptureWebhook, findPayPalCaptureIdByOrderId, getPayPalCapture, verifyPayPalWebhook, type PayPalOrderResult, type PayPalWebhookEvent} from "./paypalClient.js";
import {createPesapalOrder, getPesapalTransactionStatus} from "./pesapalClient.js";

const turnstileSecret = defineSecret("TURNSTILE_SECRET_KEY");
const paypalClientId = defineSecret("PAYPAL_CLIENT_ID");
const paypalClientSecret = defineSecret("PAYPAL_CLIENT_SECRET");
const paypalMode = defineString("PAYPAL_MODE", {default: "sandbox"});
const pesapalConsumerKey = defineSecret("PESAPAL_CONSUMER_KEY");
const pesapalConsumerSecret = defineSecret("PESAPAL_CONSUMER_SECRET");
const pesapalMode = defineString("PESAPAL_MODE", {default: "sandbox"});
const pesapalIpnId = defineString("PESAPAL_IPN_ID", {default: ""});
const pesapalCallbackUrl = defineString("PESAPAL_CALLBACK_URL", {default: ""});
const corsHandler = cors({origin: true, optionsSuccessStatus: 200});
const eventSlug = "miles-for-minds-2027";
const privacyNoticeVersion = "miles-for-minds-2027-v1";
const registrationClosesAt = Date.parse("2027-01-06T00:00:00+03:00");
const allowedCategories = new Set(["21k", "10k", "5k", "children_fun_run", "children_5k"]);

setGlobalOptions({maxInstances: 10, region: "africa-south1"});

const app = getApps()[0] ?? initializeApp();
const db = getFirestore(app);
const registrationFeeKes = 1000;
const registrationFeeUsd = "8.00";
const donationCurrency = "USD";

type TurnstileResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
  metadata?: {result_with_testing_key?: boolean};
  "error-codes"?: string[];
};

/**
 * Returns a trimmed, length-checked text field from the request.
 * @param {Record<string, unknown>} data Request fields.
 * @param {string} key Field name.
 * @param {number} maxLength Maximum number of characters.
 * @return {string} The validated field.
 */
function requiredText(data: Record<string, unknown>, key: string, maxLength: number): string {
  const value = data[key];
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `Please enter a valid ${key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}.`);
  }
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || trimmed.length > maxLength) {
    throw new HttpsError("invalid-argument", `Please enter a valid ${key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}.`);
  }
  return trimmed;
}

/**
 * Validates and normalizes the registration contact email.
 * @param {unknown} value Untrusted email value.
 * @return {string} The normalized email.
 */
function validateEmail(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "Please enter a valid email address.");
  }
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "Please enter a valid email address.");
  }
  return email;
}

/**
 * Validates a contact phone and preserves its display formatting.
 * @param {unknown} value Untrusted phone value.
 * @return {string} The validated phone.
 */
function validatePhone(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "Please enter a valid phone number.");
  }
  const phone = value.trim();
  const digitCount = phone.replace(/\D/g, "").length;
  if (!/^[+0-9() .-]{7,24}$/.test(phone) || digitCount < 7 || digitCount > 15) {
    throw new HttpsError("invalid-argument", "Please enter a valid phone number.");
  }
  return phone;
}

/** Runs a standard JSON HTTP handler after CORS middleware has handled preflight.
 * @param {(request: Request) => Promise<unknown>} handler Business logic.
 * @return {(request: Request, response: Response) => void} HTTP function handler.
 */
function withCors(handler: (request: ExpressRequest) => Promise<unknown>) {
  return (request: ExpressRequest, response: ExpressResponse): void => {
    corsHandler(request, response, () => {
      if (request.method !== "POST") {
        response.status(405).json({error: "Method not allowed."});
        return;
      }
      void handler(request).then((result) => {
        response.status(200).json(result);
      }).catch((error: unknown) => {
        const statusByCode: Record<string, number> = {
          "invalid-argument": 400,
          "failed-precondition": 409,
          "not-found": 404,
          "permission-denied": 403,
          "unauthenticated": 401,
          "unavailable": 503,
        };
        const status = error instanceof HttpsError ? statusByCode[error.code] || 500 : 500;
        const message = error instanceof Error ? error.message : "The request could not be completed.";
        if (status === 500) console.error("Pesapal HTTP handler failed", message);
        response.status(status).json({error: message});
      });
    });
  };
}

/**
 * Verifies the one-use Turnstile token with Cloudflare Siteverify.
 * @param {string} token Turnstile response token.
 * @param {string} secret Server-side Siteverify key.
 * @param {string} expectedAction Expected Turnstile action.
 * @param {string=} origin Request origin, when supplied.
 * @return {Promise<void>} Resolves only for a valid token.
 */
async function verifyTurnstile(token: string, secret: string, expectedAction: string, origin?: string): Promise<void> {
  const parameters = new URLSearchParams({secret, response: token});
  let validation: TurnstileResult;
  let response: Response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {"content-type": "application/x-www-form-urlencoded"},
      body: parameters,
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error("Turnstile Siteverify request failed", error instanceof Error ? error.name : "unknown error");
    throw new HttpsError("unavailable", "Spam protection could not be reached. Please try again.");
  }

  try {
    validation = await response.json() as TurnstileResult;
  } catch (error) {
    console.error("Turnstile Siteverify returned invalid JSON", {
      httpStatus: response.status,
      errorName: error instanceof Error ? error.name : "unknown error",
    });
    throw new HttpsError("unavailable", "Spam protection could not be reached. Please try again.");
  }

  if (!response.ok) {
    console.error("Turnstile Siteverify returned a non-success HTTP status", {
      httpStatus: response.status,
      errorCodes: validation["error-codes"] || [],
    });
    throw new HttpsError("unavailable", "Spam protection could not be reached. Please try again.");
  }

  const isEmulatorTestToken = process.env.FUNCTIONS_EMULATOR === "true" &&
    validation.metadata?.result_with_testing_key === true;
  if (!validation.success || (validation.action !== expectedAction && !isEmulatorTestToken)) {
    throw new HttpsError("permission-denied", "Spam protection could not verify this submission. Please complete the check again.");
  }

  if (!isEmulatorTestToken && origin) {
    if (typeof validation.hostname !== "string" || validation.hostname.length === 0) {
      throw new HttpsError("permission-denied", "Spam protection could not verify this submission. Please refresh the check and try again.");
    }
    try {
      const originHostname = new URL(origin).hostname.toLowerCase();
      if (validation.hostname.toLowerCase() !== originHostname) {
        throw new HttpsError("permission-denied", "Spam protection could not verify this submission. Please refresh the check and try again.");
      }
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      throw new HttpsError("invalid-argument", "The registration request has an invalid origin.");
    }
  }
}

export const registerEvent = onCall({
  secrets: [turnstileSecret],
  timeoutSeconds: 20,
}, async (request) => {
  if (typeof request.data !== "object" || request.data === null || Array.isArray(request.data)) {
    throw new HttpsError("invalid-argument", "The registration details are invalid.");
  }
  const data = request.data as Record<string, unknown>;
  const participantName = requiredText(data, "participantName", 150);
  const participantAge = data.participantAge;
  if (typeof participantAge !== "number" || !Number.isInteger(participantAge) || participantAge < 0 || participantAge > 120) {
    throw new HttpsError("invalid-argument", "Please enter a valid participant age.");
  }

  const gender = data.gender;
  if (gender !== "male" && gender !== "female") {
    throw new HttpsError("invalid-argument", "Please choose male or female for participant gender.");
  }

  const raceCategory = data.raceCategory;
  if (typeof raceCategory !== "string" || !allowedCategories.has(raceCategory)) {
    throw new HttpsError("invalid-argument", "Please choose a valid race category.");
  }
  const participantIsMinor = participantAge < 18;
  if ((raceCategory === "children_fun_run" || raceCategory === "children_5k") && !participantIsMinor) {
    throw new HttpsError("invalid-argument", "The Children's Fun Run is for participants under 18.");
  }

  const registrationTier = data.registrationTier;
  const tierFees: Record<string, number> = {Regular: 500, VIP: 1000, VVIP: 1500, "Beneficiary school student": 0};
  if (typeof registrationTier !== "string" || !Object.prototype.hasOwnProperty.call(tierFees, registrationTier)) {
    throw new HttpsError("invalid-argument", "Please choose a valid registration package.");
  }
  const isBeneficiaryStudent = registrationTier === "Beneficiary school student";
  const beneficiarySchoolName = isBeneficiaryStudent ? requiredText(data, "beneficiarySchoolName", 150) : null;
  const schoolRepresentativeName = isBeneficiaryStudent ? requiredText(data, "schoolRepresentativeName", 150) : null;
  const schoolRepresentativeEmail = isBeneficiaryStudent ? validateEmail(data.schoolRepresentativeEmail) : null;
  const schoolRepresentativePhone = isBeneficiaryStudent ? validatePhone(data.schoolRepresentativePhone) : null;

  const guardianRequired = participantIsMinor;
  let guardianName: string | null = null;
  let guardianRelationship: string | null = null;
  if (guardianRequired) {
    guardianName = requiredText(data, "guardianName", 150);
    const relationship = data.guardianRelationship;
    if (relationship !== "parent" && relationship !== "legal_guardian" && relationship !== "other") {
      throw new HttpsError("invalid-argument", "Please select the parent or guardian’s relationship to the participant.");
    }
    guardianRelationship = relationship;
    if (data.guardianAuthorized !== true) {
      throw new HttpsError("failed-precondition", "A parent or authorised guardian must confirm the registration for anyone under 18.");
    }
  }

  const contactEmail = validateEmail(data.contactEmail);
  const contactPhone = validatePhone(data.contactPhone);
  if (data.privacyNoticeAccepted !== true) {
    throw new HttpsError("failed-precondition", "Accept the privacy notice to submit this registration.");
  }
  if (typeof data.futureEventUpdates !== "boolean") {
    throw new HttpsError("invalid-argument", "The future-events preference is invalid.");
  }

  if (Date.now() >= registrationClosesAt) {
    throw new HttpsError("failed-precondition", "Registration closed on January 5, 2027.");
  }

  const isDevMode = process.env.FUNCTIONS_EMULATOR === "true" || process.env.NODE_ENV === "development";

  // Verify Turnstile on production, bypass on local test
  if (!isDevMode) {
    const token = data.turnstileToken;
    if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
      throw new HttpsError("failed-precondition", "Complete the spam protection check before submitting.");
    }

    const secret = turnstileSecret.value() || "";
    if (!secret) {
      throw new HttpsError("unavailable", "Spam protection is not configured. Please try again later.");
    }
    const originHeader = request.rawRequest.headers.origin;
    await verifyTurnstile(token, secret, "event_registration", typeof originHeader === "string" ? originHeader : undefined);
  }

  const registration = await db.collection("eventRegistrations").add({
    eventSlug,
    submittedAt: FieldValue.serverTimestamp(),
    participantName,
    participantAge,
    gender,
    participantIsMinor,
    raceCategory,
    registrationTier,
    beneficiarySchoolName,
    schoolRepresentativeName,
    schoolRepresentativeEmail,
    schoolRepresentativePhone,
    guardianName,
    guardianRelationship,
    guardianAuthorized: guardianRequired,
    contactEmail,
    contactPhone,
    privacyNoticeAcceptedAt: FieldValue.serverTimestamp(),
    privacyNoticeVersion,
    futureEventUpdates: data.futureEventUpdates,
    feeKes: tierFees[registrationTier],
    paymentStatus: "pending",
    paymentReference: `WF${randomBytes(5).toString("hex").toUpperCase()}`,
    paymentMethod: null,
    paymentProvider: null,
    paidAt: null,
  });

  return {registrationId: registration.id, paymentStatus: "pending" as const};
});

export const startDonationPayPalOrder = onCall({
  secrets: [paypalClientId, paypalClientSecret],
  timeoutSeconds: 30,
}, async (request) => {
  if (typeof request.data !== "object" || request.data === null || Array.isArray(request.data)) {
    throw new HttpsError("invalid-argument", "The donation details are invalid.");
  }
  const data = request.data as Record<string, unknown>;
  const firstName = requiredText(data, "firstName", 80);
  const lastName = typeof data.lastName === "string" ? data.lastName.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new HttpsError("invalid-argument", "Please enter a valid email address.");
  }
  const amount = data.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 1 || amount > 10000) {
    throw new HttpsError("invalid-argument", "Enter a donation amount between $1 and $10,000.");
  }
  const roundedAmount = Math.round(amount * 100) / 100;
  const donationRef = db.collection("donations").doc();
  const donationAmount = roundedAmount.toFixed(2);
  const displayName = `${firstName} ${lastName}`.trim();
  await donationRef.set({
    provider: "paypal",
    paymentStatus: "pending",
    paymentReference: donationRef.id,
    amount: roundedAmount,
    currency: donationCurrency,
    donorName: displayName,
    donorEmail: email || null,
    givingFrequency: "One time",
    createdAt: FieldValue.serverTimestamp(),
  });

  try {
    const order = await createPayPalOrder({
      clientId: paypalClientId.value(),
      clientSecret: paypalClientSecret.value(),
      amount: donationAmount,
      currency: donationCurrency,
      reference: donationRef.id,
      description: "Donation to Wahome Foundation",
    }, paypalMode.value());
    await donationRef.update({paypalOrderId: order.id, paymentStartedAt: FieldValue.serverTimestamp()});
    return {donationId: donationRef.id, orderId: order.id};
  } catch (error) {
    await donationRef.update({paymentStatus: "failed", paymentError: "checkout_creation_failed"});
    console.error("PayPal donation order creation failed", error instanceof Error ? error.message : "unknown error");
    throw new HttpsError("unavailable", "PayPal checkout could not start right now. Please try again.");
  }
});

export const startDonationPesapalOrder = onRequest({
  secrets: [pesapalConsumerKey, pesapalConsumerSecret],
  timeoutSeconds: 45,
}, withCors(async (request) => {
  if (typeof request.body !== "object" || request.body === null || Array.isArray(request.body)) {
    throw new HttpsError("invalid-argument", "The donation details are invalid.");
  }
  const data = request.body as Record<string, unknown>;
  const firstName = requiredText(data, "firstName", 80);
  const lastName = typeof data.lastName === "string" ? data.lastName.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  const email = validateEmail(data.email);
  const amount = data.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 1 || amount > 10000) {
    throw new HttpsError("invalid-argument", "Enter a donation amount between $1 and $10,000.");
  }
  if (!pesapalIpnId.value() || !pesapalCallbackUrl.value()) {
    throw new HttpsError("failed-precondition", "Pesapal checkout is not configured yet.");
  }
  const roundedAmount = Math.round(amount * 100) / 100;
  const donationRef = db.collection("donations").doc();
  const merchantReference = `WFD-${donationRef.id}-${randomBytes(4).toString("hex").toUpperCase()}`;
  const displayName = `${firstName} ${lastName}`.trim();
  await donationRef.set({
    provider: "pesapal",
    paymentProvider: "pesapal",
    paymentStatus: "pending",
    paymentReference: merchantReference,
    pesapalMerchantReference: merchantReference,
    amount: roundedAmount,
    currency: donationCurrency,
    donorName: displayName,
    donorEmail: email,
    givingFrequency: "One time",
    createdAt: FieldValue.serverTimestamp(),
  });

  try {
    const order = await createPesapalOrder({
      consumerKey: pesapalConsumerKey.value(),
      consumerSecret: pesapalConsumerSecret.value(),
      mode: pesapalMode.value(),
      merchantReference,
      amount: roundedAmount,
      currency: donationCurrency,
      description: "Donation to Wahome Foundation",
      callbackUrl: pesapalCallbackUrl.value(),
      ipnId: pesapalIpnId.value(),
      billingAddress: {email_address: email, country_code: "KE", first_name: firstName, last_name: lastName},
    });
    await donationRef.update({
      pesapalOrderTrackingId: order.order_tracking_id,
      paymentStartedAt: FieldValue.serverTimestamp(),
    });
    return {donationId: donationRef.id, merchantReference, redirectUrl: order.redirect_url};
  } catch (error) {
    await donationRef.update({paymentStatus: "failed", paymentError: "checkout_creation_failed"});
    console.error("Pesapal donation order creation failed", error instanceof Error ? error.message : "unknown error");
    if (error instanceof Error && /specified IPN ID is invalid/i.test(error.message)) {
      throw new HttpsError("failed-precondition", "The Pesapal sandbox IPN ID is invalid. Register the IPN URL in the sandbox merchant account and update PESAPAL_IPN_ID.");
    }
    if (error instanceof Error && /specified callback url is invalid/i.test(error.message)) {
      throw new HttpsError("failed-precondition", "Pesapal rejected PESAPAL_CALLBACK_URL. Set it to a valid public HTTPS return page and restart the Functions emulator.");
    }
    throw new HttpsError("unavailable", "Pesapal checkout could not start right now. Please try again.");
  }
}));

export const captureDonationPayPalOrder = onCall({
  secrets: [paypalClientId, paypalClientSecret],
  timeoutSeconds: 30,
}, async (request) => {
  const data = request.data as Record<string, unknown> | null;
  const donationId = typeof data?.donationId === "string" ? data.donationId.trim() : "";
  const orderId = typeof data?.orderId === "string" ? data.orderId.trim() : "";
  if (!donationId || !orderId) throw new HttpsError("invalid-argument", "The PayPal donation reference is invalid.");
  const donationRef = db.collection("donations").doc(donationId);
  const snapshot = await donationRef.get();
  const donation = snapshot.data();
  if (!snapshot.exists || donation?.provider !== "paypal") throw new HttpsError("not-found", "We could not find this donation.");
  if (donation.paymentStatus === "verified") return {paymentStatus: "verified" as const, receipt: donation.paymentReceipt || orderId};
  if (donation.paypalOrderId !== orderId || donation.currency !== donationCurrency || typeof donation.amount !== "number") {
    throw new HttpsError("failed-precondition", "The PayPal order does not match this donation.");
  }

  let capturedOrder: PayPalOrderResult | null = null;
  try {
    capturedOrder = await capturePayPalOrder({
      clientId: paypalClientId.value(),
      clientSecret: paypalClientSecret.value(),
      amount: donation.amount.toFixed(2),
      currency: donationCurrency,
      reference: donationId,
      description: "Donation to Wahome Foundation",
    }, orderId, paypalMode.value());
  } catch (error) {
    console.error("PayPal donation capture failed", error instanceof Error ? error.message : "unknown error");
    const missingOrder = error instanceof Error &&
      /specified resource does not exist|resource not found/i.test(error.message);
    throw new HttpsError(
      missingOrder ? "not-found" : "unavailable",
      missingOrder ?
        "PayPal could not find this checkout order. If the payment completed, use the receipt's Merchant Transaction ID with Verify capture." :
        "PayPal could not confirm this donation right now. Please try again.",
    );
  }
  if (!capturedOrder) throw new HttpsError("failed-precondition", "PayPal could not verify the completed donation amount.");
  const capture = capturedOrder.purchase_units?.[0]?.payments?.captures?.[0];
  await donationRef.update({
    paymentStatus: "verified",
    paymentReceipt: capture?.id || orderId,
    paidAt: FieldValue.serverTimestamp(),
  });
  return {paymentStatus: "verified" as const, receipt: capture?.id || orderId};
});

// Retained for compatibility with any admin sessions still running the
// previous recovery interface. New payments are verified by the webhook.
export const reconcileDonationPayPalCapture = onCall({
  secrets: [paypalClientId, paypalClientSecret],
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in with an administrator account.");
  }
  const adminDoc = await db.doc(`admins/${request.auth.uid}`).get();
  const role = adminDoc.data()?.role;
  if (!adminDoc.exists || (role !== "superadmin" && role !== "staff")) {
    throw new HttpsError("permission-denied", "Only an administrator can verify a PayPal capture.");
  }
  const data = request.data as Record<string, unknown> | null;
  const donationId = typeof data?.donationId === "string" ? data.donationId.trim() : "";
  const captureId = typeof data?.captureId === "string" ? data.captureId.trim() : "";
  if (!donationId || (captureId && !/^[A-Z0-9]{10,24}$/i.test(captureId))) {
    throw new HttpsError("invalid-argument", "The PayPal donation or capture reference is invalid.");
  }
  const donationRef = db.collection("donations").doc(donationId);
  const snapshot = await donationRef.get();
  const donation = snapshot.data();
  if (!snapshot.exists || !donation) {
    throw new HttpsError("not-found", "We could not find this PayPal donation.");
  }
  const provider = typeof donation.provider === "string" ? donation.provider.toLowerCase() : "";
  const hasPayPalOrder = typeof donation.paypalOrderId === "string" && donation.paypalOrderId.length > 0;
  if (provider !== "paypal" && !hasPayPalOrder) {
    throw new HttpsError("not-found", "We could not find this PayPal donation.");
  }
  if (donation.paymentStatus === "verified") {
    return {paymentStatus: "verified" as const, receipt: donation.paymentReceipt || captureId};
  }
  if (typeof donation.amount !== "number" || donation.currency !== donationCurrency) {
    throw new HttpsError("failed-precondition", "The donation amount or currency does not match.");
  }
  let resolvedCaptureId = captureId;
  if (!resolvedCaptureId) {
    if (!hasPayPalOrder) {
      throw new HttpsError("failed-precondition", "This donation has no saved PayPal order to search automatically.");
    }
    try {
      resolvedCaptureId = await findPayPalCaptureIdByOrderId({
        clientId: paypalClientId.value(),
        clientSecret: paypalClientSecret.value(),
        amount: donation.amount.toFixed(2),
        currency: donationCurrency,
        reference: donationId,
        description: "Donation to Wahome Foundation",
      }, donation.paypalOrderId as string, paypalMode.value());
    } catch (error) {
      console.error("PayPal donation transaction search failed", error instanceof Error ? error.message : "unknown error");
      throw new HttpsError("unavailable", error instanceof Error ? error.message : "PayPal could not find this donation automatically. Try again later.");
    }
  }
  let capture;
  try {
    capture = await getPayPalCapture({
      clientId: paypalClientId.value(),
      clientSecret: paypalClientSecret.value(),
      amount: donation.amount.toFixed(2),
      currency: donationCurrency,
      reference: donationId,
      description: "Donation to Wahome Foundation",
    }, resolvedCaptureId, paypalMode.value());
  } catch (error) {
    console.error("PayPal donation capture lookup failed", error instanceof Error ? error.message : "unknown error");
    const missing = error instanceof Error && /does not exist|not found/i.test(error.message);
    throw new HttpsError(
      missing ? "not-found" : "unavailable",
      missing ?
        "PayPal could not find that capture ID in this live account. Check the Merchant Transaction ID on the receipt." :
        "PayPal could not look up this capture. Please try again.",
    );
  }
  const matchesDonation = capture.custom_id === donationId ||
    (typeof donation.paypalOrderId === "string" &&
      capture.supplementary_data?.related_ids?.order_id === donation.paypalOrderId);
  if (capture.status !== "COMPLETED" || capture.amount?.value !== donation.amount.toFixed(2) ||
    capture.amount?.currency_code !== donationCurrency || !matchesDonation) {
    throw new HttpsError("failed-precondition", "This capture does not match the pending donation.");
  }
  await donationRef.update({
    provider: "paypal",
    paymentStatus: "verified",
    paymentReceipt: capture.id,
    paidAt: FieldValue.serverTimestamp(),
  });
  return {paymentStatus: "verified" as const, receipt: capture.id};
});

export const reconcileRacePayPalCapture = onCall({
  secrets: [paypalClientId, paypalClientSecret],
  timeoutSeconds: 30,
}, async (request) => {
  await requirePaymentAdmin(request.auth?.uid);
  const data = request.data as Record<string, unknown> | null;
  const registrationId = typeof data?.registrationId === "string" ? data.registrationId.trim() : "";
  const captureId = typeof data?.captureId === "string" ? data.captureId.trim() : "";
  if (!registrationId || (captureId && !/^[A-Z0-9]{10,24}$/i.test(captureId))) {
    throw new HttpsError("invalid-argument", "The PayPal registration or capture reference is invalid.");
  }
  const registrationRef = db.collection("eventRegistrations").doc(registrationId);
  const snapshot = await registrationRef.get();
  const registration = snapshot.data();
  if (!snapshot.exists || registration?.eventSlug !== eventSlug) {
    throw new HttpsError("not-found", "We could not find this PayPal race registration.");
  }
  if (registration.paymentStatus === "verified") {
    return {paymentStatus: "verified" as const, paymentReceipt: registration.paymentReceipt || captureId};
  }
  const expectedRegistrationFee = registration.feeUsd === Number(registrationFeeUsd) ||
    registration.feeKes === registrationFeeKes;
  if (!expectedRegistrationFee) {
    throw new HttpsError("failed-precondition", "The PayPal capture amount does not match this registration.");
  }
  let resolvedCaptureId = captureId;
  if (!resolvedCaptureId) {
    if (typeof registration.paypalOrderId !== "string" || !registration.paypalOrderId) {
      throw new HttpsError("failed-precondition", "This registration has no saved PayPal order to search automatically.");
    }
    try {
      resolvedCaptureId = await findPayPalCaptureIdByOrderId({
        clientId: paypalClientId.value(),
        clientSecret: paypalClientSecret.value(),
        amount: registrationFeeUsd,
        currency: donationCurrency,
        reference: registrationId,
        description: "Miles for Minds Run 2027 registration",
      }, registration.paypalOrderId, paypalMode.value());
    } catch (error) {
      console.error("PayPal race transaction search failed", error instanceof Error ? error.message : "unknown error");
      throw new HttpsError("unavailable", error instanceof Error ? error.message : "PayPal could not find this registration automatically. Try again later.");
    }
  }
  let capture;
  try {
    capture = await getPayPalCapture({
      clientId: paypalClientId.value(),
      clientSecret: paypalClientSecret.value(),
      amount: registrationFeeUsd,
      currency: donationCurrency,
      reference: registrationId,
      description: "Miles for Minds Run 2027 registration",
    }, resolvedCaptureId, paypalMode.value());
  } catch (error) {
    console.error("PayPal race capture lookup failed", error instanceof Error ? error.message : "unknown error");
    const missing = error instanceof Error && /does not exist|not found/i.test(error.message);
    throw new HttpsError(
      missing ? "not-found" : "unavailable",
      missing ?
        "PayPal could not find that capture ID in this live account. Check the Merchant Transaction ID on the receipt." :
        "PayPal could not look up this capture. Please try again.",
    );
  }
  const matchesRegistration = capture.custom_id === registrationId ||
    (typeof registration.paypalOrderId === "string" &&
      capture.supplementary_data?.related_ids?.order_id === registration.paypalOrderId);
  if (capture.status !== "COMPLETED" || capture.amount?.value !== registrationFeeUsd ||
    capture.amount?.currency_code !== donationCurrency || !matchesRegistration) {
    throw new HttpsError("failed-precondition", "This completed capture does not match the selected race registration.");
  }
  await registrationRef.update({
    paymentMethod: "paypal",
    paymentProvider: "paypal",
    feeKes: registrationFeeKes,
    feeUsd: Number(registrationFeeUsd),
    paymentStatus: "verified",
    paymentReceipt: capture.id,
    paidAt: FieldValue.serverTimestamp(),
  });
  return {paymentStatus: "verified" as const, paymentReceipt: capture.id};
});

/** Registers the signed PayPal webhook once for the current REST app.
 * @param {string | undefined} uid Firebase Auth UID.
 * @return {Promise<void>} Resolves for an authorized administrator.
 */
async function requirePaymentAdmin(uid: string | undefined): Promise<void> {
  if (!uid) throw new HttpsError("unauthenticated", "Sign in with an administrator account.");
  const adminDoc = await db.doc(`admins/${uid}`).get();
  const role = adminDoc.data()?.role;
  if (!adminDoc.exists || (role !== "superadmin" && role !== "staff")) {
    throw new HttpsError("permission-denied", "Only an administrator can configure PayPal verification.");
  }
}

export const ensurePayPalWebhook = onCall({
  secrets: [paypalClientId, paypalClientSecret],
  timeoutSeconds: 30,
}, async (request) => {
  await requirePaymentAdmin(request.auth?.uid);
  const webhookUrl = `https://africa-south1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/paypalWebhook`;
  const webhookRef = db.doc("system/paypalWebhook");
  const existing = await webhookRef.get();
  if (existing.data()?.url === webhookUrl && typeof existing.data()?.webhookId === "string") {
    return {configured: true};
  }
  try {
    const webhookId = await ensurePayPalCaptureWebhook({
      clientId: paypalClientId.value(),
      clientSecret: paypalClientSecret.value(),
      amount: "0.00",
      currency: donationCurrency,
      reference: "",
      description: "PayPal payment webhook setup",
    }, webhookUrl, paypalMode.value());
    await webhookRef.set({webhookId, url: webhookUrl, updatedAt: FieldValue.serverTimestamp()});
    return {configured: true};
  } catch (error) {
    console.error("PayPal webhook setup failed", error instanceof Error ? error.message : "unknown error");
    throw new HttpsError("unavailable", "Automatic PayPal verification could not be configured. Check the PayPal app webhook permissions.");
  }
});

/** Receives and verifies PayPal capture-completed notifications.
 * @param {import("firebase-functions/v2/https").Request} request Incoming request.
 * @param {import("express").Response} response HTTP response.
 * @return {Promise<void>} Resolves after responding to PayPal.
 */
export const paypalWebhook = onRequest({
  secrets: [paypalClientId, paypalClientSecret],
  timeoutSeconds: 30,
}, async (request, response) => {
  const event = request.body as PayPalWebhookEvent | null;
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    response.status(400).send("Invalid webhook event");
    return;
  }
  const config = await db.doc("system/paypalWebhook").get();
  const webhookId = config.data()?.webhookId;
  if (typeof webhookId !== "string" || !webhookId) {
    response.status(503).send("Webhook is not configured");
    return;
  }
  const paypalHeaders: Record<string, string> = {
    "paypal-auth-algo": String(request.header("paypal-auth-algo") || ""),
    "paypal-cert-url": String(request.header("paypal-cert-url") || ""),
    "paypal-transmission-id": String(request.header("paypal-transmission-id") || ""),
    "paypal-transmission-sig": String(request.header("paypal-transmission-sig") || ""),
    "paypal-transmission-time": String(request.header("paypal-transmission-time") || ""),
  };
  if (Object.values(paypalHeaders).some((value) => !value)) {
    response.status(400).send("Missing PayPal signature headers");
    return;
  }

  try {
    const signatureValid = await verifyPayPalWebhook({
      clientId: paypalClientId.value(),
      clientSecret: paypalClientSecret.value(),
      amount: "0.00",
      currency: donationCurrency,
      reference: "",
      description: "PayPal webhook verification",
    }, webhookId, paypalHeaders, event, paypalMode.value());
    if (!signatureValid) {
      response.status(400).send("Invalid PayPal signature");
      return;
    }
    if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
      response.status(200).send("Event ignored");
      return;
    }
    const capture = event.resource;
    const captureId = capture?.id;
    const amount = capture?.amount?.value;
    const currency = capture?.amount?.currency_code;
    const orderId = capture?.supplementary_data?.related_ids?.order_id;
    const referenceId = capture?.custom_id;
    if (!captureId || capture?.status !== "COMPLETED" || !amount || currency !== donationCurrency) {
      response.status(200).send("Capture does not match a supported payment");
      return;
    }

    let docRef = referenceId ? db.collection("donations").doc(referenceId) : null;
    let docData = docRef ? (await docRef.get()).data() : undefined;
    let isDonation = docData?.provider === "paypal";
    if (!docData && orderId) {
      const donationMatches = await db.collection("donations").where("paypalOrderId", "==", orderId).limit(2).get();
      if (donationMatches.size === 1) {
        docRef = donationMatches.docs[0].ref;
        docData = donationMatches.docs[0].data();
        isDonation = docData.provider === "paypal";
      }
    }
    if (docRef && isDonation && typeof docData?.amount === "number" && docData.amount.toFixed(2) === amount) {
      await db.runTransaction(async (transaction) => {
        const current = await transaction.get(docRef!);
        if (current.exists && current.data()?.provider === "paypal" && current.data()?.paymentStatus !== "verified") {
          transaction.update(docRef!, {paymentStatus: "verified", paymentReceipt: captureId, paidAt: FieldValue.serverTimestamp()});
        }
      });
      response.status(200).send("Donation updated");
      return;
    }

    docRef = referenceId ? db.collection("eventRegistrations").doc(referenceId) : null;
    docData = docRef ? (await docRef.get()).data() : undefined;
    if (!docData && orderId) {
      const registrationMatches = await db.collection("eventRegistrations").where("paypalOrderId", "==", orderId).limit(2).get();
      if (registrationMatches.size === 1) {
        docRef = registrationMatches.docs[0].ref;
        docData = registrationMatches.docs[0].data();
      }
    }
    const registrationHasExpectedFee = docData?.feeUsd === Number(registrationFeeUsd) ||
      docData?.feeKes === registrationFeeKes;
    if (docRef && docData?.eventSlug === eventSlug && registrationHasExpectedFee &&
      amount === registrationFeeUsd) {
      await db.runTransaction(async (transaction) => {
        const current = await transaction.get(docRef!);
        if (current.exists && current.data()?.paymentStatus !== "verified") {
          transaction.update(docRef!, {
            paymentMethod: "paypal",
            paymentProvider: "paypal",
            feeUsd: Number(registrationFeeUsd),
            paymentStatus: "verified",
            paymentReceipt: captureId,
            paidAt: FieldValue.serverTimestamp(),
          });
        }
      });
      response.status(200).send("Registration updated");
      return;
    }
    response.status(200).send("No matching payment record");
  } catch (error) {
    console.error("PayPal webhook processing failed", error instanceof Error ? error.message : "unknown error");
    response.status(500).send("Webhook processing failed");
  }
});

export const startRacePayPalOrder = onCall({
  secrets: [paypalClientId, paypalClientSecret],
  timeoutSeconds: 30,
}, async (request) => {
  const data = request.data as Record<string, unknown> | null;
  const registrationId = typeof data?.registrationId === "string" ? data.registrationId.trim() : "";
  if (!registrationId) throw new HttpsError("invalid-argument", "The registration reference is invalid.");
  const registrationRef = db.collection("eventRegistrations").doc(registrationId);
  const snapshot = await registrationRef.get();
  const registration = snapshot.data();
  if (!snapshot.exists || registration?.eventSlug !== eventSlug) throw new HttpsError("not-found", "We could not find this race registration.");
  if (registration.paymentStatus === "verified") throw new HttpsError("failed-precondition", "This registration has already been paid.");
  if (registration.paymentProvider === "paypal" && typeof registration.paypalOrderId === "string" && registration.feeUsd === Number(registrationFeeUsd)) {
    return {orderId: registration.paypalOrderId, amountUsd: Number(registrationFeeUsd), paymentStatus: "pending" as const};
  }
  throw new HttpsError("failed-precondition", "Online checkout is no longer available for race registrations. An administrator will confirm your payment.");
});

export const captureRacePayPalOrder = onCall({
  secrets: [paypalClientId, paypalClientSecret],
  timeoutSeconds: 30,
}, async (request) => {
  const data = request.data as Record<string, unknown> | null;
  const registrationId = typeof data?.registrationId === "string" ? data.registrationId.trim() : "";
  const orderId = typeof data?.orderId === "string" ? data.orderId.trim() : "";
  if (!registrationId || !orderId) throw new HttpsError("invalid-argument", "The PayPal registration reference is invalid.");
  const registrationRef = db.collection("eventRegistrations").doc(registrationId);
  const snapshot = await registrationRef.get();
  const registration = snapshot.data();
  if (!snapshot.exists || registration?.eventSlug !== eventSlug) throw new HttpsError("not-found", "We could not find this race registration.");
  if (registration.paymentStatus === "verified") return {paymentStatus: "verified" as const, paymentReceipt: registration.paymentReceipt || orderId};
  if (registration.paymentProvider !== "paypal" || registration.paypalOrderId !== orderId || registration.feeUsd !== Number(registrationFeeUsd)) {
    throw new HttpsError("failed-precondition", "The PayPal order does not match this race registration.");
  }

  let capturedOrder: PayPalOrderResult | null = null;
  try {
    capturedOrder = await capturePayPalOrder({
      clientId: paypalClientId.value(),
      clientSecret: paypalClientSecret.value(),
      amount: registrationFeeUsd,
      currency: "USD",
      reference: registrationId,
      description: "Miles for Minds Run 2027 registration",
    }, orderId, paypalMode.value(), (diagnostics) => {
      console.error("PayPal race capture verification mismatch", {
        environment: paypalMode.value() === "live" ? "live" : "sandbox",
        ...diagnostics,
      });
    });
  } catch (error) {
    console.error("PayPal race capture failed", error instanceof Error ? error.message : "unknown error");
    throw new HttpsError("unavailable", "PayPal could not confirm this registration payment right now. Please try again.");
  }
  if (!capturedOrder) throw new HttpsError("failed-precondition", "PayPal could not verify the completed registration amount.");
  const capture = capturedOrder.purchase_units?.[0]?.payments?.captures?.[0];
  await registrationRef.update({
    paymentStatus: "verified",
    paymentReceipt: capture?.id || orderId,
    paidAt: FieldValue.serverTimestamp(),
  });
  return {paymentStatus: "verified" as const, paymentReceipt: capture?.id || orderId};
});

export const getRacePaymentStatus = onCall(async (request) => {
  const data = request.data as Record<string, unknown> | null;
  const registrationId = typeof data?.registrationId === "string" ? data.registrationId.trim() : "";
  if (!registrationId) throw new HttpsError("invalid-argument", "The registration reference is invalid.");
  const registration = await db.collection("eventRegistrations").doc(registrationId).get();
  const details = registration.data();
  if (!registration.exists || details?.eventSlug !== eventSlug) {
    throw new HttpsError("not-found", "We could not find this race registration.");
  }
  return {
    paymentStatus: details.paymentStatus || "pending",
    paymentReceipt: details.paymentReceipt || null,
  };
});

async function processPesapalIpn(trackingId: string, merchantReference: string): Promise<void> {
  const [donations, registrations] = await Promise.all([
    db.collection("donations").where("pesapalMerchantReference", "==", merchantReference).limit(1).get(),
    db.collection("eventRegistrations").where("pesapalMerchantReference", "==", merchantReference).limit(1).get(),
  ]);
  const matches = [
    ...donations.docs.map((document) => ({ref: document.ref, data: document.data()})),
    ...registrations.docs.map((document) => ({ref: document.ref, data: document.data()})),
  ];
  if (matches.length !== 1) throw new Error("Pesapal merchant reference did not match one pending payment.");
  const payment = matches[0];
  if (payment.data.pesapalOrderTrackingId !== trackingId) {
    throw new Error("Pesapal tracking ID did not match the saved order.");
  }

  const result = await getPesapalTransactionStatus(
    pesapalConsumerKey.value(), pesapalConsumerSecret.value(), pesapalMode.value(), trackingId,
  );
  if (result.order_tracking_id !== trackingId || result.merchant_reference !== merchantReference) {
    throw new Error("Pesapal status response did not match the notified order.");
  }

  const expectedCurrency = typeof payment.data.currency === "string" ? payment.data.currency : "KES";
  const expectedAmount = typeof payment.data.amount === "number" ? payment.data.amount :
    typeof payment.data.feeKes === "number" ? payment.data.feeKes : null;
  if (expectedAmount === null || result.currency !== expectedCurrency ||
      typeof result.amount !== "number" || Math.round(result.amount * 100) !== Math.round(expectedAmount * 100)) {
    throw new Error("Pesapal status amount or currency did not match the saved payment.");
  }

  if (result.status_code === 1) {
    await payment.ref.update({
      paymentStatus: "verified",
      paymentReceipt: result.confirmation_code || trackingId,
      paymentMethod: result.payment_method || "pesapal",
      paidAt: FieldValue.serverTimestamp(),
      paymentError: FieldValue.delete(),
    });
  } else if (result.status_code === 2 || result.status_code === 3) {
    await payment.ref.update({
      paymentStatus: "failed",
      paymentError: result.status_code === 3 ? "transaction_reversed" : "transaction_failed",
      paymentStatusDescription: result.payment_status_description || null,
      paymentFailedAt: FieldValue.serverTimestamp(),
    });
  }
  // Other statuses remain pending; Pesapal will send another IPN on a later change.
}

/** Receives Pesapal IPN notifications and verifies status directly with Pesapal.
 * @param {import("firebase-functions/v2/https").Request} request Incoming request.
 * @param {import("express").Response} response HTTP response.
 * @return {Promise<void>} Resolves after acknowledging the notification.
 */
export const pesapalIpn = onRequest({
  secrets: [pesapalConsumerKey, pesapalConsumerSecret],
  timeoutSeconds: 45,
}, async (request, response) => {
  if (request.method !== "GET" && request.method !== "POST") {
    response.status(405).json({status: 500, message: "Method not allowed"});
    return;
  }
  const body = typeof request.body === "object" && request.body !== null ? request.body as Record<string, unknown> : {};
  const trackingIdValue = request.query.OrderTrackingId ?? body.OrderTrackingId;
  const merchantReferenceValue = request.query.OrderMerchantReference ?? body.OrderMerchantReference;
  const trackingId = typeof trackingIdValue === "string" ? trackingIdValue.trim() : "";
  const merchantReference = typeof merchantReferenceValue === "string" ? merchantReferenceValue.trim() : "";
  if (!trackingId || !merchantReference) {
    response.status(400).json({status: 500, message: "Missing Pesapal order identifiers"});
    return;
  }

  try {
    await processPesapalIpn(trackingId, merchantReference);
    response.status(200).json({
      orderNotificationType: "IPNCHANGE",
      orderTrackingId: trackingId,
      orderMerchantReference: merchantReference,
      status: 200,
    });
  } catch (error) {
    console.error("Pesapal IPN processing failed", error instanceof Error ? error.message : "unknown error");
    response.status(500).json({
      orderNotificationType: "IPNCHANGE",
      orderTrackingId: trackingId,
      orderMerchantReference: merchantReference,
      status: 500,
    });
  }
});

export const confirmRaceRegistration = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in with an administrator account to confirm race registrations.");
  const adminDoc = await db.doc(`admins/${request.auth.uid}`).get();
  const role = adminDoc.data()?.role;
  if (!adminDoc.exists || (role !== "superadmin" && role !== "staff")) {
    throw new HttpsError("permission-denied", "Only event staff can confirm race registrations.");
  }
  const data = request.data as Record<string, unknown> | null;
  const registrationId = typeof data?.registrationId === "string" ? data.registrationId.trim() : "";
  if (!registrationId) throw new HttpsError("invalid-argument", "The race registration reference is invalid.");
  const registrationRef = db.collection("eventRegistrations").doc(registrationId);
  const snapshot = await registrationRef.get();
  const registration = snapshot.data();
  if (!snapshot.exists || registration?.eventSlug !== eventSlug) throw new HttpsError("not-found", "We could not find this race registration.");
  if (registration.paymentStatus === "verified") return {paymentStatus: "verified" as const};
  if (registration.paymentProvider === "paypal" && typeof registration.paypalOrderId === "string") {
    throw new HttpsError("failed-precondition", "This registration has an existing PayPal order. Verify that payment through the PayPal reconciliation tools.");
  }
  await registrationRef.update({
    paymentStatus: "verified",
    paymentMethod: registration.registrationTier === "Beneficiary school student" ? "school_sponsored" : "admin_confirmed",
    paidAt: registration.registrationTier === "Beneficiary school student" ? null : FieldValue.serverTimestamp(),
    adminConfirmedAt: FieldValue.serverTimestamp(),
    adminConfirmedBy: request.auth.uid,
  });
  return {paymentStatus: "verified" as const};
});

export const listEventRegistrations = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in with an administrator account to view registrations.");
  }

  const uid = request.auth.uid;
  const adminDoc = await db.doc(`admins/${uid}`).get();
  const role = adminDoc.data()?.role;

  // Require an admin record with an explicitly supported role.
  if (!adminDoc.exists || (role !== "superadmin" && role !== "staff")) {
    throw new HttpsError("permission-denied", "Check that this signed-in account has a staff or superadmin record.");
  }

  // Only show registrations for the current event.
  const snapshot = await db.collection("eventRegistrations")
    .where("eventSlug", "==", eventSlug)
    .get();

  const registrations = snapshot.docs.map((document) => {
    const data = document.data();
    const submittedAt = data.submittedAt || data.createdAt;
    const createdAt = submittedAt && typeof submittedAt.toDate === "function" ?
      submittedAt.toDate().toISOString() :
      new Date().toISOString();

    const storedCategory = data.raceCategory ?? data.category;
    const category = storedCategory === "21k" || storedCategory === "21K" || storedCategory === "21KM Half Marathon" ? "21KM Half Marathon" :
      storedCategory === "10k" || storedCategory === "10K" || storedCategory === "10KM Run" ? "10KM Run" :
        storedCategory === "5k" || storedCategory === "5k_run_walk" || storedCategory === "5KM Run/Walk" ? "5KM Run/Walk" :
          "Children's Fun Run";

    return {
      id: document.id,
      fullName: data.participantName || data.fullName || "Anonymous Participant",
      age: data.participantAge || data.age || 0,
      gender: data.gender === "male" || data.gender === "female" ? data.gender : "",
      category,
      registrationTier: typeof data.registrationTier === "string" ? data.registrationTier : "Legacy registration",
      feeKes: typeof data.feeKes === "number" ? data.feeKes : registrationFeeKes,
      beneficiarySchoolName: typeof data.beneficiarySchoolName === "string" ? data.beneficiarySchoolName : "",
      schoolRepresentativeName: typeof data.schoolRepresentativeName === "string" ? data.schoolRepresentativeName : "",
      schoolRepresentativeEmail: typeof data.schoolRepresentativeEmail === "string" ? data.schoolRepresentativeEmail : "",
      schoolRepresentativePhone: typeof data.schoolRepresentativePhone === "string" ? data.schoolRepresentativePhone : "",
      email: data.contactEmail || data.email || "",
      phone: data.contactPhone || data.phone || "",
      paymentStatus: data.paymentStatus || "pending",
      paymentMethod: data.paymentMethod || data.paymentProvider || "",
      paypalOrderId: typeof data.paypalOrderId === "string" ? data.paypalOrderId : "",
      paymentReceipt: data.paymentReceipt || "",
      createdAt,
    };
  });

  return {registrations};
});

export const listGeneralDonations = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in with an administrator account to view donations.");
  }

  const adminDoc = await db.doc(`admins/${request.auth.uid}`).get();
  const role = adminDoc.data()?.role;
  if (!adminDoc.exists || (role !== "superadmin" && role !== "staff")) {
    throw new HttpsError("permission-denied", "Check that this signed-in account has a staff or superadmin record.");
  }

  const snapshot = await db.collection("donations")
    .orderBy("createdAt", "desc")
    .limit(500)
    .get();

  const donations = snapshot.docs.map((document) => {
    const data = document.data();
    const createdAt = data.createdAt && typeof data.createdAt.toDate === "function" ?
      data.createdAt.toDate().toISOString() : "";
    const paymentStatus = data.paymentStatus === "verified" || data.paymentStatus === "failed" ?
      data.paymentStatus : "pending";

    return {
      id: document.id,
      donorName: typeof data.donorName === "string" && data.donorName.trim() ? data.donorName : "Anonymous donor",
      donorEmail: typeof data.donorEmail === "string" ? data.donorEmail : "",
      amount: typeof data.amount === "number" ? data.amount : 0,
      currency: typeof data.currency === "string" ? data.currency : donationCurrency,
      paymentStatus,
      paymentProvider: typeof data.provider === "string" && data.provider.toLowerCase() === "paypal" ?
        "paypal" : typeof data.provider === "string" ? data.provider : "",
      paypalOrderId: typeof data.paypalOrderId === "string" ? data.paypalOrderId : "",
      paymentReceipt: typeof data.paymentReceipt === "string" ? data.paymentReceipt : "",
      paymentReference: typeof data.paymentReference === "string" ? data.paymentReference : document.id,
      createdAt,
    };
  });

  return {donations};
});

const defaultEventSponsors = [
  {
    id: "SP-01",
    companyName: "Autism Allies Kenya",
    contactPerson: "Dr. Sarah Kimani",
    email: "sarah@autismallies.co.ke",
    amount: 100000,
    status: "Confirmed",
    logoSubmitted: true,
  },
  {
    id: "SP-02",
    companyName: "Coffee Bench Nanyuki",
    contactPerson: "Peter Njuguna",
    email: "info@coffeebench.co.ke",
    amount: 50000,
    status: "Confirmed",
    logoSubmitted: true,
  },
  {
    id: "SP-03",
    companyName: "Laikipia Heights Resort",
    contactPerson: "Grace Wamae",
    email: "management@laikipiaheights.com",
    amount: 25000,
    status: "Pledged",
    logoSubmitted: false,
  },
];

/** Checks whether the caller may manage event sponsor records.
 * @param {string | undefined} uid Firebase Auth UID for the caller.
 * @return {Promise<void>} Resolves only for an authorized staff member.
 */
async function requireEventSponsorAdmin(uid: string | undefined) {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in with an administrator account to manage sponsors.");
  }
  const adminDoc = await db.doc(`admins/${uid}`).get();
  const role = adminDoc.data()?.role;
  if (!adminDoc.exists || (role !== "superadmin" && role !== "staff")) {
    throw new HttpsError("permission-denied", "Check that this signed-in account has a staff or superadmin record.");
  }
}

export const listEventSponsors = onCall(async (request) => {
  await requireEventSponsorAdmin(request.auth?.uid);
  const sponsorsRef = db.collection("eventSponsors");
  const sponsorSetupRef = db.doc("dashboardSettings/eventSponsors");
  await db.runTransaction(async (transaction) => {
    const setup = await transaction.get(sponsorSetupRef);
    if (setup.exists) return;
    const currentSponsors = await transaction.get(sponsorsRef.limit(1));
    transaction.set(sponsorSetupRef, {initializedAt: FieldValue.serverTimestamp()});
    // Migrate the dashboard's existing starter entries only once.
    if (currentSponsors.empty) {
      for (const sponsor of defaultEventSponsors) {
        transaction.set(sponsorsRef.doc(sponsor.id), {
          ...sponsor,
          eventSlug,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
  });
  const snapshot = await sponsorsRef.orderBy("createdAt", "asc").get();

  return {
    sponsors: snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        amount: data.amount,
        status: data.status,
        logoSubmitted: data.logoSubmitted === true,
      };
    }),
  };
});

export const saveEventSponsor = onCall(async (request) => {
  await requireEventSponsorAdmin(request.auth?.uid);
  if (typeof request.data !== "object" || request.data === null || Array.isArray(request.data)) {
    throw new HttpsError("invalid-argument", "Enter valid sponsor details.");
  }
  const data = request.data as Record<string, unknown>;
  const text = (key: string, maxLength: number) => {
    const value = data[key];
    if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
      throw new HttpsError("invalid-argument", `Enter a valid ${key} (up to ${maxLength} characters).`);
    }
    return value.trim().replace(/\s+/g, " ");
  };
  const companyName = text("companyName", 150);
  const contactPerson = text("contactPerson", 150);
  const email = text("email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "Enter a valid sponsor email address.");
  }
  const amount = data.amount;
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 0) {
    throw new HttpsError("invalid-argument", "Enter a valid sponsor amount in KSh.");
  }
  const status = data.status;
  if (status !== "Confirmed" && status !== "Pledged") {
    throw new HttpsError("invalid-argument", "Choose Confirmed or Pledged status.");
  }
  if (typeof data.logoSubmitted !== "boolean") {
    throw new HttpsError("invalid-argument", "Choose whether the sponsor logo was submitted.");
  }
  const sponsorId = typeof data.id === "string" ? data.id.trim() : "";
  const sponsorRef = sponsorId ? db.collection("eventSponsors").doc(sponsorId) : db.collection("eventSponsors").doc();
  const existing = sponsorId ? await sponsorRef.get() : null;
  if (sponsorId && (!existing?.exists || existing.data()?.eventSlug !== eventSlug)) {
    throw new HttpsError("not-found", "We could not find this event sponsor.");
  }
  await sponsorRef.set({
    eventSlug,
    companyName,
    contactPerson,
    email,
    tier: FieldValue.delete(),
    amount,
    status,
    logoSubmitted: data.logoSubmitted,
    ...(existing?.exists ? {} : {createdAt: FieldValue.serverTimestamp()}),
    updatedAt: FieldValue.serverTimestamp(),
  }, {merge: true});
  return {id: sponsorRef.id};
});

export const deleteEventSponsor = onCall(async (request) => {
  await requireEventSponsorAdmin(request.auth?.uid);
  const sponsorId = typeof request.data?.id === "string" ? request.data.id.trim() : "";
  if (!sponsorId) throw new HttpsError("invalid-argument", "Choose a valid event sponsor.");
  const sponsorRef = db.collection("eventSponsors").doc(sponsorId);
  const sponsor = await sponsorRef.get();
  if (!sponsor.exists || sponsor.data()?.eventSlug !== eventSlug) {
    throw new HttpsError("not-found", "We could not find this event sponsor.");
  }
  await sponsorRef.delete();
  return {deleted: true as const};
});

export const submitSponsorInquiry = onCall({
  secrets: [turnstileSecret],
  timeoutSeconds: 20,
}, async (request) => {
  if (typeof request.data !== "object" || request.data === null || Array.isArray(request.data)) {
    throw new HttpsError("invalid-argument", "The sponsor inquiry details are invalid.");
  }
  const data = request.data as Record<string, unknown>;
  const contactName = requiredText(data, "contactName", 150);
  const organizationValue = data.organization;
  if (organizationValue !== undefined && typeof organizationValue !== "string") {
    throw new HttpsError("invalid-argument", "Please enter a valid organization name.");
  }
  const organization = typeof organizationValue === "string" ?
    organizationValue.trim().replace(/\s+/g, " ").slice(0, 150) || null : null;
  if (typeof organizationValue === "string" && organizationValue.trim().length > 150) {
    throw new HttpsError("invalid-argument", "Organization must be 150 characters or fewer.");
  }
  const contactEmail = validateEmail(data.contactEmail);
  const contactPhone = validatePhone(data.contactPhone);
  const supportMessage = requiredText(data, "supportMessage", 2000);
  if (supportMessage.length < 10) {
    throw new HttpsError("invalid-argument", "Please tell us a little more about how you would like to support the event.");
  }
  const token = data.turnstileToken;
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    throw new HttpsError("failed-precondition", "Complete the spam protection check before submitting.");
  }

  const secret = turnstileSecret.value() || (
    process.env.FUNCTIONS_EMULATOR === "true" ?
      "1x0000000000000000000000000000000AA" : ""
  );
  if (!secret) {
    throw new HttpsError("unavailable", "Spam protection is not configured. Please try again later.");
  }
  const originHeader = request.rawRequest.headers.origin;
  await verifyTurnstile(token, secret, "event_sponsor_inquiry", typeof originHeader === "string" ? originHeader : undefined);

  const inquiry = await db.collection("eventSponsorshipInquiries").add({
    eventSlug,
    submittedAt: FieldValue.serverTimestamp(),
    contactName,
    organization,
    contactEmail,
    contactPhone,
    supportMessage,
    status: "new",
  });

  return {inquiryId: inquiry.id};
});
