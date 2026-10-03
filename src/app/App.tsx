import wahomeSlideshow from "@/imports/wahome_foundation_slideshow.mp4";
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
import thomasPhoto from "@/imports/thomas.jpg";
import wellsPhoto from "@/imports/wells.jpg";
import mentorshipPhoto from "@/imports/mentorship.jpg";
import dkPhoto from "@/imports/dk.jpg";
import cynthiaPhoto from "@/imports/cynthia.jpeg";
import georgePhoto from "@/imports/george.jpg";
import mainLogo from "@/imports/mainlogo.png";
import marathon1 from "@/imports/marathon1.jpg";
import marathon2 from "@/imports/marathon2.jpg";
import marathon3 from "@/imports/marathon3.jpg";
import marathon4 from "@/imports/marathon4.jpg";
import marathon5 from "@/imports/marathon5.jpg";
import marathon6 from "@/imports/marathon6.jpg";

// Corrected Partner Logos Imports (Exact file names)
import logoAutismAllies from "@/imports/autismallies.PNG";
import logoCoffeeBench from "@/imports/Coffeebench.png";
import logoLaikipiaHeights from "@/imports/laikipiaheights.PNG";
import logoLuxo from "@/imports/Luxo.png";
import logoLioness from "@/imports/lioness.png"; // Fixed lowercase l
import logoPrestigeAFC from "@/imports/prestigeafc.PNG";
import logoSneakerama from "@/imports/sneakerama.PNG";
import logoTufahaResort from "@/imports/tufaharesort.PNG";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';



// Utility function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

import {
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Heart,
  Users,
  ArrowRight,
  Quote,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  CheckCircle,
  FileText,
  PlayCircle,
  ExternalLink,
  Handshake,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

type Page =
  | "home"
  | "about"
  | "scholarship"
  | "wells"
  | "prize"
  | "mentorship";

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase text-[#2C6E9E] mb-3">
      {children}
    </span>
  );
}

