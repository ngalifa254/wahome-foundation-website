import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase"; // Uses existing functions export from lib/firebase.ts

type Category = "Children's Fun Run" | "5KM Run/Walk" | "10KM Run" | "21KM Half Marathon";
type RegistrationTier = "Regular" | "VIP" | "VVIP" | "Beneficiary school student";
type Gender = "male" | "female";
type GuardianRelationship = "parent" | "legal_guardian" | "other";

interface RegisterEventPayload {
  participantName: string;
  participantAge: number;
  gender: Gender;
  raceCategory: "21k" | "10k" | "5k" | "children_fun_run";
  registrationTier: RegistrationTier;
  beneficiarySchoolName: string | null;
  schoolRepresentativeName: string | null;
  schoolRepresentativeEmail: string | null;
  schoolRepresentativePhone: string | null;
  guardianName: string | null;
  guardianRelationship: GuardianRelationship | null;
  guardianAuthorized: boolean;
  contactEmail: string;
  contactPhone: string;
  privacyNoticeAccepted: boolean;
  futureEventUpdates: boolean;
  turnstileToken: string;
}

interface RegisterEventResponse {
  registrationId: string;
  paymentStatus: "pending";
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        action: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      }) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

export default function RegistrationForm({ initialCategory = "21KM Half Marathon" }: { initialCategory?: Category }) {
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    gender: "" as Gender | "",
    category: initialCategory,
    registrationTier: "Regular" as RegistrationTier,
    email: "",
    phone: "",
    agreedToTerms: false,
    optInMarketing: false,
    guardianName: "",
    guardianRelationship: "parent" as GuardianRelationship,
    guardianAuthorized: false,
    beneficiarySchoolName: "",
    schoolRepresentativeName: "",
  });

  const [loading, setLoading] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [submittedTier, setSubmittedTier] = useState<RegistrationTier>("Regular");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const participantIsMinor = formData.age !== "" && Number(formData.age) < 18;
  const isBeneficiaryStudent = formData.registrationTier === "Beneficiary school student";

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileContainer.current) return;

    let timer = 0;
    const renderWidget = () => {
      if (!window.turnstile || !turnstileContainer.current || turnstileWidgetId.current) return;
      turnstileWidgetId.current = window.turnstile.render(turnstileContainer.current, {
        sitekey: turnstileSiteKey,
        action: "event_registration",
        callback: setTurnstileToken,
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
      window.clearInterval(timer);
    };

    timer = window.setInterval(renderWidget, 250);
    renderWidget();
    return () => {
      window.clearInterval(timer);
      if (turnstileWidgetId.current) window.turnstile?.remove?.(turnstileWidgetId.current);
      turnstileWidgetId.current = null;
    };
  }, [turnstileSiteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRegistrationId(null);
    if (!functions) {
      setError("Registration is unavailable because the event service is not configured.");
      return;
    }
    if (!turnstileToken) {
      setError("Complete the spam protection check before submitting.");
      return;
    }
    setLoading(true);

    try {
      const registerEventFn = httpsCallable<RegisterEventPayload, RegisterEventResponse>(
        functions,
        "registerEvent",
      );

      const result = await registerEventFn({
        participantName: formData.fullName,
        participantAge: Number(formData.age),
        gender: formData.gender as Gender,
        raceCategory: formData.category === "21KM Half Marathon" ? "21k" :
          formData.category === "10KM Run" ? "10k" :
            formData.category === "5KM Run/Walk" ? "5k" : "children_fun_run",
        registrationTier: formData.registrationTier,
        beneficiarySchoolName: isBeneficiaryStudent ? formData.beneficiarySchoolName : null,
        schoolRepresentativeName: isBeneficiaryStudent ? formData.schoolRepresentativeName : null,
        schoolRepresentativeEmail: isBeneficiaryStudent ? formData.email : null,
        schoolRepresentativePhone: isBeneficiaryStudent ? formData.phone : null,
        guardianName: participantIsMinor ? formData.guardianName : null,
        guardianRelationship: participantIsMinor ? formData.guardianRelationship : null,
        guardianAuthorized: participantIsMinor && formData.guardianAuthorized,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        privacyNoticeAccepted: formData.agreedToTerms,
        futureEventUpdates: formData.optInMarketing,
        turnstileToken,
      });

      setRegistrationId(result.data.registrationId);
      setSubmittedTier(formData.registrationTier);
      setFormData({
        fullName: "", age: "", gender: "", category: "21KM Half Marathon", registrationTier: "Regular", email: "", phone: "",
        agreedToTerms: false, optInMarketing: false, guardianName: "",
        guardianRelationship: "parent", guardianAuthorized: false,
        beneficiarySchoolName: "", schoolRepresentativeName: "",
      });
      setTurnstileToken("");
      if (turnstileWidgetId.current) window.turnstile?.reset(turnstileWidgetId.current);
    } catch (cause) {
      console.error("Cloud function error:", cause);
      setError(cause instanceof Error ? cause.message : "Registration failed. Please try again.");
      setTurnstileToken("");
      if (turnstileWidgetId.current) window.turnstile?.reset(turnstileWidgetId.current);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="relative mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Participant Registration</span>
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
          Take your place at the start
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Registration fee depends on your selected tier. Paid registrations remain pending until an administrator confirms payment; beneficiary school students register free through a school representative.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Participant full name <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-2xl border-2 border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Participant age (years) <span className="text-emerald-600">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              max="120"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full rounded-2xl border-2 border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              placeholder="36"
            />
          </div>
          <div>
            <label htmlFor="participant-gender" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Gender <span className="text-emerald-600">*</span>
            </label>
            <select
              id="participant-gender"
              required
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender | "" })}
              className="w-full cursor-pointer rounded-2xl border-2 border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
            >
              <option value="" disabled>Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Category <span className="text-emerald-600">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
              className="w-full cursor-pointer rounded-2xl border-2 border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
            >
              <option value="Children's Fun Run">Children&apos;s Fun Run</option>
              <option value="5KM Run/Walk">5KM Run/Walk</option>
              <option value="10KM Run">10KM Run</option>
              <option value="21KM Half Marathon">21KM Half Marathon</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Registration package *</label>
            <select value={formData.registrationTier} onChange={(e) => setFormData({ ...formData, registrationTier: e.target.value as RegistrationTier })} className="w-full cursor-pointer rounded-2xl border-2 border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5">
              <option value="Regular">Regular — KES 500 (entry ticket)</option>
              <option value="VIP">VIP — KES 1,000 (ticket, medal, VIP tent access)</option>
              <option value="VVIP">VVIP — KES 1,500 (ticket, medal, T-Shirt, sponsor lounge)</option>
              <option value="Beneficiary school student">Beneficiary school student — Free</option>
            </select>
          </div>

          {isBeneficiaryStudent && <div className="grid grid-cols-1 gap-4 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 md:col-span-2 md:grid-cols-2 lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 md:col-span-2">School representative submission — one student per registration</h3>
            <input aria-label="Beneficiary school" placeholder="Beneficiary school *" required maxLength={150} value={formData.beneficiarySchoolName} onChange={(e) => setFormData({ ...formData, beneficiarySchoolName: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm" />
            <input aria-label="School representative full name" placeholder="Representative full name *" required maxLength={150} value={formData.schoolRepresentativeName} onChange={(e) => setFormData({ ...formData, schoolRepresentativeName: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm" />
            <p className="text-xs leading-relaxed text-slate-600 md:col-span-2 lg:col-span-3">School registrations remain pending until an administrator confirms beneficiary-school eligibility.</p>
          </div>}

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              {isBeneficiaryStudent ? "Representative email (for updates)" : "Participant email"} <span className="text-emerald-600">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-2xl border-2 border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              placeholder="john.doe@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              {isBeneficiaryStudent ? "Representative phone (for updates)" : "Participant phone"} <span className="text-emerald-600">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-2xl border-2 border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              placeholder="+254 700 000 000"
            />
          </div>
        </div>

        {participantIsMinor && (
          <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-white/70 p-4">
            <legend className="px-2 text-xs font-bold uppercase tracking-wider text-slate-700">Parent or guardian details</legend>
            <div>
              <label htmlFor="guardian-name" className="mb-1.5 block text-xs font-bold text-slate-700">Parent or guardian full name *</label>
              <input
                id="guardian-name"
                type="text"
                required
                maxLength={150}
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                className="w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
              />
            </div>
            <div>
              <label htmlFor="guardian-relationship" className="mb-1.5 block text-xs font-bold text-slate-700">Relationship to participant *</label>
              <select
                id="guardian-relationship"
                required
                value={formData.guardianRelationship}
                onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value as GuardianRelationship })}
                className="w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
              >
                <option value="parent">Parent</option>
                <option value="legal_guardian">Legal guardian</option>
                <option value="other">Other authorized guardian</option>
              </select>
            </div>
            <label className="flex items-start gap-3 text-xs text-slate-600">
              <input
                type="checkbox"
                required
                checked={formData.guardianAuthorized}
                onChange={(e) => setFormData({ ...formData, guardianAuthorized: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>{isBeneficiaryStudent ? "I confirm the parent or guardian has consented to this student's participation and that the school is authorized to submit this entry. *" : "I confirm I am authorized to register this participant and consent to their participation. *"}</span>
            </label>
          </fieldset>
        )}

        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              required
              checked={formData.agreedToTerms}
              onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>I have read the privacy notice and agree that these details may be used to administer this event. *</span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              checked={formData.optInMarketing}
              onChange={(e) => setFormData({ ...formData, optInMarketing: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>I would like to receive information about future Wahome Foundation events (optional).</span>
          </label>
        </div>

        {turnstileSiteKey ? (
          <div>
            <div ref={turnstileContainer} />
            {!turnstileToken && <p className="mt-2 text-xs text-slate-500">Complete the spam protection check to submit.</p>}
          </div>
        ) : (
          <p role="status" className="text-sm text-amber-700">Registration is unavailable because spam protection is not configured.</p>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading || !functions || !turnstileSiteKey || !turnstileToken}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-slate-900/20 transition-all duration-200 hover:bg-slate-800 hover:shadow-slate-900/30 active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting registration...</span>
            </>
          ) : (
            <>
              <span>Submit registration</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {registrationId && (
        <div className="mx-6 mb-6 rounded-2xl border border-blue-200 bg-blue-50/90 p-5 text-sm text-slate-800 shadow-sm animate-in fade-in duration-300 md:mx-8 md:mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">Registration received · Ref {registrationId}</p>
              <p className="mt-1 text-xs text-slate-600">{submittedTier === "Beneficiary school student" ? "Your school-submitted free entry is pending administrator confirmation." : `Your ${submittedTier} entry is pending administrator confirmation of payment.`}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
