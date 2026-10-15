import React, { useState } from "react";
import { signInWithEmailAndPassword, auth } from "../../lib/adminAuth";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

interface AdminLoginFormProps {
  onSuccess: () => void;
}

export default function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError("Firebase Auth is not configured for this deployment.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      setError("Invalid admin credentials or unauthorized account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50 antialiased font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs hover:shadow-sm transition-shadow">
        
        {/* Top Header Badge & Branding */}
        <div className="flex flex-col items-start gap-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Miles for Minds 2026</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Wahome Foundation Admin
          </h1>
          <p className="text-xs text-slate-500">
            Secure sign-in for event management and ledger verification.
          </p>
        </div>

        {/* Error Notification Pill */}
        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@wahomefoundation.org"
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !auth}
            className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Footer Security Tag */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Encrypted Firebase Auth
          </span>
          <span>v2.4</span>
        </div>

      </div>
    </div>
  );
}
