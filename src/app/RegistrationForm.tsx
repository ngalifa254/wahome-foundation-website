import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Sparkles, ShieldCheck, User, Mail, Phone, Calendar, Layers } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";

type Category = "21K" | "10K" | "Children's 5K";

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    category: "21K" as Category,
    email: "",
    phone: "",
    agreedToTerms: false,
    optInMarketing: false,
  });

  const [loading, setLoading] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!functions) {
        throw new Error("Firebase Functions instance is not initialized.");
      }

      // Calls secure registerEvent backend function directly
      const registerEventFn = httpsCallable(functions, "registerEvent");
      const result: any = await registerEventFn({
        fullName: formData.fullName,
        age: Number(formData.age),
        category: formData.category,
        email: formData.email,
        phone: formData.phone,
        agreedToTerms: formData.agreedToTerms,
        optInMarketing: formData.optInMarketing,
      });

      const returnedId = result?.data?.registrationId || result?.data?.id || "REGISTERED_PENDING";
      setRegistrationId(returnedId);
    } catch (error: any) {
      console.error("Registration error:", error);
      alert(`Submission failed: ${error?.message || "Please check function configuration."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 sm:p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-xl">
      {/* Visual Accent Glows */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Header Block */}
      <div className="relative mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Participant Registration</span>
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Take your place at the start
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Registration fee: <span className="font-bold text-slate-900">KSh 1,000 per participant</span> for all categories.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Name Field */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Participant full name <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition duration-200 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                placeholder="e.g. George Nganga"
              />
            </div>
          </div>

          {/* Age Field */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Participant age in years <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="number"
                required
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition duration-200 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                placeholder="36"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Category Selector */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Category <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <Layers className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition duration-200 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              >
                <option value="21K">21K</option>
                <option value="10K">10K</option>
                <option value="Children's 5K">Children's 5K</option>
              </select>
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Participant email <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition duration-200 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                placeholder="gnganga@gsdkenya.com"
              />
            </div>
          </div>
        </div>

        {/* Phone Field */}
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
            Participant phone <span className="text-emerald-600">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition duration-200 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              placeholder="0121258699"
            />
          </div>
        </div>

        {/* Agreement Checkboxes */}
        <div className="space-y-2 pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              required
              checked={formData.agreedToTerms}
              onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>I have read the privacy notice and agree that these details may be used to administer this event. *</span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              checked={formData.optInMarketing}
              onChange={(e) => setFormData({ ...formData, optInMarketing: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>I would like to receive information about future Wahome Foundation events (optional).</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all duration-200 hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Saving registration...</span>
            </>
          ) : (
            <>
              <span>Submit registration</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {/* Confirmation State */}
      {registrationId && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 p-4 text-xs text-emerald-950 shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Registration saved to Firestore!</p>
            <p className="mt-1">
              Document Ref: <code className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono font-bold">{registrationId}</code>
            </p>
            <p className="mt-1 text-emerald-800">
              Saved in <code className="font-semibold">eventRegistrations</code> with status <span className="font-bold uppercase">"pending"</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}