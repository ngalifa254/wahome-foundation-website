import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

type RaceCategory = "21k" | "10k" | "children_5k";

type RegistrationInput = {
  participantName: string;
  participantAge: number;
  raceCategory: RaceCategory;
  guardianName?: string;
  guardianRelationship?: string;
  guardianAuthorized?: boolean;
  contactEmail: string;
  contactPhone: string;
  privacyNoticeAccepted: boolean;
  futureEventUpdates: boolean;
  turnstileToken: string;
};

type RegistrationResult = { registrationId: string; paymentStatus: "pending" };

const fieldClass = "run-field";

function FormField({
  id,
  name = id,
  label,
  type = "text",
  required = true,
  min,
  max,
  autoComplete,
  onChange,
}: {
  id: string;
  name?: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  autoComplete?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className={fieldClass}>
      <label htmlFor={id}>{label}{required ? " *" : ""}</label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        min={min}
        max={max}
        autoComplete={autoComplete}
        pattern={type === "tel" ? "[+0-9() .-]{7,24}" : undefined}
        title={type === "tel" ? "Enter a phone number using 7 to 15 digits and common phone punctuation." : undefined}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
    </div>
  );
}

export default function RegistrationForm() {
  const [category, setCategory] = useState<RaceCategory>("21k");
  const [age, setAge] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMinor = age !== "" && Number(age) < 18;
  const isChildrenRace = category === "children_5k";
  const needsGuardian = isMinor || isChildrenRace;
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const configured = Boolean(functions && siteKey);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!functions) {
      setStatus("Registration is temporarily unavailable. Please try again later.");
      return;
    }
    if (!siteKey) {
      setStatus("Spam protection is not configured, so this form cannot be submitted yet.");
      return;
    }
    if (isChildrenRace && Number(age) >= 18) {
      setStatus("The Children’s 5K is for participants under 18. Please choose the 10K or 21K category.");
      return;
    }

    const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
    if (!turnstileToken) {
      setStatus("Complete the spam protection check before submitting.");
      return;
    }

    const input: RegistrationInput = {
      participantName: String(formData.get("participantName") ?? ""),
      participantAge: Number(formData.get("participantAge")),
      raceCategory: category,
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
      privacyNoticeAccepted: formData.get("privacyNoticeAccepted") === "on",
      futureEventUpdates: formData.get("futureEventUpdates") === "on",
      turnstileToken,
    };
    if (needsGuardian) {
      input.guardianName = String(formData.get("guardianName") ?? "");
      input.guardianRelationship = String(formData.get("guardianRelationship") ?? "");
      input.guardianAuthorized = formData.get("guardianAuthorized") === "on";
    }

    setIsSubmitting(true);
    setStatus("Submitting your registration…");
    try {
      const register = httpsCallable<RegistrationInput, RegistrationResult>(functions, "registerEvent");
      const response = await register(input);
      form.reset();
      setCategory("21k");
      setAge("");
      setStatus(`Registration received. Your reference is ${response.data.registrationId}. Payment status: pending.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration could not be submitted. Please try again.";
      setStatus(message);
      window.turnstile?.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="run-form" onSubmit={handleSubmit}>
      <div className="run-form-heading">
        <span className="eyebrow">Participant registration</span>
        <h2>Take your place at the start</h2>
        <p>Registration fee: <strong>KSh 1,000 per participant</strong> for all categories.</p>
      </div>
      {isChildrenRace && <div className="run-notice" role="note"><strong>Children’s 5K:</strong> A parent or guardian must register a participant under 18.</div>}
      <div className="run-form-grid">
        <FormField id="participantName" label="Participant full name" autoComplete="name" />
        <FormField id="participantAge" label="Participant age in years" type="number" min={0} max={120} onChange={setAge} />
        <div className={fieldClass}>
          <label htmlFor="raceCategory">Category *</label>
          <select id="raceCategory" name="raceCategory" required value={category} onChange={(event) => { setCategory(event.target.value as RaceCategory); setStatus(""); }}>
            <option value="21k">21K</option>
            <option value="10k">10K</option>
            <option value="children_5k">Children’s 5K</option>
          </select>
        </div>
        <FormField id="contactEmail" label={needsGuardian ? "Parent or guardian email" : "Participant email"} type="email" autoComplete="email" />
        <FormField id="contactPhone" label={needsGuardian ? "Parent or guardian phone" : "Participant phone"} type="tel" autoComplete="tel" />
        {needsGuardian && <>
          <FormField id="guardianName" label="Parent or guardian full name" autoComplete="name" />
          <div className={fieldClass}>
            <label htmlFor="guardianRelationship">Relationship to participant *</label>
            <select id="guardianRelationship" name="guardianRelationship" required>
              <option value="">Choose a relationship</option>
              <option value="parent">Parent</option>
              <option value="legal_guardian">Legal guardian</option>
              <option value="other">Other authorised guardian</option>
            </select>
          </div>
        </>}
      </div>
      {needsGuardian && <label className="run-consent"><input type="checkbox" name="guardianAuthorized" required /> <span>I am the participant’s parent or authorised guardian and may register them. *</span></label>}
      <label className="run-consent"><input type="checkbox" name="privacyNoticeAccepted" required /> <span>I have read the privacy notice and agree that these details may be used to administer this event. *</span></label>
      <p className="run-privacy">We collect only the details needed to register and contact the participant or their guardian about this event. We do not collect separate emergency-contact details.</p>
      <label className="run-consent"><input type="checkbox" name="futureEventUpdates" /> <span>I would like to receive information about future Wahome Foundation events (optional).</span></label>
      {siteKey && <div className="cf-turnstile" data-sitekey={siteKey} data-action="event_registration" />}
      {!configured && <p className="run-form-status" role="status">Online registration is not configured in this environment.</p>}
      <button className="button button-green" type="submit" disabled={isSubmitting || !configured}>
        {isSubmitting ? "Submitting…" : "Submit registration"} <ArrowRight size={17} />
      </button>
      <p className="run-form-status" role="status" aria-live="polite">{status}</p>
    </form>
  );
}