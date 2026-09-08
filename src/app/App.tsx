import image_mentorship_1 from "@/imports/mentorship-1.jpg";
import image_DSC_0332 from "@/imports/DSC_0332.jpg";
import image_DSC_0445 from "@/imports/DSC_0445.jpg";
import image_Prizegiving_What_we_do from "@/imports/Prizegiving-What-we-do.png";
import image_wells_of_hope from "@/imports/wells_of_hope.jpg";
import image_fundeducation from "@/imports/fundeducation.jpg";
import alexPhoto from "@/imports/Alex.jpeg";
import jedidahPhoto from "@/imports/Jedidah.jpeg";
import jamesPhoto from "@/imports/James.jpeg";
import newtonPhoto from "@/imports/Newton.jpeg";
import samuelPhoto from "@/imports/Samuel.jpeg";
import wahomeSlideshow from "@/imports/wahome_foundation_slideshow.mp4";
import thomasPhoto from "@/imports/thomas.jpg";
import wellsPhoto from "@/imports/wells.jpg";
import mentorshipPhoto from "@/imports/mentorship.jpg";
import dkPhoto from "@/imports/dk.jpg";
import cynthiaPhoto from "@/imports/cynthia.jpeg";
import georgePhoto from "@/imports/george.jpg";
import footerLogo from "@/imports/wlogo.jfif";
import mainLogo from "@/imports/mainlogo.png";
import marathon1 from "@/imports/marathon1.jpg";
import marathon2 from "@/imports/marathon2.jpg";
import marathon3 from "@/imports/marathon3.jpg";
import marathon4 from "@/imports/marathon4.jpg";
import marathon5 from "@/imports/marathon5.jpg";
import marathon6 from "@/imports/marathon6.jpg";
import { useState, useEffect, useRef } from "react";

import {
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Heart,
  Droplets,
  GraduationCap,
  Users,
  ArrowRight,
  Quote,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  CheckCircle,
  Clock,
  Award,
  FileText,
  PlayCircle,
  ExternalLink,
  Newspaper,
} from "lucide-react";