// ─── CAMPAIGN SLIDESHOW ───────────────────────────────────────────────────────

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
      className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden bg-[#D7E0E8] shadow-md`}
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

// ─── DONATION MODAL ───────────────────────────────────────────────────────────

function DonateModal({
  isOpen,
  onClose,
  initialAmount,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialAmount?: number;
}) {
  const [currency, setCurrency] = useState<"USD" | "KES">("USD");
  const [amount, setAmount] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [frequency] = useState("One time");
  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "mpesa" | "paybill" | "paypal"
  >("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen && initialAmount) setAmount(String(initialAmount));
  }, [isOpen, initialAmount]);

  if (!isOpen) return null;

  const currencySymbol = currency === "USD" ? "$" : "KSh ";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 border border-[#DDE3E8]">
        <div className="bg-[#1F3A52] px-6 py-5 text-white flex items-center justify-between">
          <h2
            className="font-bold text-lg"
            style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
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
            <div className="w-16 h-16 bg-[#F1F4F7] text-[#2C6E9E] rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-[#1F3A52]">
              Thank you for your generosity!
            </h3>
            <p className="text-[#5B6670] text-sm max-w-md mx-auto">
              {paymentMethod === "mpesa"
                ? `An M-Pesa payment prompt has been sent to ${mpesaPhone || "your phone"}. Please enter your PIN to complete the contribution.`
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
              className="mt-4 px-6 py-3 bg-[#2C6E9E] text-white font-semibold rounded-xl hover:bg-[#16324A] transition-colors"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-[#1F3A52]">
                  How much would you like to contribute today?
                </h3>
                <div className="flex items-center bg-[#F1F4F7] p-1 rounded-xl border border-[#DDE3E8]">
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      currency === "USD"
                        ? "bg-[#2C6E9E] text-white shadow-sm"
                        : "text-[#5B6670] hover:text-[#1F3A52]"
                    }`}
                  >
                    US$
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("KES")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      currency === "KES"
                        ? "bg-[#2C6E9E] text-white shadow-sm"
                        : "text-[#5B6670] hover:text-[#1F3A52]"
                    }`}
                  >
                    KSh
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#5B6670] mb-4">
                All contributions directly impact our students and help us further our mission.
              </p>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#5B6670]">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  required
                  placeholder={`Enter amount in ${currency}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-[#DDE3E8] text-sm font-semibold focus:outline-none focus:border-[#2C6E9E] text-[#1F3A52]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-base text-[#1F3A52]">Who&apos;s Giving Today?</h3>
              <p className="text-xs text-[#5B6670]">We&apos;ll never share this information with anyone.</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F3A52] mb-1">
                    First name *
                  </label>
                  <input
                    required
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3E8] text-sm focus:outline-none focus:border-[#2C6E9E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F3A52] mb-1">
                    Last name (Optional)
                  </label>
                  <input
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3E8] text-sm focus:outline-none focus:border-[#2C6E9E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F3A52] mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3E8] text-sm focus:outline-none focus:border-[#2C6E9E]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-base text-[#1F3A52]">Payment Details</h3>

              <div className="space-y-2">
                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "mpesa"
                      ? "border-[#2C6E9E] bg-[#F1F4F7]/40 ring-1 ring-[#2C6E9E]"
                      : "border-[#DDE3E8]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "mpesa"}
                      onChange={() => setPaymentMethod("mpesa")}
                      className="accent-[#2C6E9E]"
                    />
                    <span className="text-sm font-semibold text-[#1F3A52]">
                      M-Pesa Express (STK Push)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#2E8FCB] bg-[#EAF2F8] px-2 py-0.5 rounded-md">
                    M-PESA
                  </span>
                </label>

                {paymentMethod === "mpesa" && (
                  <div className="p-4 bg-[#F1F4F7]/60 rounded-xl border border-[#DDE3E8] space-y-2">
                    <label className="block text-xs font-semibold text-[#1F3A52]">
                      M-Pesa Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0712345678 or 254712345678"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#DDE3E8] text-sm bg-white focus:outline-none focus:border-[#2C6E9E]"
                    />
                    <p className="text-[11px] text-[#5B6670]">
                      An instant STK push prompt will be sent directly to your phone.
                    </p>
                  </div>
                )}

                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "paybill"
                      ? "border-[#2E8FCB] bg-[#EAF2F8]/40 ring-1 ring-[#2E8FCB]"
                      : "border-[#DDE3E8]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "paybill"}
                      onChange={() => setPaymentMethod("paybill")}
                      className="accent-[#2E8FCB]"
                    />
                    <span className="text-sm font-semibold text-[#1F3A52]">Pay via Paybill</span>
                  </div>
                  <span className="text-xs font-bold text-[#2E8FCB] bg-[#EAF2F8] px-2 py-0.5 rounded-md">
                    PAYBILL
                  </span>
                </label>

                {paymentMethod === "paybill" && (
                  <div className="p-4 bg-white rounded-xl border border-[#2E8FCB]/30 shadow-sm space-y-3">
                    <div className="bg-[#2E8FCB] text-white p-3.5 rounded-lg flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-2">
                        <span className="bg-white text-[#2E8FCB] text-xs font-extrabold px-2 py-1 rounded">
                          LIPA NA M-PESA
                        </span>
                        <span className="font-bold text-sm tracking-wide">PAYBILL</span>
                      </div>
                      <span className="text-xs font-medium opacity-90">Business No: 123456</span>
                    </div>

                    <div className="bg-[#F1F7FB] p-3.5 rounded-lg border border-[#E3ECF2] text-xs space-y-2">
                      <div className="flex justify-between border-b border-[#D6E4EC] pb-1.5">
                        <span className="text-[#5B6670]">Paybill Business No:</span>
                        <strong className="text-[#1F3A52] font-bold text-sm">123456</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5B6670]">Account Number:</span>
                        <strong className="text-[#1F3A52] font-bold text-sm">
                          {`${firstName} ${lastName}`.trim() || "Your Name"}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "card"
                      ? "border-[#2C6E9E] bg-[#F1F4F7]/40 ring-1 ring-[#2C6E9E]"
                      : "border-[#DDE3E8]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="accent-[#2C6E9E]"
                    />
                    <span className="text-sm font-semibold text-[#1F3A52]">Credit / Debit Card</span>
                  </div>
                  <span className="text-xs text-[#5B6670]">Visa / Mastercard</span>
                </label>

                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "paypal"
                      ? "border-[#2C6E9E] bg-[#F1F4F7]/40 ring-1 ring-[#2C6E9E]"
                      : "border-[#DDE3E8]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "paypal"}
                      onChange={() => setPaymentMethod("paypal")}
                      className="accent-[#2C6E9E]"
                    />
                    <span className="text-sm font-semibold text-[#1F3A52]">PayPal</span>
                  </div>
                  <span className="text-xs text-[#003087] font-bold">PayPal</span>
                </label>
              </div>

              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2 text-sm">
                <div className="flex justify-between text-[#5B6670]">
                  <span>Payment Amount</span>
                  <span className="font-semibold text-[#1F3A52]">
                    {currencySymbol}
                    {amount || "0"}
                  </span>
                </div>
                <div className="flex justify-between text-[#5B6670]">
                  <span>Giving Frequency</span>
                  <span className="font-semibold text-[#1F3A52]">{frequency}</span>
                </div>
                <div className="border-t border-[#E2E8F0] pt-2 flex justify-between font-bold text-[#1F3A52]">
                  <span>Support Total</span>
                  <span className="text-[#2C6E9E]">
                    {currencySymbol}
                    {amount || "0"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-[#16324A] hover:bg-[#1A3A52] text-white font-bold text-base transition-colors shadow-md"
            >
              Make An Impact ({currencySymbol}
              {amount || "0"})
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── FLOATING SPLIT PILL NAVBAR ────────────────────

interface NavbarProps {
  current: Page;
  onNav: (p: Page) => void;
  onOpenDonate: (amount?: number) => void;
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
  const headerRef = useRef<HTMLElement>(null);
  const programmeButtonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [programmesOpen, setProgrammesOpen] = useState(false);
  const [scholarsOpen, setScholarsOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const programmes = navLinks.filter(link => !["home", "about", "scholarship", "prize"].includes(link.page));
  const programmeActive = programmes.some(link => link.page === current);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (headerRef.current?.querySelector("#programme-menu")) programmeButtonRef.current?.focus();
        setOpen(false); setProgrammesOpen(false); setScholarsOpen(false); setEventsOpen(false);
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) { setOpen(false); setProgrammesOpen(false); setScholarsOpen(false); setEventsOpen(false); }
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("pointerdown", closeOutside);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("pointerdown", closeOutside);
    };
  }, []);
  const go = (page: Page) => { onNav(page); setOpen(false); setProgrammesOpen(false); setScholarsOpen(false); setEventsOpen(false); };
  const goToSection = (page: Page, id: string) => {
    go(page);
    let attempts = 0;
    const scrollToTarget = () => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (attempts++ < 12) window.setTimeout(scrollToTarget, 50);
    };
    window.setTimeout(scrollToTarget, 80);
  };
  return (
    <header ref={headerRef} className="site-header">
      <div className="header-inner">
        <button className="brand" onClick={() => go("home")} aria-label="Wahome Foundation home"><img src={mainLogo} alt="Wahome Foundation" /></button>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button onClick={() => go("home")} aria-current={current === "home" ? "page" : undefined}>Home</button>
          <button onClick={() => go("about")} aria-current={current === "about" ? "page" : undefined}>Who we are</button>
          <div className="programme-nav" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setProgrammesOpen(false); }}>
            <button ref={programmeButtonRef} aria-expanded={programmesOpen} data-active={programmeActive} aria-controls="programme-menu" onClick={() => { setProgrammesOpen(!programmesOpen); setScholarsOpen(false); setEventsOpen(false); }}>Our programmes <ChevronRight size={13} className={programmesOpen ? "chevron-open" : "chevron-down"} /></button>
            {programmesOpen && <div id="programme-menu" className="programme-dropdown">{programmes.map(link => <button key={link.page} onClick={() => go(link.page)} aria-current={current === link.page ? "page" : undefined}>{link.label}<ArrowRight size={15} /></button>)}</div>}
          </div>
          <div className="programme-nav" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setScholarsOpen(false); }}>
            <button aria-expanded={scholarsOpen} data-active={current === "scholarship"} aria-controls="scholarship-menu" onClick={() => { setScholarsOpen(!scholarsOpen); setProgrammesOpen(false); setEventsOpen(false); }}>Scholarships <ChevronRight size={13} className={scholarsOpen ? "chevron-open" : "chevron-down"} /></button>
            {scholarsOpen && <div id="scholarship-menu" className="programme-dropdown"><button onClick={() => goToSection("scholarship", "meet-our-scholars")} aria-current={current === "scholarship" ? "page" : undefined}>Meet Our Scholars <ArrowRight size={15} /></button></div>}
          </div>
          <div className="programme-nav" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setEventsOpen(false); }}>
            <button aria-expanded={eventsOpen} data-active={current === "prize"} aria-controls="events-menu" onClick={() => { setEventsOpen(!eventsOpen); setProgrammesOpen(false); setScholarsOpen(false); }}>Community & events <ChevronRight size={13} className={eventsOpen ? "chevron-open" : "chevron-down"} /></button>
            {eventsOpen && <div id="events-menu" className="programme-dropdown"><button onClick={() => goToSection("prize", "save-the-date")} aria-current={current === "prize" ? "page" : undefined}>Save The Date <ArrowRight size={15} /></button></div>}
          </div>
        </nav>
        <div className="header-actions">
          <button className="button button-dark header-donate" onClick={() => { setOpen(false); setProgrammesOpen(false); onOpenDonate(); }}>Make a change <Heart size={15} /></button>
          <button className="menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">{navLinks.map(link => <button key={link.page} onClick={() => go(link.page)} aria-current={current === link.page ? "page" : undefined}>{link.label}<ArrowRight size={16} /></button>)}</nav>}
    </header>
  );
}

// ─── PAGE HERO COMPONENT ──────────────────────────────────────────────────────

function PageHero({
  title,
  subtitle,
  breadcrumb,
}: {
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
}) {
  // Returning null strips the sub-banner section across all pages
  return null;
}

// ─── FOOTER ─────────────────────────────────────────────────

function Footer({ onNav, onOpenDonate }: { onNav: (p: Page) => void; onOpenDonate: (amount?: number) => void }) {
  return <footer className="site-footer">
    <div className="layout footer-grid">
      <div className="footer-intro">
        <div className="footer-brand-row">
          <button className="footer-brand" onClick={() => onNav("home")} aria-label="Wahome Foundation home"><img src={mainLogo} alt="Wahome Foundation" /></button>
          <div className="footer-social">
            <a href="#" aria-label="Facebook"><Facebook size={16} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={16} /></a>
            <a href="#" aria-label="YouTube"><Youtube size={16} /></a>
          </div>
        </div>
        <a className="footer-email" href="mailto:info@wahomefoundation.com"><Mail size={14} /> info@wahomefoundation.com</a>
        <button className="footer-support" onClick={() => onOpenDonate()}>Support our work <ArrowRight size={17} /></button>
      </div>
      <div className="footer-offices-group">
        <div className="footer-office"><h3>Kenya</h3><address><MapPin size={14} /> 69 Haile Salasie Road<br />Nanyuki</address></div>
        <div className="footer-office"><h3>United States</h3><address><MapPin size={14} /> 560 Boston Turnpike<br />Shrewsbury, Massachusetts</address></div>
      </div>
    </div>
    <div className="layout footer-bottom"><span>© {new Date().getFullYear()} Wahome Foundation</span></div>
  </footer>;
}

// ─── PORTFOLIO CAROUSEL ───────────────────────────────────────────────────────

const portfolioItems = [
  {
    id: "01",
    tag: "OUR PORTFOLIOS",
    title: "Thomas D.K. Wahome Scholarship",
    category: "EDUCATION & TUITION",
    description:
      "Providing full tuition, learning materials, and exam fee coverage for exceptional students who dare to dream across Kenya.",
    image: thomasPhoto,
    page: "scholarship" as Page,
    btnText: "EXPLORE SCHOLARSHIP",
  },
  {
    id: "02",
    tag: "OUR PORTFOLIOS",
    title: "Wells of Hope Water Project",
    category: "CLEAN WATER & SANITATION",
    description:
      "Clean, reliable water access transforming community health, sanitation, and regional economic stability in dryland areas.",
    image: wellsPhoto,
    page: "wells" as Page,
    btnText: "EXPLORE WATER PROGRAMME",
  },
  {
    id: "03",
    tag: "OUR PORTFOLIOS",
    title: "Youth Mentorship Programme",
    category: "REMOTE CAREERS & GUIDANCE",
    description:
      "Connecting promising students with professionals across Kenya and the diaspora for career guidance and global remote job placement.",
    image: mentorshipPhoto,
    page: "mentorship" as Page,
    btnText: "DISCOVER MENTORSHIP",
  },
];

function PortfolioCarousel({ onNav }: { onNav: (p: Page) => void }) {
  const [active, setActive] = useState(0);
  const isHovered = useRef(false);

  const prevSlide = () => {
    setActive((curr: number) => (curr === 0 ? portfolioItems.length - 1 : curr - 1));
  };

  const nextSlide = () => {
    setActive((curr: number) => (curr === portfolioItems.length - 1 ? 0 : curr + 1));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHovered.current) {
        setActive((curr: number) => (curr === portfolioItems.length - 1 ? 0 : curr + 1));
      }
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const currentItem = portfolioItems[active];

  return (
    <div
      onMouseEnter={() => (isHovered.current = true)}
      onMouseLeave={() => (isHovered.current = false)}
      className="relative max-w-6xl mx-auto py-2 px-4 select-none overflow-hidden"
    >
      <div className="relative h-[280px] sm:h-[320px] flex items-center justify-center perspective-[1000px]">
        <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
          {portfolioItems.map((item, idx) => {
            const total = portfolioItems.length;
            let offset = (idx - active + total) % total;
            if (offset > total / 2) offset -= total;

            const isCenter = offset === 0;
            const translateX = offset * 210;
            const translateZ = Math.abs(offset) * -110;
            const rotateY = offset * -18;
            const scale = isCenter ? 1.05 : 0.82;
            const opacity = isCenter ? 1 : Math.abs(offset) === 1 ? 0.65 : 0.25;

            return (
              <div
                key={item.id}
                onClick={() => setActive(idx)}
                style={{
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex: isCenter ? 30 : 20 - Math.abs(offset),
                }}
                className={`absolute w-52 sm:w-64 h-64 sm:h-72 rounded-2xl overflow-hidden cursor-pointer transition-all duration-700 ease-out shadow-xl border-2 ${
                  isCenter
                    ? "border-[#2C6E9E] ring-4 ring-[#2C6E9E]/20 shadow-[#2C6E9E]/20"
                    : "border-white/80 grayscale"
                }`}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 flex flex-col justify-end text-white">
                  <span className="text-[10px] font-extrabold tracking-widest text-[#B9C9D6] uppercase mb-0.5">
                    {item.category}
                  </span>
                  <h4 className="font-serif text-xs sm:text-sm font-bold line-clamp-2">
                    {item.title}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 text-center max-w-xl mx-auto space-y-2">
        <div className="text-[11px] font-serif font-bold tracking-widest text-[#5B6670]">
          {currentItem.id} <span className="opacity-40">/ 0{portfolioItems.length}</span>
        </div>

        <h3
          className="font-serif text-xl sm:text-2xl font-bold text-[#1F3A52] leading-tight"
          style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
        >
          {currentItem.title}
        </h3>
        <p className="text-xs text-[#5B6670] leading-relaxed max-w-md mx-auto line-clamp-2">
          {currentItem.description}
        </p>

        <div className="pt-2 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous card"
            className="w-9 h-9 rounded-full bg-white border border-[#DDE3E8] text-[#1F3A52] flex items-center justify-center hover:border-[#2C6E9E] hover:text-[#2C6E9E] transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNav(currentItem.page)}
            className="px-6 py-2.5 rounded-full bg-[#16324A] hover:bg-[#1A3A52] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md hover:scale-105"
          >
            {currentItem.btnText}
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next card"
            className="w-9 h-9 rounded-full bg-white border border-[#DDE3E8] text-[#1F3A52] flex items-center justify-center hover:border-[#2C6E9E] hover:text-[#2C6E9E] transition-all shadow-sm active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PAST CAMPAIGN SHOWCASE DATA ─────────────────────────────────────────────

function PastCampaignsShowcase({ onNav }: { onNav: (p: Page) => void }) {
  return (
    <div className="relative max-w-6xl mx-auto px-2 select-none">
      <div className="grid lg:grid-cols-2 gap-4 items-stretch">
        <div className="bg-[#F1F4F7]/50 rounded-2xl p-3 border border-[#DDE3E8] shadow-sm grid grid-cols-12 gap-3 items-center hover:border-[#2C6E9E]/40 transition-all">
          <div className="col-span-5 relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#D7E0E8] shadow-sm">
            <CampaignSlideshow
              images={[
                marathon1,
                marathon2,
                marathon3,
                marathon4,
                marathon5,
                marathon6,
              ]}
              aspectClass="aspect-[3/4]"
            />
          </div>

          <div className="col-span-7 flex flex-col justify-between h-full py-1 text-left">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-extrabold tracking-widest text-[#2C6E9E] uppercase truncate">
                  BOSTON RUN
                </span>
                <span className="text-[10px] font-serif font-bold text-[#5B6670]">
                  01/02
                </span>
              </div>

              <h3
                className="font-serif text-base font-bold text-[#1F3A52] leading-tight mb-0.5"
                style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
              >
                Boston Marathon
              </h3>
              <p className="text-[11px] font-semibold text-[#2C6E9E] mb-1.5">
                26.2 Miles for Kenya
              </p>

              <p className="text-[11px] text-[#5B6670] leading-snug line-clamp-3">
                Founding Trustee Wilson Wahome ran the Boston Marathon to raise tuition funds and expand clean water access across regional schools.
              </p>
            </div>

            <div className="pt-2 border-t border-[#DDE3E8]/80 mt-2">
              <button
                type="button"
                onClick={() => onNav("scholarship")}
                className="inline-flex items-center gap-1.5 text-[#2C6E9E] font-bold text-[10px] uppercase tracking-wider hover:gap-2 transition-all"
              >
                Read Full Story <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#F1F4F7]/50 rounded-2xl p-3 border border-[#DDE3E8] shadow-sm grid grid-cols-12 gap-3 items-center hover:border-[#2C6E9E]/40 transition-all">
          <div className="col-span-5 relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#D7E0E8] shadow-sm">
            <CampaignSlideshow
              images={[
                "https://images.unsplash.com/photo-1644174547761-de211415598e?w=800&h=1000&fit=crop&auto=format",
                "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=1000&fit=crop&auto=format",
                "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=1000&fit=crop&auto=format",
              ]}
              aspectClass="aspect-[3/4]"
            />
          </div>

          <div className="col-span-7 flex flex-col justify-between h-full py-1 text-left">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-extrabold tracking-widest text-[#2C6E9E] uppercase truncate">
                  THANK YOU DINNER
                </span>
                <span className="text-[10px] font-serif font-bold text-[#5B6670]">
                  02/02
                </span>
              </div>

              <h3
                className="font-serif text-base font-bold text-[#1F3A52] leading-tight mb-0.5"
                style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
              >
                Thank You Dinner
              </h3>
              <p className="text-[11px] font-semibold text-[#2C6E9E] mb-1.5">
                Celebrating Donor Impact
              </p>

              <p className="text-[11px] text-[#5B6670] leading-snug line-clamp-3">
                An evening in Boston honoring U.S. partners and donors, celebrating milestones in scholarship distributions, mentorship, and new water wells.
              </p>
            </div>

            <div className="pt-2 border-t border-[#DDE3E8]/80 mt-2">
              <button
                type="button"
                onClick={() => onNav("about")}
                className="inline-flex items-center gap-1.5 text-[#2C6E9E] font-bold text-[10px] uppercase tracking-wider hover:gap-2 transition-all"
              >
                Read Full Story <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VIBRANT PRIZE GIVING EVENT BANNER ───────────────────────────────────────

function PrizeGivingBanner({
  onNav,
  onOpenDonate,
}: {
  onNav: (p: Page) => void;
  onOpenDonate: (amount?: number) => void;
}) {
  return (
    <section className="py-16 px-6 bg-[#F1F4F7]">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-[#1F3A52] text-white p-6 sm:p-10 border border-[#1E3F58] shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#16324A]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#2C6E9E]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 relative group rounded-2xl overflow-hidden shadow-xl aspect-[4/3] bg-[#162B38]">
              <img
                src={image_DSC_0332}
                alt="Prize Giving Day Celebrations"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F3A52]/90 via-transparent to-black/20" />
              
              <div className="absolute top-4 left-4 bg-[#16324A] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg border border-white/20">
                Annual Flagship Event
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs text-white/90 font-medium italic drop-shadow">
                  “Honoring academic effort & inspiring future leaders across Kenya.”
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between text-left space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#B9C9D6] animate-pulse" />
                  <span className="text-xs font-extrabold tracking-widest text-[#B9C9D6] uppercase">
                    SAVE THE DATE · 2027
                  </span>
                </div>

                <h2
                  className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight mb-3"
                  style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
                >
                  Prize Giving Day 2027
                </h2>

                <p className="text-xs sm:text-sm text-[#C3CBD1] leading-relaxed">
                  Every year, Wahome Foundation convenes hundreds of students, parents, and community leaders to honor academic excellence and reward top performers across regional partner schools.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2C6E9E]/20 flex items-center justify-center shrink-0 text-[#B9C9D6] text-sm">
                    📅
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-[#C3CBD1] uppercase tracking-wider">
                      Date & Time
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Sat, 9 Jan 2027 · 10:00 AM
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2C6E9E]/20 flex items-center justify-center shrink-0 text-[#B9C9D6] text-sm">
                    📍
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-[#C3CBD1] uppercase tracking-wider">
                      Venue
                    </span>
                    <span className="text-xs font-semibold text-white line-clamp-1">
                      Mugumo Comprehensive, Nanyuki
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNav("prize")}
                  className="px-6 py-3 rounded-full bg-[#16324A] hover:bg-[#1A3A52] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:scale-105"
                >
                  Learn More About Ceremony
                </button>

                <button
                  type="button"
                  onClick={onOpenDonate}
                  className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider backdrop-blur border border-white/20 transition-all"
                >
                  Partner With Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}




// ─── MEDIA ITEM DATA & CARD ───────────────────────────────────────────────────

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
    title: "Wahome Foundation Supports Primary School Learners in Laikipia County",
    excerpt:
      "KBC Channel 1 news coverage on how our school feeding program is helping primary school learners stay in class in Laikipia County.",
    image: "https://img.youtube.com/vi/8zWCP9I1B6U/hqdefault.jpg",
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
  {
    type: "article",
    title: "Thank You Dinner",
    excerpt:
      "An evening honoring U.S. partners and donors, celebrating milestones in scholarship distributions, mentorship, and new water wells.",
    image: image_DSC_0445,
  },
];

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
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F1F4F7]">
      <div className="relative aspect-[16/10] bg-[#F1F4F7]">
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
            <img src={image} alt={title} className="w-full h-full object-cover" />
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
      <div className="p-4 text-left">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2C6E9E] mb-1.5">
          <TypeIcon className="w-3.5 h-3.5" />
          {typeMeta.label}
        </div>
        <h3 className="font-semibold text-sm text-[#1F3A52] mb-1.5">{title}</h3>
        <p className="text-xs text-[#5B6670] leading-relaxed mb-3">{excerpt}</p>
        {type !== "video" && url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#2C6E9E] hover:text-[#1F3A52] transition-colors"
          >
            {type === "article" ? "Read More" : "Visit Link"}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── HERO STORY CTA ──────────────────────────────────────────────────────────

function HeroStoryCTA({ onNav }: { onNav: (page: Page) => void }) {
  return (
    <div className="hero-donate-card" style={{ minHeight: 350, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <span className="eyebrow">Our story</span>
      <h3>Get to know Wahome Foundation</h3>
      <p>Learn about the people, purpose, and community behind our work.</p>
      <button className="button button-green hero-donate-submit" onClick={() => onNav("about")}>
        Our Story <ArrowRight size={17} />
      </button>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

function HomePage({ onNav }: { onNav: (p: Page) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (preference.matches) videoRef.current?.pause();
      else videoRef.current?.play().catch(() => setPlaying(false));
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  const programmes = [
    { title: "Thomas D.K. Wahome Scholarship", category: "Education", description: "Opening the classroom door for bright students through tuition support, learning materials, and the encouragement to dream bigger.", image: image_fundeducation, page: "scholarship" as Page },
    { title: "Wells of Hope", category: "Clean water", description: "Bringing reliable water closer to home, so communities can build healthier, more resilient futures.", image: image_wells_of_hope, page: "wells" as Page },
    { title: "Mentorship Programme", category: "Opportunity", description: "Connecting Kenyan talent with practical skills, professional guidance, and global career opportunities.", image: image_mentorship_1, page: "mentorship" as Page },
  ];
  return (
    <div className="home-page">
      <section className="eden-hero" aria-label="Welcome to Wahome Foundation">
        <video ref={videoRef} muted loop playsInline preload="metadata" poster={image_DSC_0332} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} aria-hidden="true">
          <source src={wahomeSlideshow} type="video/mp4" />
        </video>
        <div className="layout hero-layout hero-layout-split">
          <div className="hero-panel">
            <h1>People, purpose, <em>possibility.</em></h1>
            <p>Education, clean water, and guidance for the next generation. Together with communities in Kenya, we turn opportunity into lasting change.</p>
          </div>
          <HeroStoryCTA onNav={onNav} />
        </div>
        <div className="hero-controls"><span>Our community. Our shared future.</span><button onClick={() => { if (playing) videoRef.current?.pause(); else videoRef.current?.play().catch(() => setPlaying(false)); }} aria-label={playing ? "Pause background video" : "Play background video"}>{playing ? <><span aria-hidden="true">Ⅱ</span> Pause</> : <><PlayCircle size={16} /> Play</>}</button></div>
      </section>

      <section className="partner-section partner-section-under-hero" aria-label="Our partners"><div className="layout"><span className="eyebrow">Trusted by supporters, funders, and newsletters</span><div className="partner-logos">{[{name:"Autism Allies",src:logoAutismAllies},{name:"Coffee Bench",src:logoCoffeeBench},{name:"Laikipia Heights",src:logoLaikipiaHeights},{name:"Luxo",src:logoLuxo},{name:"Tufaha Resort",src:logoTufahaResort}].map(partner => <div key={partner.name}><img src={partner.src} alt={partner.name} loading="lazy" /></div>)}</div><button className="text-link" onClick={() => onNav("about")}>Meet our community of partners <ArrowRight size={17} /></button></div></section>

      <section className="impact-band">
        <div className="layout impact-section">
          <div className="impact-copy"><span className="eyebrow">Opportunity that lasts</span><h2>Our impact</h2><p>Since 2006, we have invested in people and the possibilities within their communities. From a first day at school to a reliable source of water, every step forward begins with working together.</p><button className="button button-green" onClick={() => onNav("about")}>Discover our story <ArrowRight size={17} /></button></div>
          <div className="impact-numbers">{[{n:"500+",l:"students supported through scholarships"},{n:"20+",l:"community boreholes bringing clean water"},{n:"40+",l:"partner schools celebrating achievement"},{n:"Since 2006",l:"working alongside Kenyan communities"}].map(stat => <div key={stat.n}><strong>{stat.n}</strong><p>{stat.l}</p></div>)}</div>
        </div>
      </section>


      <section className="layout programmes-section" id="our-work"><div className="section-heading"><div><span className="eyebrow">How we make a difference</span><h2>Our programmes</h2></div><p>Education, clean water, and mentorship.<br />Connected pathways to a brighter future.</p></div><div className="programme-grid">{programmes.map(programme => <article className="programme-card" key={programme.page}><button className="programme-image" onClick={() => onNav(programme.page)} aria-label={`Explore ${programme.title}`}><img src={programme.image} alt={programme.title} loading="lazy" /></button><div className="programme-body"><span className="eyebrow">{programme.category}</span><h3>{programme.title}</h3><p>{programme.description}</p><button className="text-link" onClick={() => onNav(programme.page)}>Explore programme <ArrowRight size={17} /></button></div></article>)}</div></section>

      <section className="community-feature" style={{backgroundImage:`url(${image_DSC_0445})`}}><div className="layout"><div className="feature-panel"><span className="eyebrow">Celebrating the next generation</span><h2>When one child succeeds,<br />a community rises.</h2><p>Our annual Prize Giving Day brings students, families, teachers, and supporters together to celebrate hard work—and all that comes next.</p><button className="button button-outline" onClick={() => onNav("prize")}>Discover prize giving <ArrowRight size={17} /></button></div></div></section>

      <section className="layout approach-section"><div className="approach-heading"><span className="eyebrow">Our approach</span><h2>People at the heart<br />of every possibility.</h2><p>Lasting change grows from local relationships, shared purpose, and support that meets people where they are.</p><button className="button button-green" onClick={() => onNav("about")}>Get to know us <ArrowRight size={17} /></button></div><div className="approach-grid">{[{Icon:Handshake,title:"Community first",text:"Working alongside families, schools, and local leaders to respond to real needs."},{Icon:Heart,title:"Personal support",text:"Seeing the person behind every scholarship, every ambition, and every new beginning."},{Icon:GraduationCap,title:"Long-term commitment",text:"Creating pathways through education, essential resources, and ongoing guidance."},{Icon:TrendingUp,title:"Opportunity in action",text:"Connecting the next generation with the tools and people to move forward."}].map(({Icon,title,text}) => <div key={title}><span className="approach-icon"><Icon size={22} strokeWidth={1.6} /></span><h3>{title}</h3><p>{text}</p></div>)}</div></section>

      <section className="scholar-section"><div className="layout scholar-grid"><img src={alexPhoto} alt="Alex Karani, a Wahome Foundation scholar" loading="lazy" /><div className="scholar-quote"><span className="eyebrow">The people behind the impact</span><h2>A chance to learn.<br />A future to imagine.</h2><blockquote>“The Foundation helped me join High School and gave me hope of pursuing a career in Agricultural Engineering.”</blockquote><p className="quote-credit"><strong>Alex Karani</strong><span>Wahome Foundation scholar</span></p><button className="text-link" onClick={() => onNav("scholarship")}>Meet our scholars <ArrowRight size={17} /></button></div></div></section>

      <section className="layout news-section"><div className="section-heading"><div><span className="eyebrow">From our community</span><h2>Stories & updates</h2></div><p>The people, partnerships, and everyday<br />actions that move our mission forward.</p></div><div className="grid md:grid-cols-3 gap-6">{blogNewsItems.map((item,i) => <MediaCard key={i} {...item} />)}</div></section>

    </div>
  );
}

// ─── ABOUT PAGE ───────────

function AboutPage({ onNav }: { onNav: (p: Page) => void }) {
  return (
    <div className="about-page pt-28 md:pt-32 min-h-screen bg-white">
      <section className="py-6 sm:py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center text-left">
          <div>
            <SectionTag>OUR STORY</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#1F3A52] mb-6"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
            >
              Founded in 2006 with a single promise
            </h2>
            <p className="text-[#5B6670] leading-relaxed mb-4">
              Wahome Foundation was established in Laikipia County to address a clear and urgent need:
              too many brilliant children were being left behind by poverty, lack of water, and absence
              of role models. From the beginning, our approach has been direct and transparent — get
              resources where they matter most.
            </p>
            <p className="text-[#5B6670] leading-relaxed mb-4">
              Over nearly two decades, we have supported over 500 students through full scholarships,
              drilled and commissioned more than 20 community boreholes, and staged annual prize-giving
              ceremonies that celebrate excellence and inspire hundreds more.
            </p>
            <p className="text-[#5B6670] leading-relaxed">
              Every programme traces back to the legacy of Thomas D.K. Wahome — educator, community
              leader, and believer in the transformative power of opportunity.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img
              src={image_wells_of_hope}
              alt="Community borehole project"
              className="rounded-2xl w-full h-64 object-cover"
            />
            <img
              src={image_fundeducation}
              alt="Students at school"
              className="rounded-2xl w-full h-64 object-cover mt-8"
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#F1F4F7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <SectionTag>Our Approach</SectionTag>
            <h2
              className="font-serif text-3xl font-bold text-[#1F3A52]"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
            >
              How we create lasting change
            </h2>
          </div>
          <div className="bg-white rounded-2xl p-10 border border-[#DDE3E8]">
            <p className="text-[#5B6670] leading-relaxed text-center">
              Lasting change starts with a child able to stay in school and a community with clean water to
              come home to. We select only the most deserving, academically bright students for our
              scholarships — carefully assessed so opportunity goes where it can do the most good — while
              Wells of Hope works alongside their families, bringing clean, reliable water closer to homes
              and schools. Education and wellbeing reinforce each other: an educated generation grows up in
              healthier, more resilient communities, and stronger communities are better placed to keep
              their children in school.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#F1F4F7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <SectionTag>Our Board of Trustees</SectionTag>
            <h2
              className="font-serif text-3xl font-bold text-[#1F3A52]"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
            >
              The people who guide our mission
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Wilson Kiriungi", role: "Chairperson" },
              { name: "James Wachira", role: "Vice Chairperson" },
              { name: "Name Pending", role: "Treasurer" },
              { name: "Name Pending", role: "Secretary" },
              { name: "Name Pending", role: "Board Member" },
            ].map((b) => (
              <div key={b.role} className="text-center">
                <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Users className="w-12 h-12 text-[#2C6E9E]" />
                </div>
                <h3
                  className="font-bold text-[#1F3A52] font-serif text-lg"
                  style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
                >
                  {b.name}
                </h3>
                <p className="text-sm text-[#2C6E9E] font-medium">{b.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <SectionTag>Our Team</SectionTag>
            <h2
              className="font-serif text-3xl font-bold text-[#1F3A52]"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
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
                  className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-[#F1F4F7]"
                />
                <h3
                  className="font-bold text-[#1F3A52] font-serif text-lg"
                  style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
                >
                  {p.name}
                </h3>
                <p className="text-sm text-[#2C6E9E] font-medium">{p.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Powered By Partners Section (Interactive Grayscale Logo Cards) */}
      <section className="py-24 px-6 bg-white border-t border-[#F1F4F7]">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs uppercase font-extrabold tracking-widest text-[#5B6670] mb-14">
            Powered by our partners
          </p>

          <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-16 md:gap-20">
            {[
              { name: "Autism Allies", src: logoAutismAllies },
              { name: "Coffee Bench", src: logoCoffeeBench },
              { name: "Laikipia Heights", src: logoLaikipiaHeights },
              { name: "Luxo", src: logoLuxo },
              { name: "Lioness", src: logoLioness },
              { name: "Prestige AFC", src: logoPrestigeAFC },
              { name: "Sneakerama", src: logoSneakerama },
              { name: "Tufaha Resort", src: logoTufahaResort },
            ].map((partner) => (
              <div
                key={partner.name}
                className="flex items-center justify-center p-2 transition-transform duration-300 hover:scale-105"
              >
                <img
                  src={partner.src}
                  alt={partner.name}
                  className="h-15 sm:h-18 w-auto max-w-[210px] object-contain opacity-100"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── WELLS OF HOPE PAGE ──────────────────────────────────────────────────────

function WellsPage({
  onNav,
  onOpenDonate,
}: {
  onNav: (p: Page) => void;
  onOpenDonate: (amount?: number) => void;
}) {
  return (
    <div className="pt-28 md:pt-32 min-h-screen bg-white">
      <section className="py-6 sm:py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center text-left">
          <div>
            <SectionTag>Why Water</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#1F3A52] mb-6"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
            >
              Water is the foundation of everything
            </h2>
            <p className="text-[#5B6670] leading-relaxed mb-4">
              In rural Kenya, children — particularly girls — spend hours each day walking to collect water.
              Every hour spent on that journey is an hour not spent in class. Clean water close to home
              means girls stay in school, mothers are healthier, and entire communities flourish.
            </p>
            <p className="text-[#5B6670] leading-relaxed mb-6">
              Since 2008, Wells of Hope has drilled and commissioned over 20 boreholes serving thousands of
              people. Each well is community-managed with a local oversight committee trained by our team
              to ensure long-term sustainability.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: "5+", l: "Wells Completed" },
                { n: "1,000+", l: "People with Clean Water" },
                { n: "3 hrs", l: "Daily Walk Time Saved" },
                { n: "100%", l: "Community Managed" },
              ].map(({ n, l }) => (
                <div key={l} className="bg-[#F1F4F7] rounded-xl p-4">
                  <div
                    className="text-2xl font-bold text-[#2C6E9E]"
                    style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
                  >
                    {n}
                  </div>
                  <div className="text-xs text-[#5B6670] mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden bg-[#D7E0E8] aspect-[4/3]">
            <img
              src={image_wells_of_hope}
              alt="Clean water well in Kenya"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── SCHOLARSHIP PAGE ────────────────────────────────────────────────────────

function ScholarshipPage({
  onNav,
  onOpenDonate,
}: {
  onNav: (p: Page) => void;
  onOpenDonate: (amount?: number) => void;
}) {
  return (
    <div className="scholarship-page pt-28 md:pt-32 min-h-screen bg-white">
      <section className="py-6 sm:py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center text-left">
          <div>
            <SectionTag>About the Scholarship</SectionTag>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-[#1F3A52] leading-tight mb-4"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
            >
              Breaking financial barriers to education
            </h2>
            <p className="text-[#5B6670] leading-relaxed text-xs sm:text-sm mb-4">
              The Thomas D.K. Wahome Scholarship is our flagship programme, providing comprehensive financial
              support for academically gifted students from low-income households in Kiambu County and
              beyond.
            </p>
            <p className="text-[#5B6670] leading-relaxed text-xs sm:text-sm mb-6">
              Scholarship recipients receive full tuition cover, school supplies, examination fees, and
              ongoing pastoral support throughout their secondary education — giving them the freedom to
              focus entirely on learning.
            </p>
            <div className="space-y-3">
              {[
                "Full secondary school tuition coverage",
                "School uniforms and study materials",
                "National examination fee sponsorship",
                "Pastoral check-ins and mentorship pairing",
                "University application guidance",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[#2C6E9E] shrink-0" />
                  <span className="text-[#5B6670] text-xs sm:text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="rounded-[28px] overflow-hidden shadow-sm border border-slate-200/80 bg-[#D7E0E8] aspect-[4/3]">
              <img
                src={dkPhoto}
                alt="Scholarship students studying"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Dzianis-Style Floating Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {[
                { number: "500+", label: "Total Scholars", tag: "Education" },
                { number: "94%", label: "Completion Rate", tag: "Success" },
                { number: "68%", label: "University Entry", tag: "Impact" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-[#F8FAFC] rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left"
                >
                  <span className="text-[9px] font-extrabold tracking-[0.18em] uppercase text-[#2C6E9E] bg-[#F1F4F7] px-2 py-0.5 rounded-full border border-[#2C6E9E]/15 inline-block mb-1.5">
                    {stat.tag}
                  </span>
                  <h3 className="text-xl font-bold text-[#1F3A52] tracking-tight mb-0.5">
                    {stat.number}
                  </h3>
                  <p className="text-[11px] text-[#5B6670] font-medium leading-tight">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Meet Our Scholars (Bento-Inspired Testimonial Cards) */}
      <section id="meet-our-scholars" className="py-12 px-6 bg-[#F1F4F7]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <SectionTag>Meet Our Scholars</SectionTag>
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-[#1F3A52] tracking-tight"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
            >
              The dreams your support makes possible
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                name: "Alex Karani",
                meta: "Grade 10 · Active Scholar",
                message:
                  "The Foundation came at a defining time when I was uncertain of my future education. They helped me join High School and gave me hope of pursuing a career in Agricultural Engineering.",
                photo: alexPhoto,
                objectPosition: "object-[center_15%]",
              },
              {
                name: "Jedidah Watetu",
                meta: "Grade 10 · St Rita Kiaragana Girls",
                message:
                  "I got a scholarship to join High School through the intervention of the Wahome Foundation. Now aspiring to be a Doctor in the future.",
                photo: jedidahPhoto,
                objectPosition: "object-[center_15%]",
              },
              {
                name: "James Ndungu",
                meta: "Grade 10 · Endarasha Boys",
                message:
                  "The Wahome Foundation offered me the Thomas D.K. Wahome scholarship which enabled me to join Endarasha Senior school. I aspire to be a neurosurgeon in the future.",
                photo: jamesPhoto,
                objectPosition: "object-[center_15%]",
              },
              {
                name: "Newton Njenga",
                meta: "Grade 10 · Kaheti Boys",
                message:
                  "The foundation helped me join Highschool and now I can fulfill my aspiration of joining the army as a Cadet officer in the future.",
                photo: newtonPhoto,
                objectPosition: "object-[center_15%]",
              },
              {
                name: "Samuel Mutero",
                meta: "Grade 10 · Naromuru Boys",
                message:
                  "I am truly thankful to the Wahome Foundation for enabling me to join High school. Their support has given me a chance to chase my dream of becoming a Biologist.",
                photo: samuelPhoto,
                objectPosition: "object-[center_15%]",
              },
            ].map((s) => (
              <div
                key={s.name}
                className="group flex flex-col sm:flex-row bg-white rounded-[24px] border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left"
              >
                <div className="w-full h-52 sm:w-52 sm:h-auto shrink-0 overflow-hidden bg-[#F1F4F7]">
                  <img
                    src={s.photo}
                    alt={s.name}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${s.objectPosition}`}
                  />
                </div>
                <div className="p-6 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className="font-bold text-[#1F3A52] text-base"
                      style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
                    >
                      {s.name}
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2C6E9E] bg-[#F1F4F7] px-2.5 py-0.5 rounded-full">
                      Scholar
                    </span>
                  </div>
                  <p className="text-xs text-[#2C6E9E] font-semibold mb-2">{s.meta}</p>
                  <p className="text-[#5B6670] text-xs sm:text-sm leading-relaxed">
                    “{s.message}”
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── PRIZE GIVING PAGE ────────────────────────────────────────────────────────

// 1. Dynamic glob import for Vite
const galleryImageModules = import.meta.glob<{ default: string }>(
  '../imports/gallery/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG}',
  { eager: true }
);

const dynamicImages = Object.values(galleryImageModules).map((mod) => mod.default);

// 2. Fallback static imports matching files in your src/imports/gallery folder
import img_0011 from "../imports/gallery/DSC_0011.jpg";
import img_0019 from "../imports/gallery/DSC_0019.jpg";
import img_0029 from "../imports/gallery/DSC_0029.jpg";
import img_0030 from "../imports/gallery/DSC_0030.jpg";
import img_0048 from "../imports/gallery/DSC_0048.jpg";
import img_0067 from "../imports/gallery/DSC_0067.jpg";

const fallbackImages = [img_0011, img_0019, img_0029, img_0030, img_0048, img_0067];

// Combine dynamic glob results with fallbacks
const allGalleryImages = dynamicImages.length > 0 ? dynamicImages : fallbackImages;

function SliderSpectra() {
  const [images, setImages] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (allGalleryImages.length > 0) {
      const shuffled = [...allGalleryImages];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setImages(shuffled);
    }
  }, []);

  // Continuous Auto-Scroll Effect (Paused when hovering or modal open)
  useEffect(() => {
    if (!isAutoPlaying || images.length === 0 || selectedImageIndex !== null) return;
    const timer = setInterval(() => {
      setActive((curr) => (curr === images.length - 1 ? 0 : curr + 1));
    }, 3500);
    return () => clearInterval(timer);
  }, [isAutoPlaying, images.length, selectedImageIndex]);

  // Full-Screen Modal Keyboard Controls (Arrow Keys & Escape)
  useEffect(() => {
    if (selectedImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0));
      } else if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) =>
          prev !== null ? (prev - 1 + images.length) % images.length : 0
        );
      } else if (e.key === "Escape") {
        setSelectedImageIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, images.length]);

  // Full-Screen Modal Mouse Wheel Scroll Handler
  const handleModalWheel = (e: React.WheelEvent) => {
    if (selectedImageIndex === null) return;
    if (e.deltaY > 0) {
      setSelectedImageIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0));
    } else if (e.deltaY < 0) {
      setSelectedImageIndex((prev) =>
        prev !== null ? (prev - 1 + images.length) % images.length : 0
      );
    }
  };

  if (images.length === 0) return null;

  const prevSlide = () => setActive((curr) => (curr === 0 ? images.length - 1 : curr - 1));
  const nextSlide = () => setActive((curr) => (curr === images.length - 1 ? 0 : curr + 1));

  return (
    <>
      <div 
        className="relative w-full flex flex-col items-center"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Compact 3D Coverflow Stage */}
        <div className="relative w-full max-w-5xl h-[300px] sm:h-[340px] flex items-center justify-center perspective-[1000px]">
          {images.map((src, idx) => {
            let offset = idx - active;

            if (offset < -Math.floor(images.length / 2)) offset += images.length;
            if (offset > Math.floor(images.length / 2)) offset -= images.length;

            if (Math.abs(offset) > 3) return null;

            const isCenter = offset === 0;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (isCenter) {
                    setSelectedImageIndex(idx);
                  } else {
                    setActive(idx);
                  }
                }}
                style={{
                  transform: `translateX(${offset * 140}px) scale(${
                    isCenter ? 1.05 : 0.85 - Math.abs(offset) * 0.08
                  }) rotateY(${offset * -18}deg)`,
                  zIndex: 10 - Math.abs(offset),
                  opacity: Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.25,
                }}
                className={`absolute w-[220px] sm:w-[270px] h-[270px] sm:h-[320px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out shadow-lg border ${
                  isCenter
                    ? "border-[#2C6E9E] shadow-[0_10px_25px_rgba(29,149,184,0.3)] ring-2 ring-[#2C6E9E]/30"
                    : "border-gray-200/50 filter brightness-90 hover:brightness-100"
                }`}
              >
                <img src={src} alt={`Gallery image ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="relative z-20 flex items-center gap-4 mt-3">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous image"
            className="w-10 h-10 rounded-full bg-white hover:bg-[#F1F4F7] text-[#1F3A52] border border-[#DDE3E8] shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next image"
            className="w-10 h-10 rounded-full bg-white hover:bg-[#F1F4F7] text-[#1F3A52] border border-[#DDE3E8] shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Interactive Full-Screen Lightbox Modal */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-4 select-none"
          onClick={() => setSelectedImageIndex(null)}
          onWheel={handleModalWheel}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-6 right-6 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 transition-all hover:scale-105"
            aria-label="Close full screen view"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Full Screen Prev Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0));
            }}
            className="absolute left-6 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          {/* Active Image */}
          <img
            src={images[selectedImageIndex]}
            alt={`Full screen view ${selectedImageIndex + 1}`}
            className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Full Screen Next Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0));
            }}
            className="absolute right-6 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            aria-label="Next photo"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          {/* Helper Instruction Prompt */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium tracking-wide bg-black/40 px-4 py-2 rounded-full border border-white/10">
            Scroll mouse wheel or press ← / → to navigate • Esc to close
          </div>
        </div>
      )}
    </>
  );
}

function PrizePage({
  onNav,
  onOpenDonate,
}: {
  onNav: (p: Page) => void;
  onOpenDonate: (amount?: number) => void;
}) {
  return (
    <div className="pt-28 md:pt-32 min-h-screen bg-white">
      <section className="py-6 sm:py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center text-left">
          <div>
            <SectionTag>Annual Celebration</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#1F3A52] mb-6"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
            >
              Excellence deserves to be seen
            </h2>
            <p className="text-[#5B6670] leading-relaxed mb-4">
              Every year, Wahome Foundation convenes hundreds of students, parents, teachers, and community
              leaders for our flagship Prize Giving Day, a vibrant ceremony that honours top academic
              performers across our partner schools.
            </p>
            <p className="text-[#5B6670] leading-relaxed mb-6">
              More than an award ceremony, it is a community statement: that academic effort is valued,
              that hard work is recognized, and that excellence is possible regardless of a student&apos;s
              background.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { n: "19+", l: "Annual Ceremonies" },
                { n: "300+", l: "Scholars Recognized" },
                { n: "40+", l: "Partner Schools" },
              ].map(({ n, l }) => (
                <div key={l} className="bg-[#F1F4F7] rounded-xl p-4 text-center">
                  <div
                    className="text-2xl font-bold text-[#2C6E9E]"
                    style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
                  >
                    {n}
                  </div>
                  <div className="text-xs text-[#5B6670] mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-lg bg-[#D7E0E8] aspect-[4/3]">
            <img
              src={image_DSC_0332}
              alt="Prize giving ceremony cheer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1F3A52]/60 via-transparent to-transparent flex items-end p-6">
              <p className="text-white text-sm font-medium italic">
                “Celebrating the hard work and dedication of our brilliant students each year.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#F1F4F7]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#1F3A52] mb-4"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
            >
              Our Gallery
            </h2>
            <p className="text-[#5B6670] text-sm leading-relaxed">
              Explore images from our annual Prize Giving ceremonies, highlighting inspiring student
              achievements, proud families, and community celebrations across our regional partner schools.
            </p>
          </div>

          {/* New Spectra Slider Component */}
          <SliderSpectra />
        </div>
      </section>

      <section id="save-the-date" className="py-6 sm:py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <SectionTag>Save The Date</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#1F3A52]"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
            >
              Prize Giving Day 2027
            </h2>
          </div>

          <div className="bg-[#F1F4F7]/50 rounded-3xl p-8 md:p-12 border border-[#DDE3E8] shadow-sm grid md:grid-cols-2 gap-10 items-center text-left">
            <div>
              <h3 className="text-xl font-bold text-[#1F3A52] mb-6">Event Details</h3>
              <div className="space-y-4">
                {[
                  { label: "Date", value: "Saturday, 9 January 2027" },
                  {
                    label: "Venue",
                    value: "Mugumo Comprehensive School Grounds, Nanyuki",
                  },
                  { label: "Time", value: "10:00 AM – 4:00 PM EAT" },
                  {
                    label: "Attendees",
                    value: "Scholars, Guardians, Teachers, Donors & Community members",
                  },
                ].map((d) => (
                  <div key={d.label} className="flex gap-4 border-b border-[#DDE3E8]/60 pb-3">
                    <span className="text-sm font-semibold text-[#2C6E9E] w-28 shrink-0">
                      {d.label}
                    </span>
                    <span className="text-sm text-[#5B6670]">{d.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={onOpenDonate}
                  className="px-6 py-3 rounded-xl bg-[#16324A] text-white font-semibold text-sm hover:bg-[#1A3A52] transition-colors"
                >
                  Become a Partner
                </button>
                <button
                  onClick={() => go("mentorship")}
                  className="px-6 py-3 rounded-xl border border-[#16324A] text-[#16324A] font-semibold text-sm hover:bg-[#16324A]/10 transition-colors"
                >
                  Volunteer at Ceremony
                </button>
              </div>
            </div>

            <div className="bg-[#1F3A52] text-white p-8 rounded-2xl space-y-4">
              <Quote className="w-8 h-8 text-[#2C6E9E]" />
              <p className="text-sm text-[#C3CBD1] leading-relaxed">
                “When a child stands on that stage in front of their entire community, something shifts
                inside them. They realize that their dreams are valid and achievable.”
              </p>
              <div className="border-t border-[#1E3F58] pt-3">
                <p className="font-bold text-white text-sm">Wilson Kiriungi</p>
                <p className="text-xs text-[#2C6E9E]">Chairperson, Board of Trustees</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── MENTORSHIP PAGE ──────────────────────────────────────────────────────────

function MentorshipPage({
  onNav,
  onOpenDonate,
}: {
  onNav: (p: Page) => void;
  onOpenDonate: (amount?: number) => void;
}) {
  return (
    <div className="pt-28 md:pt-32 min-h-screen bg-white">
      <section className="py-6 sm:py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center text-left">
          <div>
            <SectionTag>Mentorship Programme</SectionTag>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold text-[#1F3A52] mb-6"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
            >
              Kenyan talent, working for the world
            </h2>
            <p className="text-[#5B6670] leading-relaxed mb-4">
              Our programme connects skilled Kenyan professionals with employers in the United States,
              opening the door to meaningful remote work without requiring anyone to leave home.
            </p>
            <p className="text-[#5B6670] leading-relaxed mb-6">
              Participants receive interview preparation and remote-work readiness support, then are
              matched with U.S.-based companies — for many, their first international employer.
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
                <div key={m.label} className="bg-[#F1F4F7] rounded-xl p-5 border border-[#DDE3E8]">
                  <m.icon className="w-6 h-6 text-[#2C6E9E] mb-2" />
                  <p className="font-bold text-[#1F3A52] text-sm mb-1">{m.label}</p>
                  <p className="text-xs text-[#5B6670]">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden bg-[#D7E0E8] aspect-[4/3]">
            <img
              src={image_mentorship_1}
              alt="Mentor and student working together"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#F1F4F7]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SectionTag>Our Protégé</SectionTag>
            <h2
              className="font-serif text-3xl font-bold text-[#1F3A52]"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
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
                className="grid md:grid-cols-[280px_1fr] gap-8 items-start bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-sm text-left"
              >
                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#D7E0E8]">
                  <img
                    src={m.img}
                    alt={m.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                <div className="pt-2">
                  <p className="text-xs uppercase tracking-wider font-semibold text-[#2C6E9E] mb-1">
                    {m.role}
                  </p>
                  <h3 className="text-2xl font-bold text-[#1F3A52] mb-4">{m.name}</h3>
                  <p className="text-[#5B6670] leading-relaxed italic text-[20px]">
                    “{m.quote}”
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── FLOATING DONATE WIDGET ───────────────────────────────────────────────────

function FloatingDonateButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 px-5 py-3.5 rounded-full bg-[#16324A] text-white font-bold text-xs uppercase tracking-wider shadow-xl hover:bg-[#1A3A52] transition-all duration-150 flex items-center gap-2 hover:scale-105"
    >
      <Heart className="w-4 h-4 fill-white" />
      Make A Change
    </button>
  );
}

// ─── ROOT APP (Clean, Error-Free Build Target) ─────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState<number | undefined>(undefined);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [page]);

  const openDonate = (amount?: number) => {
    if (typeof amount === "number") setDonateAmount(amount);
    setIsDonateOpen(true);
  };
  const closeDonate = () => setIsDonateOpen(false);

  const pages: Record<Page, React.ReactNode> = {
    home: <HomePage onNav={setPage} />,
    about: <AboutPage onNav={setPage} />,
    scholarship: (
      <ScholarshipPage onNav={setPage} onOpenDonate={openDonate} />
    ),
    wells: <WellsPage onNav={setPage} onOpenDonate={openDonate} />,
    prize: <PrizePage onNav={setPage} onOpenDonate={openDonate} />,
    mentorship: (
      <MentorshipPage onNav={setPage} onOpenDonate={openDonate} />
    ),
  };

  return (
    <div
      className="site-shell min-h-screen bg-white text-[#1F3A52]"
      style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}
    >
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar current={page} onNav={setPage} onOpenDonate={openDonate} />

      <main id="main-content" className={page === "home" ? "" : "inner-page"}>
        {pages[page]}
      </main>

      <Footer onNav={setPage} onOpenDonate={openDonate} />
      <DonateModal isOpen={isDonateOpen} onClose={closeDonate} initialAmount={donateAmount} />
      
    </div>
  );
}
