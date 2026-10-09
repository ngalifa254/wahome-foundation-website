/* eslint-disable max-len */
import {getApps, initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import {HttpsError, onCall} from "firebase-functions/v2/https";

const turnstileSecret = defineSecret("TURNSTILE_SECRET_KEY");
const privacyNoticeVersion = "miles-for-minds-2027-v1";
const registrationClosesAt = Date.parse("2027-01-06T00:00:00+03:00");
const allowedCategories = new Set(["21k", "10k", "children_5k"]);

setGlobalOptions({maxInstances: 10, region: "africa-south1"});

const app = getApps()[0] ?? initializeApp();
const db = getFirestore(app);

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

  const raceCategory = data.raceCategory;
  if (typeof raceCategory !== "string" || !allowedCategories.has(raceCategory)) {
    throw new HttpsError("invalid-argument", "Please choose a valid race category.");
  }
  const participantIsMinor = participantAge < 18;
  if (raceCategory === "children_5k" && !participantIsMinor) {
    throw new HttpsError("invalid-argument", "The Children’s 5K is for participants under 18.");
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
  const token = data.turnstileToken;
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    throw new HttpsError("failed-precondition", "Complete the spam protection check before submitting.");
  }
  if (Date.now() >= registrationClosesAt) {
    throw new HttpsError("failed-precondition", "Registration closed on January 5, 2027.");
  }

  const secret = turnstileSecret.value() || (
    process.env.FUNCTIONS_EMULATOR === "true" ?
      "1x0000000000000000000000000000000AA" : ""
  );
  if (!secret) {
    throw new HttpsError("unavailable", "Spam protection is not configured. Please try again later.");
  }
  const originHeader = request.rawRequest.headers.origin;
  await verifyTurnstile(token, secret, "event_registration", typeof originHeader === "string" ? originHeader : undefined);

  const registration = await db.collection("eventRegistrations").add({
    eventSlug: "miles-for-minds-2027",
    submittedAt: FieldValue.serverTimestamp(),
    participantName,
    participantAge,
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
    feeKes: 1000,
    paymentStatus: "pending",
    mpesaReceiptNumber: null,
    paidAt: null,
  });

  return {registrationId: registration.id, paymentStatus: "pending" as const};
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
    eventSlug: "miles-for-minds-2027",
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