type Page =
  | "home"
  | "about"
  | "scholarship"
  | "wells"
  | "prize"
  | "mentorship";

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionTag({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase text-[#1D95B8] mb-3">
      {children}
    </span>
  );
}

function ProgressBar({
  raised,
  goal,
}: {
  raised: number;
  goal: number;
}) {
  const pct = Math.min(100, Math.round((raised / goal) * 100));
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-[#5C6B72] mb-1.5">
        <span className="font-semibold text-[#10202B]">
          ${raised.toLocaleString()} raised
        </span>
        <span>of ${goal.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-[#D6E4EA] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#1D95B8] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-[#5C6B72] mt-1">
        {pct}% funded
      </p>
    </div>
  );
}

function CTABanner({
  onDonate,
  onInvolve,
}: {
  onDonate: () => void;
  onInvolve: () => void;
}) {
  return (
    <section className="py-20 px-6 bg-[#10202b]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to make a lasting difference?
        </h2>
        <p className="text-[#8FAFBC] text-lg mb-10 max-w-xl mx-auto">
          Every contribution directly transforms lives across
          Kenya.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onDonate}
            className="px-8 py-3.5 rounded-xl bg-[#0EA5E9] text-white font-semibold text-base hover:bg-[#0284C7] transition-colors duration-150"
          >
            Donate Now
          </button>
          <button
            onClick={onInvolve}
            className="px-8 py-3.5 rounded-xl border-2 border-[#0EA5E9] text-[#38BDF8] font-semibold text-base hover:bg-[#0EA5E9]/10 transition-colors duration-150"
          >
            Get Involved
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── DONATION MODAL ───────────────────────────────────────────────────────────

function DonateModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currency, setCurrency] = useState<"USD" | "KES">(
    "USD",
  );
  const [amount, setAmount] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [frequency] = useState("One time");
  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "mpesa" | "paybill" | "paypal"
  >("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const currencySymbol = currency === "USD" ? "$" : "KSh ";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 border border-[#D6E4EA]">
        {/* Header */}
        <div className="bg-[#10202B] px-6 py-5 text-white flex items-center justify-between">
          <h2
            className="font-bold text-lg"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Support Wahome Foundation
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-[#EAF6FA] text-[#1D95B8] rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-[#10202B]">
              Thank you for your generosity!
            </h3>
            <p className="text-[#5C6B72] text-sm max-w-md mx-auto">
              {paymentMethod === "mpesa"
                ? `An M-Pesa payment prompt has been sent to ${mpesaPhone || "your phone"}. Please enter your PIN to complete the donation.`
                : paymentMethod === "paybill"
                  ? `Please complete your transfer via Paybill 123456 using Account Name: ${`${firstName} ${lastName}`.trim() || "Your Name"}.`
                  : "Your contribution directly empowers bright students and communities across Kenya."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-4 px-6 py-3 bg-[#1D95B8] text-white font-semibold rounded-xl hover:bg-[#157996] transition-colors"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto"
          >
            {/* Step 1: Currency Toggle & Amount Entry */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-[#10202B]">
                  How much would you like to donate today?
                </h3>

                {/* Currency Switcher */}
                <div className="flex items-center bg-[#EAF6FA] p-1 rounded-xl border border-[#D6E4EA]">
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      currency === "USD"
                        ? "bg-[#1D95B8] text-white shadow-sm"
                        : "text-[#5C6B72] hover:text-[#10202B]"
                    }`}
                  >
                    US$
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("KES")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      currency === "KES"
                        ? "bg-[#1D95B8] text-white shadow-sm"
                        : "text-[#5C6B72] hover:text-[#10202B]"
                    }`}
                  >
                    KSh
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#5C6B72] mb-4">
                All donations directly impact our organization
                and help us further our mission.
              </p>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#5C6B72]">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  required
                  placeholder={`Enter amount in ${currency}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-[#D6E4EA] text-sm font-semibold focus:outline-none focus:border-[#1D95B8] text-[#10202B]"
                />
              </div>
            </div>

            {/* Step 2: Donor Details */}
            <div className="space-y-3">
              <h3 className="font-bold text-base text-[#10202B]">
                Who&apos;s Giving Today?
              </h3>
              <p className="text-xs text-[#5C6B72]">
                We&apos;ll never share this information with
                anyone.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#10202B] mb-1">
                    First name *
                  </label>
                  <input
                    required
                    placeholder="John"
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6E4EA] text-sm focus:outline-none focus:border-[#1D95B8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#10202B] mb-1">
                    Last name (Optional)
                  </label>
                  <input
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) =>
                      setLastName(e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6E4EA] text-sm focus:outline-none focus:border-[#1D95B8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10202B] mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6E4EA] text-sm focus:outline-none focus:border-[#1D95B8]"
                />
              </div>
            </div>

            {/* Step 3: Payment Details & Summary */}
            <div className="space-y-4">
              <h3 className="font-bold text-base text-[#10202B]">
                Payment Details
              </h3>

              {/* Payment Methods */}
              <div className="space-y-2">
                {/* 1. M-Pesa Express (STK Push) */}
                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "mpesa"
                      ? "border-[#1D95B8] bg-[#EAF6FA]/40 ring-1 ring-[#1D95B8]"
                      : "border-[#D6E4EA]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "mpesa"}
                      onChange={() => setPaymentMethod("mpesa")}
                      className="accent-[#1D95B8]"
                    />
                    <span className="text-sm font-semibold text-[#10202B]">
                      M-Pesa Express (STK Push)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#2BB32A] bg-[#E8F8E8] px-2 py-0.5 rounded-md">
                    M-PESA
                  </span>
                </label>

                {paymentMethod === "mpesa" && (
                  <div className="p-4 bg-[#EAF6FA]/60 rounded-xl border border-[#D6E4EA] space-y-2">
                    <label className="block text-xs font-semibold text-[#10202B]">
                      M-Pesa Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0712345678 or 254712345678"
                      value={mpesaPhone}
                      onChange={(e) =>
                        setMpesaPhone(e.target.value)
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-[#D6E4EA] text-sm bg-white focus:outline-none focus:border-[#1D95B8]"
                    />
                    <p className="text-[11px] text-[#5C6B72]">
                      An instant STK push prompt will be sent
                      directly to your phone.
                    </p>
                  </div>
                )}

                {/* 2. Paybill Option */}
                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "paybill"
                      ? "border-[#2BB32A] bg-[#E8F8E8]/40 ring-1 ring-[#2BB32A]"
                      : "border-[#D6E4EA]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "paybill"}
                      onChange={() =>
                        setPaymentMethod("paybill")
                      }
                      className="accent-[#2BB32A]"
                    />
                    <span className="text-sm font-semibold text-[#10202B]">
                      Pay via Paybill
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#2BB32A] bg-[#E8F8E8] px-2 py-0.5 rounded-md">
                    PAYBILL
                  </span>
                </label>

                {paymentMethod === "paybill" && (
                  <div className="p-4 bg-white rounded-xl border border-[#2BB32A]/30 shadow-sm space-y-3">
                    {/* Official Green & White Banner */}
                    <div className="bg-[#2BB32A] text-white p-3.5 rounded-lg flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-2">
                        <span className="bg-white text-[#2BB32A] text-xs font-extrabold px-2 py-1 rounded">
                          LIPA NA M-PESA
                        </span>
                        <span className="font-bold text-sm tracking-wide">
                          PAYBILL
                        </span>
                      </div>
                      <span className="text-xs font-medium opacity-90">
                        Business No: 123456
                      </span>
                    </div>

                    {/* Instructions Box */}
                    <div className="bg-[#F4FBF4] p-3.5 rounded-lg border border-[#E0F2E0] text-xs space-y-2">
                      <div className="flex justify-between border-b border-[#D2EBD2] pb-1.5">
                        <span className="text-[#5C6B72]">
                          Paybill Business No:
                        </span>
                        <strong className="text-[#10202B] font-bold text-sm">
                          123456
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5C6B72]">
                          Account Number:
                        </span>
                        <strong className="text-[#10202B] font-bold text-sm">
                          {`${firstName} ${lastName}`.trim() ||
                            "Your Name"}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Card Option */}
                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "card"
                      ? "border-[#1D95B8] bg-[#EAF6FA]/40 ring-1 ring-[#1D95B8]"
                      : "border-[#D6E4EA]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="accent-[#1D95B8]"
                    />
                    <span className="text-sm font-semibold text-[#10202B]">
                      Credit / Debit Card
                    </span>
                  </div>
                  <span className="text-xs text-[#5C6B72]">
                    Visa / Mastercard
                  </span>
                </label>

                {/* 4. PayPal Option */}
                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "paypal"
                      ? "border-[#1D95B8] bg-[#EAF6FA]/40 ring-1 ring-[#1D95B8]"
                      : "border-[#D6E4EA]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "paypal"}
                      onChange={() =>
                        setPaymentMethod("paypal")
                      }
                      className="accent-[#1D95B8]"
                    />
                    <span className="text-sm font-semibold text-[#10202B]">
                      PayPal
                    </span>
                  </div>
                  <span className="text-xs text-[#003087] font-bold">
                    PayPal
                  </span>
                </label>
              </div>

              {/* Donation Summary Card */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2 text-sm">
                <div className="flex justify-between text-[#5C6B72]">
                  <span>Payment Amount</span>
                  <span className="font-semibold text-[#10202B]">
                    {currencySymbol}
                    {amount || "0"}
                  </span>
                </div>
                <div className="flex justify-between text-[#5C6B72]">
                  <span>Giving Frequency</span>
                  <span className="font-semibold text-[#10202B]">
                    {frequency}
                  </span>
                </div>
                <div className="border-t border-[#E2E8F0] pt-2 flex justify-between font-bold text-[#10202B]">
                  <span>Donation Total</span>
                  <span className="text-[#1D95B8]">
                    {currencySymbol}
                    {amount || "0"}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-base transition-colors shadow-md"
            >
              Donate now ({currencySymbol}
              {amount || "0"})
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

interface NavbarProps {
  current: Page;
  onNav: (p: Page) => void;
  onOpenDonate: () => void;
}

const navLinks: { label: string; page: Page }[] = [
  { label: "Home", page: "home" },
  { label: "About Us", page: "about" },
  { label: "Scholarship", page: "scholarship" },
  { label: "Wells of Hope", page: "wells" },
  { label: "Prize Giving", page: "prize" },
  { label: "Mentorship", page: "mentorship" },
];

function Navbar({ current, onNav, onOpenDonate }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
      setVisible(true);

      if (timerRef.current) clearTimeout(timerRef.current);

      if (isScrolled) {
        timerRef.current = setTimeout(() => {
          setVisible(false);
        }, 5000);
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [open]);

  const go = (p: Page) => {
    onNav(p);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header
      onMouseEnter={() => {
        setVisible(true);
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      className={`sticky top-0 z-40 bg-white/10 backdrop-blur-md transition-all duration-100 transform ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      } ${scrolled ? "shadow-md bg-white/10" : "border-b border-[#D6E4EA]/60"}`}
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Container height increased from h-[72px] to h-[88px] */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[88px] flex items-center justify-between">
        {/* Enlarged Logo (h-14 on mobile, h-16 on desktop) */}
        <button
          onClick={() => go("home")}
          className="flex items-center shrink-0"
        >
          <img
            src={mainLogo}
            alt="Wahome Foundation - Inspire & Empower"
            className="h-14 md:h-16 w-auto object-contain transition-all"
          />
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => (
            <button
              key={l.page}
              onClick={() => go(l.page)}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                current === l.page
                  ? "bg-[#EAF6FA] text-[#0EA5E9]"
                  : "text-[#0EA5E9] hover:text-[#0284C7] hover:bg-[#EAF6FA]/60"
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Donate button */}
        <button
          onClick={onOpenDonate}
          className="hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0EA5E9] text-white text-sm font-semibold hover:bg-[#0284C7] transition-colors duration-150"
        >
          <Heart className="w-4 h-4" />
          Donate Now
        </button>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 rounded-lg text-[#0EA5E9] hover:bg-[#EAF6FA] transition-colors"
          aria-label="Toggle menu"
        >
          {open ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden border-t border-[#D6E4EA]/60 bg-white/95 backdrop-blur-md px-4 py-4 flex flex-col gap-1 shadow-lg">
          {navLinks.map((l) => (
            <button
              key={l.page}
              onClick={() => go(l.page)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                current === l.page
                  ? "bg-[#EAF6FA] text-[#0EA5E9]"
                  : "text-[#0EA5E9] hover:bg-[#EAF6FA]/60"
              }`}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              onOpenDonate();
            }}
            className="mt-2 w-full py-3 rounded-xl bg-[#0EA5E9] text-white text-sm font-semibold hover:bg-[#0284C7] transition-colors"
          >
            Donate Now
          </button>
        </div>
      )}
    </header>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer({
  onNav,
  onOpenDonate,
}: {
  onNav: (p: Page) => void;
  onOpenDonate: () => void;
}) {
  const go = (p: Page) => {
    onNav(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <footer
      className="bg-[#10202B] text-[#8FAFBC]"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="h-12 mb-4 flex items-center bg-transparent">
            <img
              src={footerLogo}
              alt="Wahome Foundation Logo"
              className="h-12 w-auto object-contain bg-transparent mix-blend-screen"
            />
          </div>

          <p className="text-sm leading-relaxed mb-6">
            Wahome Foundation is registered Under US and Kenyan
            law with the aim of Empowering communities across
            Kenya
          </p>
          <div className="flex gap-3">
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <button
                key={i}
                className="w-8 h-8 rounded-full border border-[#5C6B72] flex items-center justify-center hover:border-[#1D95B8] hover:text-[#1D95B8] transition-colors"
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">
            Quick Links
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button
                onClick={() => go("home")}
                className="hover:text-white transition-colors"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => go("about")}
                className="hover:text-white transition-colors"
              >
                About Us
              </button>
            </li>
            <li>
              <button
                onClick={onOpenDonate}
                className="hover:text-white transition-colors"
              >
                Donate Now
              </button>
            </li>
            <li>
              <button
                onClick={() => go("mentorship")}
                className="hover:text-white transition-colors"
              >
                Get Involved
              </button>
            </li>
          </ul>
        </div>

        {/* Kenya Office Column */}
        <div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">
            Kenya Office
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#1D95B8] shrink-0 mt-0.5" />
              <span>69 Haile Salasie Rd, Nanyuki, Kenya</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#1D95B8] shrink-0" />
              <span>+254 700 000 000</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#1D95B8] shrink-0" />
              <a
                href="mailto:info@wahomefoundation.com"
                className="hover:text-white transition-colors"
              >
                info@wahomefoundation.com
              </a>
            </li>
          </ul>
        </div>

        {/* US Office Column */}
        <div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">
            US Office
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#1D95B8] shrink-0 mt-0.5" />
              <span>
                560 Boston Turnpike, Shrewsbury, MA 01545
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#1D95B8] shrink-0" />
              <a
                href="mailto:info@wahomefoundation.com"
                className="hover:text-white transition-colors"
              >
                info@wahomefoundation.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#1C3241] py-6 text-center text-xs text-[#5C6B72]">
        © {new Date().getFullYear()} Wahome Foundation. All
        rights reserved.
      </div>
    </footer>
  );
}

// ─── Inner page hero ─────────────────────────────────────────────────────────

function PageHero({
  title,
  subtitle,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  breadcrumb: string;
}) {
  return (
    <section className="bg-[#10202B] py-20 px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #1D95B8 0%, transparent 60%), radial-gradient(circle at 80% 20%, #C68A3D 0%, transparent 50%)",
        }}
      />
      <div className="relative max-w-5xl mx-auto">
        <p className="text-[#5C6B72] text-sm mb-3">
          Home <ChevronRight className="inline w-3 h-3" />{" "}
          {breadcrumb}
        </p>
        <h1
          className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight mb-4"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[#8FAFBC] text-lg max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}

// ─── PORTFOLIO CAROUSEL ───────────────────────────────────────────────────────

const portfolioItems = [
  {
    tag: "OUR PORTFOLIOS",
    title: "Thomas D.K. Wahome Scholarship",
    description:
      "Providing full tuition, learning materials, and exam fee coverage for exceptional students who dare to dream.",
    image: thomasPhoto,
    page: "scholarship" as Page,
    btnText: "READ FULL STORY",
  },
  {
    tag: "OUR PORTFOLIOS",
    title: "Wells of Hope Water Project",
    description:
      "Clean, reliable water access transforming community health, sanitation, and regional economic stability.",
    image: wellsPhoto,
    page: "wells" as Page,
    btnText: "EXPLORE PROGRAMME",
  },
  {
    tag: "OUR PORTFOLIOS",
    title: "Youth Mentorship Programme",
    description:
      "Connecting promising students with professionals across Kenya and the diaspora for career guidance.",
    image: mentorshipPhoto,
    page: "mentorship" as Page,
    btnText: "DISCOVER MENTORSHIP",
  },
];

function PortfolioCarousel({
  onNav,
}: {
  onNav: (p: Page) => void;
}) {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const pausedRef = useRef(false);

  const advance = (dir: 1 | -1) => {
    setFading(true);
    setTimeout(() => {
      setActive(
        (i) =>
          (i + dir + portfolioItems.length) %
          portfolioItems.length,
      );
      setFading(false);
    }, 250);
  };

  const goTo = (idx: number) => {
    if (idx === active) return;
    setFading(true);
    setTimeout(() => {
      setActive(idx);
      setFading(false);
    }, 250);
  };

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) advance(1);
    }, 4500);
    return () => clearInterval(id);
  }, [active]);

  const item = portfolioItems[active];

  return (
    <div
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      className="relative max-w-5xl mx-auto py-8"
    >
      <div className="relative p-4 sm:p-8 md:p-12 my-6">
        {/* Main Content Card */}
        <div
          className={`relative bg-white shadow-xl rounded-2xl p-6 sm:p-10 md:p-12 transition-opacity duration-500 z-10 border border-[#D6E4EA] ${
            fading ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="grid md:grid-cols-12 gap-8 items-center">
            {/* Overlapping Left Image Box */}
            <div className="md:col-span-5 relative -mt-10 md:-mt-16 md:-ml-16 z-20">
              <div className="aspect-[4/5] w-full rounded-xl overflow-hidden shadow-2xl border-4 border-white bg-[#EAF6FA]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* Right Text Content */}
            <div className="md:col-span-7 flex flex-col items-start justify-center text-left pl-0 md:pl-4">
              <span className="text-xs font-extrabold tracking-[0.2em] uppercase text-[#1D95B8] mb-3">
                {item.tag}
              </span>

              <h3
                className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#10202B] mb-4 leading-tight"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                {item.title}
              </h3>

              <p className="text-[#5C6B72] text-sm sm:text-base leading-relaxed mb-8">
                {item.description}
              </p>

              {/* Theme Blue CTA Button */}
              <button
                type="button"
                onClick={() => onNav(item.page)}
                className="px-8 py-3.5 rounded-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-xs tracking-wider uppercase transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02]"
              >
                {item.btnText}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-6 mt-2 z-20 relative">
        <button
          type="button"
          onClick={() => advance(-1)}
          className="w-10 h-10 rounded-full bg-white border border-[#D6E4EA] flex items-center justify-center text-[#5C6B72] hover:border-[#1D95B8] hover:text-[#1D95B8] transition-colors shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {portfolioItems.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === active
                  ? "bg-[#1D95B8] w-8"
                  : "bg-[#D6E4EA] w-2.5 hover:bg-[#8FAFBC]"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => advance(1)}
          className="w-10 h-10 rounded-full bg-white border border-[#D6E4EA] flex items-center justify-center text-[#5C6B72] hover:border-[#1D95B8] hover:text-[#1D95B8] transition-colors shadow-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

// ─── Campaign Slideshow Helper ───────────────────────────────────────────────

function CampaignSlideshow({
  images,
  aspectClass = "aspect-[3/4]",
}: {
  images: string[];
  aspectClass?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div
      className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden bg-[#B9D3DE] shadow-md`}
    >
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt={`Campaign slide ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
            i === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute bottom-3 right-3 flex gap-1.5 z-10 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full">
        {images.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === currentIndex ? "bg-white w-4" : "bg-white/50 w-1.5"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
function HomePage({
  onNav,
  onOpenDonate,
}: {
  onNav: (p: Page) => void;
  onOpenDonate: () => void;
}) {
  const go = (p: Page) => {
    onNav(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center bg-[#10202B] overflow-hidden">
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-90"
          >
            <source src={wahomeSlideshow} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-[#10202B]/80 to-transparent" />
        </div>
        <div className="relative max-w-2xl px-6 py-32 text-left z-10">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[#1D95B8] mb-5">
            Wahome Foundation · Est. 2006
          </span>
          <h1
            className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Change lives
            <br />
            <span className="text-[#1D95B8]">through</span>
            <br />
            direct action
          </h1>
          <p className="text-[#8FAFBC] text-lg leading-relaxed mb-10 max-w-xl">
            Your support today helps a bright child stay in
            school and chase their dreams.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={onOpenDonate}
              className="px-8 py-4 rounded-xl bg-[#0EA5E9] text-white font-semibold hover:bg-[#0284C7] transition-colors duration-150 shadow-lg"
            >
              Donate Now
            </button>
            <button
              onClick={() => go("about")}
              className="px-8 py-4 rounded-xl bg-white/10 text-white font-semibold backdrop-blur border border-white/20 hover:bg-white/20 transition-colors duration-150"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionTag>Who We Are</SectionTag>
            <h2
              className="font-serif text-4xl md:text-5xl font-bold text-[#10202B] leading-tight mb-6"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Inspiring and empowering Kenya&apos;s next
              generation
            </h2>
            <p className="text-[#5C6B72] text-lg leading-relaxed mb-6">
              Founded in 2006, Wahome Foundation works to
              empower communities across Kenya through
              education, clean water access, and mentorship —
              one student, one well, one story at a time.
            </p>
            <button
              onClick={() => go("about")}
              className="inline-flex items-center gap-2 text-[#1D95B8] font-semibold hover:gap-3 transition-all duration-150"
            >
              Learn More <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-[#B9D3DE]">
            <img
              src={image_fundeducation}
              alt="Community members gathered"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1D95B8] flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#5C6B72]">
                    Impact to date
                  </p>
                  <p className="text-sm font-bold text-[#10202B]">
                    820+ lives directly transformed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Portfolios carousel */}
      <section className="py-20 px-6 bg-[#EAF6FA]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <SectionTag>Our Portfolios</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#10202B]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Programmes that change lives
            </h2>
          </div>
          <PortfolioCarousel onNav={go} />
        </div>
      </section>

      {/* Past Campaigns */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <SectionTag>Past Campaigns</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#10202B] mb-4"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Every campaign, one goal
            </h2>
            <p className="text-[#5C6B72] leading-relaxed">
              From marathon fundraisers to appreciation dinners,
              each initiative channeled support directly into
              our scholarship, water, and mentorship programmes.
            </p>
          </div>

          <div className="space-y-12">
            <article className="grid md:grid-cols-[380px_1fr] gap-8 items-center bg-[#EAF6FA]/40 p-6 md:p-8 rounded-3xl border border-[#D6E4EA] hover:border-[#1D95B8]/30 transition-all">
              <CampaignSlideshow
                images={[
                  marathon1,
                  marathon2,
                  marathon3,
                  marathon4,
                  marathon5,
                  marathon6,
                ]}
              />
              <div className="flex flex-col justify-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1D95B8] mb-2">
                  Fundraising Run · Boston
                </span>
                <h3
                  className="text-2xl md:text-3xl font-bold text-[#10202B] mb-4"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  Boston Marathon
                </h3>
                <p className="text-[#5C6B72] text-base leading-relaxed mb-6">
                  The founding Trustee, Wilson Wahome participated on
                  the Boston Marathon '26, taking on 26.2 miles to raise awareness and support
                  for Kenya's school going Kids. The continuous dedication of our
                  participants helps provide tuition support and expanded clean
                  water access across regional communities.
                </p>
                <div>
                  <button
                    onClick={() => go("scholarship")}
                    className="inline-flex items-center gap-2 text-[#1D95B8] font-bold text-sm hover:gap-3 transition-all"
                  >
                    Read Full Story <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>

            <article className="grid md:grid-cols-[380px_1fr] gap-8 items-center bg-[#EAF6FA]/40 p-6 md:p-8 rounded-3xl border border-[#D6E4EA] hover:border-[#1D95B8]/30 transition-all">
              <CampaignSlideshow
                images={[
                  "https://images.unsplash.com/photo-1644174547761-de211415598e?w=800&h=500&fit=crop&auto=format",
                  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=500&fit=crop&auto=format",
                  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=500&fit=crop&auto=format",
                ]}
              />
              <div className="flex flex-col justify-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1D95B8] mb-2">
                  Annual Appreciation Event
                </span>
                <h3
                  className="text-2xl md:text-3xl font-bold text-[#10202B] mb-4"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  Fundraiser Thank You Dinner
                </h3>
                <p className="text-[#5C6B72] text-base leading-relaxed mb-6">
                  An evening honoring our partners and donors in
                  the US Held in Boston to celebrate key milestones across
                  our scholarship  Mentorship cohorts and new well installations.
                </p>
                <div>
                  <button
                    onClick={() => go("about")}
                    className="inline-flex items-center gap-2 text-[#1D95B8] font-bold text-sm hover:gap-3 transition-all"
                  >
                    Read Full Story{" "}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Blog & News */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <SectionTag>Blog & News</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#10202B] mb-4"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Stories & updates
            </h2>
            <p className="text-[#5C6B72] leading-relaxed">
              Articles, videos, and press coverage on our
              operations, partnerships, and impact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {blogNewsItems.map((item, i) => (
              <MediaCard key={i} {...item} />
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        onDonate={onOpenDonate}
        onInvolve={() => go("mentorship")}
      />
    </div>
  );
}

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────

function AboutPage({ onNav }: { onNav: (p: Page) => void }) {
  const go = (p: Page) => {
    onNav(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div>
      <PageHero
        title="About Wahome Foundation"
        subtitle="Rooted in community. Driven by hope. Committed to Kenya's future."
        breadcrumb="About Us"
      />

      {/* History */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionTag>Our Story</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#10202B] mb-6"
              style={{
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Founded in 2006 with a single promise
            </h2>
            <p className="text-[#5C6B72] leading-relaxed mb-4">
              Wahome Foundation was established in Kiambu County
              to address a clear and urgent need: too many
              brilliant children were being left behind by
              poverty, lack of water, and absence of role
              models. From the beginning, our approach has been
              direct and transparent — get resources where they
              matter most.
            </p>
            <p className="text-[#5C6B72] leading-relaxed mb-4">
              Over nearly two decades, we have supported over
              500 students through full scholarships, drilled
              and commissioned more than 20 community boreholes,
              and staged annual prize-giving ceremonies that
              celebrate excellence and inspire hundreds more.
            </p>
            <p className="text-[#5C6B72] leading-relaxed">
              Every programme traces back to the legacy of
              Thomas D.K. Wahome — educator, community leader,
              and believer in the transformative power of
              opportunity.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=500&fit=crop&auto=format"
              alt="Community borehole project"
              className="rounded-2xl w-full h-64 object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=500&fit=crop&auto=format"
              alt="Students at school"
              className="rounded-2xl w-full h-64 object-cover mt-8"
            />
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 px-6 bg-[#EAF6FA]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <SectionTag>Our Approach</SectionTag>
            <h2
              className="font-serif text-3xl font-bold text-[#10202B]"
              style={{
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              How we create lasting change
            </h2>
          </div>
          <div className="bg-white rounded-2xl p-10 border border-[#D6E4EA]">
            <p className="text-[#5C6B72] leading-relaxed text-center">
              Lasting change starts with a child able to stay in
              school and a community with clean water to come
              home to. We select only the most deserving,
              academically bright students for our scholarships
              — carefully assessed so opportunity goes where it
              can do the most good — while Wells of Hope works
              alongside their families, bringing clean, reliable
              water closer to homes and schools. Education and
              wellbeing reinforce each other: an educated
              generation grows up in healthier, more resilient
              communities, and stronger communities are better
              placed to keep their children in school.
            </p>
          </div>
        </div>
      </section>

      {/* Our Board of Trustees */}
      <section className="py-20 px-6 bg-[#EAF6FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <SectionTag>Our Board of Trustees</SectionTag>
            <h2
              className="font-serif text-3xl font-bold text-[#10202B]"
              style={{
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              The people who guide our mission
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Wilson Kiriungi", role: "Chairperson" },
              {
                name: "James Wachira",
                role: "Vice Chairperson",
              },
              { name: "Name Pending", role: "Treasurer" },
              { name: "Name Pending", role: "Secretary" },
              { name: "Name Pending", role: "Board Member" },
            ].map((b) => (
              <div key={b.role} className="text-center">
                <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Users className="w-12 h-12 text-[#1D95B8]" />
                </div>
                <h3
                  className="font-bold text-[#10202B] font-serif text-lg"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {b.name}
                </h3>
                <p className="text-sm text-[#1D95B8] font-medium">
                  {b.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <SectionTag>Our Team</SectionTag>
            <h2
              className="font-serif text-3xl font-bold text-[#10202B]"
              style={{
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              The team behind our programmes
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Anne Wahome",
                role: "Executive Director",
                img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&auto=format",
              },
              {
                name: "James Mwangi",
                role: "Head of Programmes",
                img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&auto=format",
              },
              {
                name: "Grace Njoroge",
                role: "Fundraising Manager",
                img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&auto=format",
              },
            ].map((p) => (
              <div key={p.name} className="text-center">
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-[#EAF6FA]"
                />
                <h3
                  className="font-bold text-[#10202B] font-serif text-lg"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {p.name}
                </h3>
                <p className="text-sm text-[#1D95B8] font-medium">
                  {p.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Powered By */}
      <section className="py-16 px-6 bg-white border-t border-[#EAF6FA]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm uppercase tracking-wide text-[#5C6B72] mb-8">
            Powered by our partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {[
              "Autism Allies",
              "Tufaha Resort",
              "Laikipia height",
              "Prestige AFC",
              "Coffee Bench",
              "Sneakerama",
            ].map((partner) => (
              <span
                key={partner}
                className="text-[#5C6B72] font-semibold text-lg opacity-70 hover:opacity-100 transition-opacity"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        onDonate={() => go("scholarship")}
        onInvolve={() => go("mentorship")}
      />
    </div>
  );
}

// ─── WELLS OF HOPE PAGE ──────────────────────────────────────────────────────

function WellsPage({
  onNav,
  onOpenDonate,
}: {
  onNav: (p: Page) => void;
  onOpenDonate: () => void;
}) {
  const go = (p: Page) => {
    onNav(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div>
      <PageHero
        title="Wells of Hope"
        subtitle="Clean, reliable water for the communities that need it most."
        breadcrumb="Wells of Hope"
      />

      {/* Mission */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionTag>Why Water</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#10202B] mb-6"
              style={{
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Water is the foundation of everything
            </h2>
            <p className="text-[#5C6B72] leading-relaxed mb-4">
              In rural Kenya, children — particularly girls —
              spend hours each day walking to collect water.
              Every hour spent on that journey is an hour not
              spent in class. Clean water close to home means
              girls stay in school, mothers are healthier, and
              entire communities flourish.
            </p>
            <p className="text-[#5C6B72] leading-relaxed mb-6">
              Since 2008, Wells of Hope has drilled and
              commissioned over 20 boreholes serving thousands
              of people. Each well is community-managed with a
              local oversight committee trained by our team to
              ensure long-term sustainability.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: "5+", l: "Wells Completed" },
                { n: "1,000+", l: "People with Clean Water" },
                { n: "3 hrs", l: "Daily Walk Time Saved" },
                { n: "100%", l: "Community Managed" },
              ].map(({ n, l }) => (
                <div
                  key={l}
                  className="bg-[#EAF6FA] rounded-xl p-4"
                >
                  <div
                    className="text-2xl font-bold text-[#1D95B8]"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    {n}
                  </div>
                  <div className="text-xs text-[#5C6B72] mt-1">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden bg-[#B9D3DE] aspect-[4/3]">
            <img
              src={image_wells_of_hope}
              alt="Clean water well in Kenya"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <CTABanner
        onDonate={() => {}}
        onInvolve={() => go("mentorship")}
      />
    </div>
  );
}
// ─── SCHOLARSHIP PAGE ────────────────────────────────────────────────────────

function ScholarshipPage({
  onNav,
  onOpenDonate,
}: {
  onNav: (p: Page) => void;
  onOpenDonate: () => void;
}) {
  const go = (p: Page) => {
    onNav(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div>
      <PageHero
        title="Thomas D.K. Wahome Scholarship"
        subtitle="Full tuition, materials, and exam fees for exceptional students who dare to dream."
        breadcrumb="Scholarship"
      />

      {/* Overview */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionTag>About the Scholarship</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#10202B] mb-6"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Breaking financial barriers to education
            </h2>
            <p className="text-[#5C6B72] leading-relaxed mb-4">
              The Thomas D.K. Wahome Scholarship is our flagship
              programme, providing comprehensive financial
              support for academically gifted students from
              low-income households in Kiambu County and beyond.
            </p>
            <p className="text-[#5C6B72] leading-relaxed mb-6">
              Scholarship recipients receive full tuition cover,
              school supplies, examination fees, and ongoing
              pastoral support throughout their secondary
              education — giving them the freedom to focus
              entirely on learning.
            </p>
            <div className="space-y-3">
              {[
                "Full secondary school tuition coverage",
                "School uniforms and study materials",
                "National examination fee sponsorship",
                "Pastoral check-ins and mentorship pairing",
                "University application guidance",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-[#1D95B8] shrink-0" />
                  <span className="text-[#5C6B72] text-sm">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <img
              src={dkPhoto}
              alt="Scholarship students studying"
              className="rounded-3xl w-full h-80 object-cover object-center shadow-sm"
            />
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { n: "500+", l: "Total Scholars" },
                { n: "94%", l: "Completion Rate" },
                { n: "68%", l: "University Entry" },
              ].map(({ n, l }) => (
                <div
                  key={l}
                  className="bg-[#EAF6FA] rounded-xl p-4 text-center"
                >
                  <div
                    className="text-2xl font-bold text-[#1D95B8]"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    {n}
                  </div>
                  <div className="text-xs text-[#5C6B72] mt-1">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Scholars */}
      <section className="py-20 px-6 bg-[#EAF6FA]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionTag>Meet Our Scholars</SectionTag>
            <h2
              className="font-serif text-3xl font-bold text-[#10202B]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              The dreams your support makes possible
            </h2>
          </div>
          <div className="space-y-8">
            {[
              {
                name: "Alex Karani",
                meta: "Grade 10 · Active Scholar",
                message:
                  "The Foundation came at a defining time when I was uncertain of my future education, They helped me join High School and gave me hope of pursuing career in Agriculture Engineer. I am grateful to the Foundation for this opportunity. .",
                photo: alexPhoto,
                objectPosition: "object-[center_15%]",
              },
              {
                name: "Jedidah Watetu",
                meta: "Grade 10 · St Rita Kiaragana Girls",
                message:
                  "I got scholarship to join High School through the intervention of the Wahome Foundation, now I am in form 3 clearing Highschool next year. I am Aspiring to be a Doctor in the future. I am now able to chase my dreams thanks to the Wahome Foundation",
                photo: jedidahPhoto,
                objectPosition: "object-[center_15%]",
              },
              {
                name: "James Ndungu",
                meta: "Grade 10 · Endarasha Boys",
                message:
                  "The Wahome Foundation offered me the Thomas D.K Wahome scholarship which enabled me to join Endarasha Senior school. I aspire to be a neurosurgeon in future. ",
                photo: jamesPhoto,
                objectPosition: "object-[center_15%]",
              },
              {
                name: "Newton Njenga",
                meta: "Grade 10 · Kaheti Boys",
                message: "The foundation Helped me join Highschool and now I can fulfill my aspiration of Joining the army as a Cadet officer in the future.",
                photo: newtonPhoto,
                objectPosition: "object-[center_15%]",
              },
              {
                name: "Samuel Mutero",
                meta: "Grade 10 · Naromuru Boys",
                message: "I am truly Thankful to the Wahome Foundation for enabling me Join High school, their support have given me a chance to chase my dream of becoming a Biologist in the future.",
                photo: samuelPhoto,
                objectPosition: "object-[center_15%]",
              },
            ].map((s) => (
              <div
                key={s.name}
                className="flex flex-col sm:flex-row bg-white rounded-2xl border border-[#D6E4EA] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-full h-64 sm:w-60 sm:h-auto shrink-0 overflow-hidden bg-[#EAF6FA]">
                  <img
                    src={s.photo}
                    alt={s.name}
                    className={`w-full h-full object-cover ${s.objectPosition}`}
                  />
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <h3
                    className="font-bold text-[#10202B] font-serif text-xl mb-1"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    {s.name}
                  </h3>
                  <p className="text-sm text-[#1D95B8] font-medium mb-4">
                    {s.meta}
                  </p>
                  <p className="text-[#5C6B72] leading-relaxed">
                    {s.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        onDonate={onOpenDonate}
        onInvolve={() => go("mentorship")}
      />
    </div>
  );
}

// ─── PRIZE GIVING PAGE ────────────────────────────────────────────────────────

// ─── Gallery Carousel Helper ─────────────────────────────────────────────────

function GalleryCarousel({
  images,
}: {
  images: { src: string; caption: string }[];
}) {
  const [active, setActive] = useState(0);

  const prevSlide = () => {
    setActive((curr) =>
      curr === 0 ? images.length - 1 : curr - 1,
    );
  };

  const nextSlide = () => {
    setActive((curr) =>
      curr === images.length - 1 ? 0 : curr + 1,
    );
  };

  return (
    <div className="relative flex items-center justify-center max-w-4xl mx-auto">
      {/* Left Arrow Button */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous image"
        className="absolute -left-5 sm:-left-7 z-10 w-12 h-12 rounded-full bg-[#F4EFEA]/80 hover:bg-[#F4EFEA] text-[#10202B] flex items-center justify-center shadow-md transition-all hover:scale-105"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Main Image Container */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden bg-white shadow-xl border border-[#D6E4EA]">
        {images.map((item, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              idx === active
                ? "opacity-100 z-0"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <img
              src={item.src}
              alt={`Gallery image ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Subtle Gradient & Caption Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6 text-white text-sm font-medium">
              {item.caption}
            </div>
          </div>
        ))}
      </div>

      {/* Right Arrow Button */}
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next image"
        className="absolute -right-5 sm:-right-7 z-10 w-12 h-12 rounded-full bg-[#F4EFEA]/80 hover:bg-[#F4EFEA] text-[#10202B] flex items-center justify-center shadow-md transition-all hover:scale-105"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
