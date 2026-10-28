/* eslint-disable max-len */
import {getApps, initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {randomBytes} from "node:crypto";
import {setGlobalOptions} from "firebase-functions";
import {defineSecret, defineString} from "firebase-functions/params";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {capturePayPalOrder, createPayPalOrder, type PayPalOrderResult} from "./paypalClient.js";

const turnstileSecret = defineSecret("TURNSTILE_SECRET_KEY");
const paypalClientId = defineSecret("PAYPAL_CLIENT_ID");
const paypalClientSecret = defineSecret("PAYPAL_CLIENT_SECRET");
const paypalMode = defineString("PAYPAL_MODE", {default: "sandbox"});
const eventSlug = "miles-for-minds-2027";
const privacyNoticeVersion = "miles-for-minds-2027-v1";
const registrationClosesAt = Date.parse("2027-01-06T00:00:00+03:00");
const allowedCategories = new Set(["21k", "10k", "children_5k"]);

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
    throw new HttpsError("unavailable", "PayPal could not confirm this donation right now. Please try again.");
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

  try {
    const order = await createPayPalOrder({
      clientId: paypalClientId.value(),
      clientSecret: paypalClientSecret.value(),
      amount: registrationFeeUsd,
      currency: "USD",
      reference: registrationId,
      description: "Miles for Minds Run 2027 registration",
    }, paypalMode.value());
    await registrationRef.update({
      paymentMethod: "paypal",
      paymentProvider: "paypal",
      paymentStatus: "pending",
      feeKes: registrationFeeKes,
      feeUsd: Number(registrationFeeUsd),
      paypalOrderId: order.id,
      paymentReference: typeof registration.paymentReference === "string" ? registration.paymentReference : `WF${randomBytes(5).toString("hex").toUpperCase()}`,
      paymentStartedAt: FieldValue.serverTimestamp(),
      paymentError: FieldValue.delete(),
    });
    return {orderId: order.id, amountUsd: Number(registrationFeeUsd), paymentStatus: "pending" as const};
  } catch (error) {
    console.error("PayPal race order creation failed", error instanceof Error ? error.message : "unknown error");
    throw new HttpsError("unavailable", "PayPal checkout could not start right now. Please try again.");
  }
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
      paymentMethod: data.paymentMethod || "",
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
      paymentProvider: typeof data.provider === "string" ? data.provider : "",
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
