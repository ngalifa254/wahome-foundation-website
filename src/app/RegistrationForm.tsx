import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase"; // Uses existing functions export from lib/firebase.ts

type Category = "21K" | "10K" | "Children's 5K";
type Gender = "male" | "female";
type GuardianRelationship = "parent" | "legal_guardian" | "other";

interface RegisterEventPayload {
  participantName: string;
  participantAge: number;
  gender: Gender;
  raceCategory: "21k" | "10k" | "children_5k";
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

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    gender: "" as Gender | "",
    category: "21K" as Category,
    email: "",
    phone: "",
    agreedToTerms: false,
    optInMarketing: false,
    guardianName: "",
    guardianRelationship: "parent" as GuardianRelationship,
    guardianAuthorized: false,
  });

  const [loading, setLoading] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const participantIsMinor = formData.age !== "" && Number(formData.age) < 18;

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
        raceCategory: formData.category === "21K" ? "21k" :
          formData.category === "10K" ? "10k" : "children_5k",
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
      setFormData({
        fullName: "", age: "", gender: "", category: "21K", email: "", phone: "",
        agreedToTerms: false, optInMarketing: false, guardianName: "",
        guardianRelationship: "parent", guardianAuthorized: false,
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
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/30 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-xl transition-all duration-300">
      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />

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
          Registration fee: <span className="font-bold text-slate-900">KSh 1,000 per participant</span> for all categories.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Participant full name <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              placeholder="e.g. George Nganga"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Participant age in years <span className="text-emerald-600">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
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
                className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              >
                <option value="" disabled>Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Category <span className="text-emerald-600">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
              className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
            >
              <option value="21K">21K</option>
              <option value="10K">10K</option>
              <option value="Children's 5K">Children's 5K</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Participant email <span className="text-emerald-600">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              placeholder="gnganga@gsdkenya.com"
            />
          </div>

        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
            Participant phone <span className="text-emerald-600">*</span>
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
            placeholder="0121258699"
          />
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
              />
            </div>
            <div>
              <label htmlFor="guardian-relationship" className="mb-1.5 block text-xs font-bold text-slate-700">Relationship to participant *</label>
              <select
                id="guardian-relationship"
                required
                value={formData.guardianRelationship}
                onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value as GuardianRelationship })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
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
              <span>I confirm I am authorized to register this participant and consent to their participation. *</span>
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
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 p-4 text-xs text-emerald-950 shadow-sm animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Registration saved via Cloud Function!</p>
            <p className="mt-1">
              Ref ID: <code className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-emerald-950 font-bold">{registrationId}</code>
            </p>
            <p className="mt-1 text-emerald-800">
              Saved to <code className="font-semibold">eventRegistrations</code> with status <span className="font-bold uppercase">"pending"</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
