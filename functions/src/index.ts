/* eslint-disable max-len */
import {getApps, initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {randomBytes, timingSafeEqual} from "node:crypto";
import {setGlobalOptions} from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import {HttpsError, onCall, onRequest} from "firebase-functions/v2/https";
import {createHostedCheckout, verifyFlutterwaveTransaction, type FlutterwavePaymentMethod} from "./flutterwaveClient.js";

const turnstileSecret = defineSecret("TURNSTILE_SECRET_KEY");
const flutterwaveSecretKey = defineSecret("FLUTTERWAVE_SECRET_KEY");
const flutterwaveWebhookHash = defineSecret("FLUTTERWAVE_WEBHOOK_HASH");
const eventSlug = "miles-for-minds-2027";
const privacyNoticeVersion = "miles-for-minds-2027-v1";
const registrationClosesAt = Date.parse("2027-01-06T00:00:00+03:00");
const allowedCategories = new Set(["21k", "10k", "children_5k"]);

setGlobalOptions({maxInstances: 10, region: "africa-south1"});

const app = getApps()[0] ?? initializeApp();
const db = getFirestore(app);
const registrationFeeKes = 1000;

function normalizeKenyanPhone(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "Enter a valid Kenyan M-Pesa phone number.");
  }
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("254") ? digits :
    digits.startsWith("0") ? `254${digits.slice(1)}` : `254${digits}`;
  if (!/^254(?:7|1)\d{8}$/.test(normalized)) {
    throw new HttpsError("invalid-argument", "Enter a valid Kenyan M-Pesa phone number.");
  }
  return normalized;
}

function safeHeaderEquals(actual: string | undefined, expected: string): boolean {
  if (!actual) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

type TurnstileResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
  metadata?: {result_with_testing_key?: boolean};
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
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {"content-type": "application/x-www-form-urlencoded"},
      body: parameters,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      throw new Error("Turnstile returned an unsuccessful HTTP response.");
    }
    validation = await response.json() as TurnstileResult;
  } catch {
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
  if (raceCategory === "children_5k" && !participantIsMinor) {
    throw new HttpsError("invalid-argument", "The Children’s 1K is for participants under 18.");
  }

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
    guardianName,
    guardianRelationship,
    guardianAuthorized: guardianRequired,
    contactEmail,
    contactPhone,
    privacyNoticeAcceptedAt: FieldValue.serverTimestamp(),
    privacyNoticeVersion,
    futureEventUpdates: data.futureEventUpdates,
    feeKes: registrationFeeKes,
    paymentStatus: "pending",
    paymentReference: `WF${randomBytes(5).toString("hex").toUpperCase()}`,
    paymentMethod: null,
    paymentProvider: null,
    mpesaReceiptNumber: null,
    paidAt: null,
  });

  return {registrationId: registration.id, paymentStatus: "pending" as const};
});