function PrizePage({
  onNav,
  onOpenDonate,
}: {
  onNav: (p: Page) => void;
  onOpenDonate: () => void;
}) {
  const go = (p: Page) => {
    onNav(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <PageHero
        title="Prize Giving Day"
        subtitle="Celebrating academic excellence, resilience, and inspiring the next generation of Kenyan leaders."
        breadcrumb="Prize Giving"
      />

      {/* Main Overview */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionTag>Annual Celebration</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#10202B] mb-6"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Excellence deserves to be seen
            </h2>
            <p className="text-[#5C6B72] leading-relaxed mb-4">
              Every year, Wahome Foundation convenes hundreds of
              students, parents, teachers, and community leaders
              for our flagship Prize Giving Day, a vibrant
              ceremony that honours top academic performers
              across our partner schools.
            </p>
            <p className="text-[#5C6B72] leading-relaxed mb-6">
              More than an award ceremony, it is a community
              statement: that academic effort is valued, that
              hard work is recognized, and that excellence is
              possible regardless of a student's background.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { n: "19+", l: "Annual Ceremonies" },
                { n: "300+", l: "Scholars Recognized" },
                { n: "40+", l: "Partner Schools" },
              ].map(({ n, l }) => (
                <div
                  key={l}
                  className="bg-[#EAF6FA] rounded-xl p-4 text-center"
                >
                  <div
                    className="text-2xl font-bold text-[#1D95B8]"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    {n}
                  </div>
                  <div className="text-xs text-[#5C6B72] mt-1">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-lg bg-[#B9D3DE] aspect-[4/3]">
            <img
              src={image_DSC_0332}
              alt="Prize giving ceremony cheer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#10202B]/60 via-transparent to-transparent flex items-end p-6">
              <p className="text-white text-sm font-medium italic">
                “Celebrating the hard work and dedication of our
                brilliant students each year.”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Event Gallery Slider */}
      <section className="py-20 px-6 bg-[#EAF6FA]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#10202B] mb-4"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Our Gallery
            </h2>
            <p className="text-[#5C6B72] text-sm leading-relaxed">
              Explore images from our annual Prize Giving
              ceremonies, highlighting inspiring student
              achievements, proud families, and community
              celebrations across our regional partner schools.
            </p>
          </div>

          <GalleryCarousel
            images={[
              {
                src: image_Prizegiving_What_we_do,
                caption:
                  "Student winners receiving study materials and certificates.",
              },
              {
                src: image_DSC_0445,
                caption:
                  "Parents and teachers gathering to celebrate scholar success.",
              },
              {
                src: image_DSC_0332,
                caption:
                  "Community members cheering for the top performers of the year.",
              },
            ]}
          />
        </div>
      </section>

      {/* Upcoming Event Details */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <SectionTag>Save The Date</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#10202B]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Prize Giving Day 2027
            </h2>
          </div>

          <div className="bg-[#EAF6FA]/50 rounded-3xl p-8 md:p-12 border border-[#D6E4EA] shadow-sm grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-xl font-bold text-[#10202B] mb-6">
                Event Details
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Date",
                    value: "Saturday, 9 January 2027",
                  },
                  {
                    label: "Venue",
                    value:
                      "Mugumo Comprehensive School Grounds, Nanyuki",
                  },
                  {
                    label: "Time",
                    value: "10:00 AM – 4:00 PM EAT",
                  },
                  {
                    label: "Attendees",
                    value:
                      "Scholars, Guardians, Teachers, Donors & Community members",
                  },
                ].map((d) => (
                  <div
                    key={d.label}
                    className="flex gap-4 border-b border-[#D6E4EA]/60 pb-3"
                  >
                    <span className="text-sm font-semibold text-[#1D95B8] w-28 shrink-0">
                      {d.label}
                    </span>
                    <span className="text-sm text-[#5C6B72]">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={onOpenDonate}
                  className="px-6 py-3 rounded-xl bg-[#0EA5E9] text-white font-semibold text-sm hover:bg-[#0284C7] transition-colors"
                >
                  Become a Partner
                </button>
                <button
                  onClick={() => go("mentorship")}
                  className="px-6 py-3 rounded-xl border border-[#0EA5E9] text-[#0EA5E9] font-semibold text-sm hover:bg-[#0EA5E9]/10 transition-colors"
                >
                  Volunteer at Ceremony
                </button>
              </div>
            </div>

            <div className="bg-[#10202B] text-white p-8 rounded-2xl space-y-4">
              <Quote className="w-8 h-8 text-[#1D95B8]" />
              <p className="text-sm text-[#8FAFBC] leading-relaxed">
                “When a child stands on that stage in front of
                their entire community, something shifts inside
                them. They realize that their dreams are valid
                and achievable.”
              </p>
              <div className="border-t border-[#1C3241] pt-3">
                <p className="font-bold text-white text-sm">
                  Wilson Kiriungi
                </p>
                <p className="text-xs text-[#1D95B8]">
                  Chairperson, Board of Trustees
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        onDonate={onOpenDonate}
        onInvolve={() => go("mentorship")}
      />
    </div>
  );
}

// ─── MENTORSHIP PAGE ──────────────────────────────────────────────────────────

function MentorshipPage({
  onNav,
  onOpenDonate,
}: {
  onNav: (p: Page) => void;
  onOpenDonate: () => void;
}) {
  const go = (p: Page) => {
    onNav(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <PageHero
        title="Mentorship Programme"
        subtitle="Connecting skilled Kenyan professionals with U.S. employers for meaningful, fully remote work — no relocation required."
        breadcrumb="Mentorship"
      />

      {/* Intro */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionTag>Get Involved</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#10202B] mb-6"
              style={{
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Kenyan talent, working for the world
            </h2>
            <p className="text-[#5C6B72] leading-relaxed mb-4">
              Our programme connects skilled Kenyan
              professionals with employers in the United States,
              opening the door to meaningful remote work without
              requiring anyone to leave home.
            </p>
            <p className="text-[#5C6B72] leading-relaxed mb-6">
              Participants receive interview preparation and
              remote-work readiness support, then are matched
              with U.S.-based companies — for many, their first
              international employer.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Users,
                  label: "Skills Readiness",
                  desc: "Interview prep and remote-work training to get participants job-ready.",
                },
                {
                  icon: MapPin,
                  label: "Remote Placement",
                  desc: "Matched with U.S. companies for fully remote roles — no relocation needed.",
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="bg-[#EAF6FA] rounded-xl p-5 border border-[#D6E4EA]"
                >
                  <m.icon className="w-6 h-6 text-[#1D95B8] mb-2" />
                  <p className="font-bold text-[#10202B] text-sm mb-1">
                    {m.label}
                  </p>
                  <p className="text-xs text-[#5C6B72]">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden bg-[#B9D3DE] aspect-[4/3]">
            <img
              src={image_mentorship_1}
              alt="Mentor and student working together"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Mentors / Protégés */}
      <section className="py-20 px-6 bg-[#EAF6FA]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SectionTag>Our Protégé</SectionTag>
            <h2
              className="font-serif text-3xl font-bold text-[#10202B]"
              style={{
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Kenyan professionals, working remotely
            </h2>
          </div>

          <div className="space-y-16">
            {[
              {
                name: "Cynthia Wachira",
                role: "Accountant",
                quote:
                  "Empowering Kenyan professionals with practical financial skills and remote career opportunities. Cynthia has been instrumental in helping local talents navigate global financial standards and remote work expectations.",
                img: cynthiaPhoto,
              },
              {
                name: "George Nganga",
                role: "Remote IT Specialist",
                quote:
                  "I work remotely from Kenya for a U.S. company thanks to the Wahome Foundation for making my dream come true. I am deeply grateful for their mentorship, which bridged the gap between my technical skills and international remote career opportunities. This program truly proves that Kenyan talent is resourceful and can thrive on the global stage without leaving home! Viva Wahome Foundation!",
                img: georgePhoto,
              },
            ].map((m) => (
              <div
                key={m.name}
                className="grid md:grid-cols-[280px_1fr] gap-8 items-start bg-white p-6 rounded-2xl border border-[#D6E4EA] shadow-sm"
              >
                {/* Portrait Image Container */}
                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#B9D3DE]">
                  <img
                    src={m.img}
                    alt={m.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Profile Details */}
                <div className="pt-2">
                  <p className="text-xs uppercase tracking-wider font-semibold text-[#1D95B8] mb-1">
                    {m.role}
                  </p>
                  <h3 className="text-2xl font-bold text-[#10202B] mb-4">
                    {m.name}
                  </h3>
                  <p className="text-[#5C6B72] leading-relaxed italic text-[20px]">
                    “{m.quote}”
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        onDonate={onOpenDonate}
        onInvolve={() => go("scholarship")}
      />
    </div>
  );
}

type MediaItem = {
  type: "article" | "video" | "link";
  title: string;
  excerpt: string;
  image: string;
  url?: string;
  videoEmbedUrl?: string;
};

const blogNewsItems: MediaItem[] = [
  {
    type: "video",
    title:
      "Wahome Foundation Supports Primary School Learners in Laikipia County",
    excerpt:
      "KBC Channel 1 news coverage on how our school feeding program is helping primary school learners stay in class in Laikipia County.",
    image:
      "https://img.youtube.com/vi/8zWCP9I1B6U/hqdefault.jpg",
    videoEmbedUrl: "https://www.youtube.com/embed/8zWCP9I1B6U",
  },
  {
    type: "article",
    title: "Running with Purpose",
    excerpt:
      "Worcester State alumnus Wilson Kiriungi '10 completed the Boston Marathon to champion Kenya and raise scholarship funds through the Wahome Foundation.",
    image:
      "https://webcdn.worcester.edu/magazine/wp-content/uploads/sites/71/2026/06/IMG_0862-scaled.jpg.optimal.jpg",
    url: "https://www.worcester.edu/magazine/2026/06/30/running-with-purpose/",
  },
];

// ─── MEDIA ────────────────────────────────────────────────────
function MediaCard({
  type,
  title,
  excerpt,
  image,
  url,
  videoEmbedUrl,
}: MediaItem) {
  const [isPlaying, setIsPlaying] = useState(false);

  const typeMeta = {
    article: { label: "Article", icon: FileText },
    video: { label: "Video", icon: PlayCircle },
    link: { label: "Link", icon: ExternalLink },
  }[type];

  const TypeIcon = typeMeta.icon;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EAF6FA]">
      <div className="relative aspect-[3/2] bg-[#EAF6FA]">
        {type === "video" && isPlaying ? (
          <iframe
            src={videoEmbedUrl}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
            {type === "video" && (
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                <PlayCircle className="w-14 h-14 text-white" />
              </button>
            )}
          </>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1D95B8] mb-2">
          <TypeIcon className="w-3.5 h-3.5" />
          {typeMeta.label}
        </div>
        <h3 className="font-semibold text-[#10202B] mb-2">
          {title}
        </h3>
        <p className="text-sm text-[#5C6B72] leading-relaxed mb-4">
          {excerpt}
        </p>
        {type !== "video" && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#1D95B8] hover:text-[#10202B] transition-colors"
          >
            {type === "article" ? "Read More" : "Visit Link"}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── FLOATING DONATE WIDGET ────────────────────────────────────────────────────

function FloatingDonateButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 px-6 py-4 rounded-full bg-[#0EA5E9] text-white font-semibold text-base shadow-xl hover:bg-[#0284C7] transition-all duration-150 flex items-center gap-2 hover:scale-105"
    >
      <Heart className="w-5 h-5 fill-white" />
      Donate Now
    </button>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  const openDonate = () => setIsDonateOpen(true);
  const closeDonate = () => setIsDonateOpen(false);

  const pages: Record<Page, React.ReactNode> = {
    home: (
      <HomePage onNav={setPage} onOpenDonate={openDonate} />
    ),
    about: (
      <AboutPage onNav={setPage} onOpenDonate={openDonate} />
    ),
    scholarship: (
      <ScholarshipPage
        onNav={setPage}
        onOpenDonate={openDonate}
      />
    ),
    wells: (
      <WellsPage onNav={setPage} onOpenDonate={openDonate} />
    ),
    prize: (
      <PrizePage onNav={setPage} onOpenDonate={openDonate} />
    ),
    mentorship: (
      <MentorshipPage
        onNav={setPage}
        onOpenDonate={openDonate}
      />
    ),
  };

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <Navbar
        current={page}
        onNav={setPage}
        onOpenDonate={openDonate}
      />
      <main>{pages[page]}</main>
      <Footer onNav={setPage} onOpenDonate={openDonate} />
      <FloatingDonateButton onClick={openDonate} />
      <DonateModal
        isOpen={isDonateOpen}
        onClose={closeDonate}
      />
    </div>
  );
}