export const startRacePayment = onCall({
  secrets: [flutterwaveSecretKey],
  timeoutSeconds: 30,
}, async (request) => {
  if (typeof request.data !== "object" || request.data === null || Array.isArray(request.data)) {
    throw new HttpsError("invalid-argument", "The payment request is invalid.");
  }
  const data = request.data as Record<string, unknown>;
  const registrationId = requiredText(data, "registrationId", 128);
  const method = data.paymentMethod;
  if (method !== "mpesa" && method !== "card") {
    throw new HttpsError("invalid-argument", "Choose M-Pesa or card.");
  }

  const registrationRef = db.collection("eventRegistrations").doc(registrationId);
  const registrationSnapshot = await registrationRef.get();
  const registration = registrationSnapshot.data();
  if (!registrationSnapshot.exists || registration?.eventSlug !== eventSlug) {
    throw new HttpsError("not-found", "We could not find this race registration.");
  }
  if (registration.paymentStatus === "verified") {
    throw new HttpsError("failed-precondition", "This registration has already been paid.");
  }
  if (registration.paymentStatus === "pending" && registration.paymentMethod && registration.paymentMethod !== method) {
    throw new HttpsError("failed-precondition", "A payment attempt is already pending. Complete or wait for that payment before choosing another method.");
  }

  const paymentReference = typeof registration.paymentReference === "string" ?
    registration.paymentReference : `WF${randomBytes(5).toString("hex").toUpperCase()}`;
  const feeKes = typeof registration.feeKes === "number" ? registration.feeKes : registrationFeeKes;
  const returnUrlValue = data.returnUrl;
  const origin = request.rawRequest.headers.origin;
  if (typeof returnUrlValue !== "string" || typeof origin !== "string") {
    throw new HttpsError("invalid-argument", "The checkout return address is invalid.");
  }
  let returnUrl: URL;
  try {
    returnUrl = new URL(returnUrlValue);
  } catch {
    throw new HttpsError("invalid-argument", "The checkout return address is invalid.");
  }
  if (returnUrl.origin !== origin || (returnUrl.protocol !== "https:" && returnUrl.hostname !== "localhost" && returnUrl.hostname !== "127.0.0.1")) {
    throw new HttpsError("invalid-argument", "The checkout return address is not allowed.");
  }

  if (registration.paymentStatus === "pending" && registration.paymentMethod === method && typeof registration.paymentCheckoutUrl === "string") {
    return {paymentMethod: method as FlutterwavePaymentMethod, paymentStatus: "pending" as const, paymentReference, checkoutUrl: registration.paymentCheckoutUrl};
  }
  const secretKey = flutterwaveSecretKey.value();
  if (!secretKey) throw new HttpsError("failed-precondition", "Flutterwave payments are not configured yet.");
  const paymentPhone = method === "mpesa" ?
    normalizeKenyanPhone(typeof data.paymentPhone === "string" ? data.paymentPhone : registration.contactPhone) : registration.contactPhone;
  const providerTransactionRef = `${paymentReference}-${randomBytes(3).toString("hex").toUpperCase()}`;
  let checkoutUrl: string;
  try {
    checkoutUrl = await createHostedCheckout({
      secretKey,
      txRef: providerTransactionRef,
      amountKes: feeKes,
      method,
      returnUrl: returnUrl.toString(),
      customer: {email: registration.contactEmail, name: registration.participantName, phone: paymentPhone},
      registrationId,
      eventSlug,
    });
  } catch (error) {
    console.error("Flutterwave checkout creation failed", error instanceof Error ? error.message : "unknown error");
    throw new HttpsError("unavailable", "Flutterwave checkout could not start right now. Please try again.");
  }

  await registrationRef.update({
    paymentMethod: method,
    paymentProvider: "flutterwave",
    paymentStatus: "pending",
    paymentReference,
    providerTransactionRef,
    paymentCheckoutUrl: checkoutUrl,
    paymentPhone: method === "mpesa" ? paymentPhone : FieldValue.delete(),
    paymentStartedAt: FieldValue.serverTimestamp(),
    paymentError: FieldValue.delete(),
  });
  return {
    paymentMethod: method as FlutterwavePaymentMethod,
    paymentStatus: "pending" as const,
    paymentReference,
    checkoutUrl,
  };
});
export const flutterwavePaymentWebhook = onRequest({
  secrets: [flutterwaveSecretKey, flutterwaveWebhookHash],
  timeoutSeconds: 30,
}, async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method not allowed");
    return;
  }
  if (!safeHeaderEquals(request.get("verif-hash"), flutterwaveWebhookHash.value())) {
    response.status(401).send("Unauthorized");
    return;
  }
  const payload = request.body as {data?: {id?: number; tx_ref?: string}} | undefined;
  const transactionId = payload?.data?.id;
  const transactionReference = payload?.data?.tx_ref;
  if (!transactionId || !transactionReference) {
    response.status(200).send("Ignored");
    return;
  }
  try {
    const verification = await verifyFlutterwaveTransaction({
      secretKey: flutterwaveSecretKey.value(),
      transactionId,
      expectedTxRef: transactionReference,
      expectedAmountKes: registrationFeeKes,
    });
    const verifiedPayment = verification?.data;
    if (!verifiedPayment) {
      response.status(200).send("Payment not verified");
      return;
    }
    const matches = await db.collection("eventRegistrations")
      .where("providerTransactionRef", "==", transactionReference)
      .limit(1)
      .get();
    if (!matches.empty) {
      const registrationRef = matches.docs[0].ref;
      await db.runTransaction(async (transaction) => {
        const current = await transaction.get(registrationRef);
        const data = current.data();
        if (current.exists && data?.eventSlug === eventSlug && data.paymentProvider === "flutterwave" && data.paymentStatus !== "verified" && data.feeKes === registrationFeeKes) {
          transaction.update(registrationRef, {
            paymentStatus: "verified",
            paymentReceipt: verifiedPayment.flw_ref || transactionReference,
            paidAt: FieldValue.serverTimestamp(),
          });
        }
      });
    }
    response.status(200).send("OK");
  } catch (error) {
    console.error("Flutterwave webhook verification failed", error instanceof Error ? error.message : "unknown error");
    response.status(500).send("Verification unavailable");
  }
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
    paymentReceipt: details.paymentReceipt || details.mpesaReceiptNumber || null,
  };
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

    const category = data.raceCategory === "21k" || data.category === "21K" ? "21K" :
      data.raceCategory === "10k" || data.category === "10K" ? "10K" : "Children's 1K";

    return {
      id: document.id,
      fullName: data.participantName || data.fullName || "Anonymous Participant",
      age: data.participantAge || data.age || 0,
      gender: data.gender === "male" || data.gender === "female" ? data.gender : "",
      category,
      email: data.contactEmail || data.email || "",
      phone: data.contactPhone || data.phone || "",
      paymentStatus: data.paymentStatus || "pending",
      mpesaCode: data.paymentMethod === "mpesa" ? data.paymentReceipt || "" : "",
      paymentMethod: data.paymentMethod || "",
      paymentReceipt: data.paymentReceipt || data.mpesaReceiptNumber || "",
      createdAt,
    };
  });

  return {registrations};
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
