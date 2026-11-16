import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, MapPin, HeartHandshake, X } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import posterImage from "@/imports/poster.jpg";
import { functions } from "@/lib/firebase";
import RegistrationForm, { type RegistrationConfirmation } from "./RegistrationForm";

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

type Category = "Children's Fun Run" | "5KM Run/Walk" | "10KM Run" | "21KM Half Marathon";
type PaidRegistrationTier = "Regular" | "VIP" | "VVIP";
export type EventDialog = "registration" | "sponsor";

const fieldClass = "run-field";

function SponsorField({
  id,
  name = id,
  label,
  type = "text",
  required = true,
  autoComplete,
}: {
  id: string;
  name?: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return <div className={fieldClass}>
    <label htmlFor={id}>{label}{required ? " *" : ""}</label>
    <input id={id} name={name} type={type} required={required} autoComplete={autoComplete} />
  </div>;
}

function SponsorForm() {
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const configured = Boolean(functions && siteKey);

  useEffect(() => {
    if (!siteKey || !turnstileContainer.current) return;
    let timer = 0;
    const renderWidget = () => {
      if (!window.turnstile || !turnstileContainer.current || turnstileWidgetId.current) return;
      turnstileWidgetId.current = window.turnstile.render(turnstileContainer.current, {
        sitekey: siteKey,
        action: "event_sponsor_inquiry",
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
  }, [siteKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (!functions) {
      setStatus("Sponsor inquiries are unavailable in this environment.");
      return;
    }
    if (!siteKey) {
      setStatus("Spam protection is not configured, so this inquiry cannot be submitted yet.");
      return;
    }
    if (!turnstileToken) {
      setStatus("Complete the spam protection check before submitting.");
      return;
    }

    const input = {
      contactName: String(formData.get("contactName") ?? ""),
      organization: String(formData.get("organization") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
      supportMessage: String(formData.get("supportMessage") ?? ""),
      turnstileToken,
    };

    setIsSubmitting(true);
    setStatus("Submitting your inquiry…");
    try {
      const submitInquiry = httpsCallable<typeof input, { inquiryId: string }>(functions, "submitSponsorInquiry");
      const response = await submitInquiry(input);
      form.reset();
      setTurnstileToken("");
      if (turnstileWidgetId.current) window.turnstile?.reset(turnstileWidgetId.current);
      setStatus(`Sponsor inquiry received. Your reference is ${response.data.inquiryId}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Your inquiry could not be submitted. Please try again.";
      setStatus(message);
      setTurnstileToken("");
      if (turnstileWidgetId.current) window.turnstile?.reset(turnstileWidgetId.current);
    } finally {
      setIsSubmitting(false);
    }
  }

  return <form className="run-form" onSubmit={handleSubmit}>
    <div className="run-form-heading"><span className="eyebrow">Partner with the run</span><h2>Become a Sponsor</h2><p>Tell us how you would like to support this event. Your inquiry will be saved for the Foundation team to follow up; submitting it does not confirm sponsorship.</p></div>
    <div className="run-form-grid">
      <SponsorField id="sponsor-contact" name="contactName" label="Contact name" autoComplete="name" />
      <SponsorField id="sponsor-organization" name="organization" label="Organization (optional)" required={false} autoComplete="organization" />
      <SponsorField id="sponsor-email" name="contactEmail" label="Email" type="email" autoComplete="email" />
      <SponsorField id="sponsor-phone" name="contactPhone" label="Phone" type="tel" autoComplete="tel" />
      <div className={`${fieldClass} run-field-wide`}><label htmlFor="sponsor-message">How would you like to support the event? *</label><textarea id="sponsor-message" name="supportMessage" rows={5} minLength={10} maxLength={2000} required /></div>
    </div>
    {siteKey && <div ref={turnstileContainer} />}
    {!configured && <p className="run-form-status" role="status">Sponsor inquiry submission is not configured in this environment.</p>}
    <button className="button button-green" type="submit" disabled={isSubmitting || !configured}>{isSubmitting ? "Submitting…" : "Send sponsor inquiry"} <ArrowRight size={17} /></button>
    <p className="run-form-status" role="status" aria-live="polite">{status}</p>
  </form>;
}

export function EventPage({
  requestedDialog = null,
  onDialogRequestHandled,
}: {
  requestedDialog?: EventDialog | null;
  onDialogRequestHandled?: () => void;
}) {
  const [activeDialog, setActiveDialog] = useState<EventDialog | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>("21KM Half Marathon");
  const [selectedTier, setSelectedTier] = useState<PaidRegistrationTier>("Regular");
  const [registrationConfirmation, setRegistrationConfirmation] = useState<RegistrationConfirmation | null>(null);
  const confirmationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (registrationConfirmation) confirmationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [registrationConfirmation]);

  const handleRegistrationSuccess = (confirmation: RegistrationConfirmation) => {
    setRegistrationConfirmation(confirmation);
    setActiveDialog(null);
  };

  const openRegistration = () => {
    setRegistrationConfirmation(null);
    setActiveDialog("registration");
  };

  const choosePackage = (tier: PaidRegistrationTier) => {
    setSelectedTier(tier);
    openRegistration();
  };

  const chooseCategory = (category: Category) => {
    setRegistrationConfirmation(null);
    setSelectedCategory(category);
  };

  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute("content");
    document.title = "Miles for Minds: The Wahome Foundation Run | Wahome Foundation";
    description?.setAttribute("content", "Join Miles for Minds on January 9, 2027 at Mugumo Center. Choose the Children's Fun Run, 5KM Run/Walk, 10KM Run, or 21KM Half Marathon to support the Thomas D.K. Wahome Scholarship Program.");
    return () => {
      document.title = previousTitle;
      if (previousDescription != null && description) description.setAttribute("content", previousDescription);
    };
  }, []);

  useEffect(() => {
    if (!requestedDialog) return;
    setActiveDialog(requestedDialog);
    onDialogRequestHandled?.();
  }, [requestedDialog]);

  useEffect(() => {
    if (!activeDialog) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveDialog(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeDialog]);

  return <div className="run-page">
    <section className="run-hero"><div className="layout run-hero-inner"><div className="run-hero-copy"><span className="eyebrow">Move for education</span><h1>Miles for Minds:<br /><em>The Wahome Foundation Run</em></h1><p>Join us to support children’s education through the Thomas D.K. Wahome Scholarship Program.</p><div className="run-hero-details"><span><CalendarDays size={18} /> Saturday, January 9, 2027</span><span><Clock3 size={18} /> 7:00 AM</span><span><MapPin size={18} /> Mugumo Center</span></div><div className="run-hero-actions"><button type="button" className="button button-gold" onClick={openRegistration}>Register <ArrowRight size={17} /></button><button type="button" className="button button-outline" onClick={() => setActiveDialog("sponsor")}>Become a Sponsor <HeartHandshake size={17} /></button></div></div></div></section>
    {registrationConfirmation && <section ref={confirmationRef} className="layout run-registration-confirmation" role="status" aria-live="polite">
      <div className="run-confirmation-heading"><CheckCircle2 size={25} aria-hidden="true" /><div><span className="eyebrow">Registration received</span><h2>Thank you for registering!</h2><p>Your {registrationConfirmation.category} registration is saved. Reference: <strong>{registrationConfirmation.registrationId}</strong></p></div></div>
      {registrationConfirmation.feeKes > 0 ? <div className="run-payment-instructions">
        <h3>Pay your {registrationConfirmation.tier} entry fee</h3>
        <p className="run-payment-amount">KES {registrationConfirmation.feeKes.toLocaleString("en-KE")}</p>
        <ol><li>Open M-Pesa and choose <strong>Lipa na M-Pesa</strong>.</li><li>Select <strong>Pay Bill</strong>.</li><li>Business Number: <strong>247247</strong></li><li>Account Number: <strong>208617</strong></li><li>Enter <strong>KES {registrationConfirmation.feeKes.toLocaleString("en-KE")}</strong> and complete payment with your PIN.</li></ol>
        <p className="run-payment-pending">Your registration remains pending until the Foundation confirms payment. Keep your registration reference for your records.</p>
      </div> : <p className="run-payment-pending run-student-confirmation">Your beneficiary-school entry is free and is pending school eligibility confirmation.</p>}
      <button type="button" className="run-confirmation-dismiss" onClick={() => setRegistrationConfirmation(null)}>Done</button>
    </section>}
    <section className="run-signup-section">
      <div className="layout">
        <div className="run-purpose">
          <span className="eyebrow">Every mile makes a difference</span>
          <h1>Run for the next generation</h1>
          <p>Whether you’re lacing up for the first time or chasing a personal best, there is a place for you. Every shilling raised supports children’s education through the Thomas D.K. Wahome Scholarship Program.</p>
        </div>
        <div className="run-category-grid" aria-label="Choose a race distance">
          {([
            ["01", "Children's Fun Run", "For participants under 18", "Our youngest runners set the pace. A joyful start to the day, and a first taste of being part of something bigger. Parent or guardian authorization needed."],
            ["02", "5KM Run/Walk", "Open to everyone", "Run, jog or stroll. Bring family, friends and first-timers. No pressure, just good company for a good cause."],
            ["03", "10KM Run", "Open to everyone", "A real challenge for those ready to stretch. Steady, rewarding, and the perfect middle ground."],
            ["04", "21KM Half Marathon", "Open to everyone", "For the dedicated. Go the full distance and know every kilometre carries a child closer to their education."],
          ] as const).map(([number, category, audience, description]) => (
            <button type="button" className={`run-category-card${selectedCategory === category ? " is-selected" : ""}`} key={category} onClick={() => chooseCategory(category)} aria-pressed={selectedCategory === category}>
              <span className="run-category-number">{number}</span>
              <h2>{category}</h2>
              <p className="run-category-audience">{audience}</p>
              <p className="run-category-description">{description}</p>
            </button>
          ))}
        </div>
        <section className="run-packages" aria-labelledby="run-packages-title">
          <h2 id="run-packages-title">Choose your package</h2>
          <p className="run-packages-intro">Pick any distance, then pick the package that suits you.</p>
          <div className="run-package-grid">
            {([
              ["Regular", "KES 500", "Entry ticket"],
              ["VIP", "KES 1,000", "Includes a medal of participation"],
              ["VVIP", "KES 1,500", "Includes a medal of participation and a T-shirt"],
            ] as const).map(([tier, price, description]) => (
              <article className={`run-package-card${tier === "VIP" ? " run-package-featured" : ""}`} key={tier}>
                <span className="run-package-label">{tier}</span>
                <h3>{price}</h3>
                <p>{description}</p>
                <button type="button" className="run-package-button" onClick={() => choosePackage(tier)} aria-label={`Choose ${tier} package for ${selectedCategory}`}>Choose {tier}</button>
              </article>
            ))}
          </div>
          <p className="run-student-note">Students from beneficiary schools participate free through school representative registration.</p>
          <button type="button" className="run-sponsor-link" onClick={() => setActiveDialog("sponsor")}>Interested in sponsoring the run? <span>Get in touch <HeartHandshake size={15} /></span></button>
        </section>
      </div>
    </section>    <section className="run-info-band"><div className="layout run-info-grid"><div><span className="eyebrow">Event information</span><h2>Details to follow</h2><p>We’ll share more information when it is confirmed.</p></div><dl><div><dt>Route</dt><dd>To be announced</dd></div><div><dt>Registration deadline</dt><dd>To be announced</dd></div><div><dt>Participant capacity</dt><dd>To be announced</dd></div><div><dt>Event-day guidance</dt><dd>To be announced</dd></div></dl></div></section>
    <section className="run-poster-section"><div className="layout run-poster-grid"><div className="run-poster-info"><span className="eyebrow">Save the date</span><h2>Invite someone to run with you</h2><p>The poster provides an event overview. Use the current package details on this page when registering.</p><dl className="run-poster-details"><div><dt>Date</dt><dd>Saturday, January 9, 2027</dd></div><div><dt>Time &amp; venue</dt><dd>7:00 AM · Mugumo Center</dd></div><div><dt>Distances</dt><dd>Children&apos;s Fun Run · 5KM Run/Walk · 10KM Run · 21KM Half Marathon</dd></div><div><dt>Packages</dt><dd>Regular KES 500 · VIP KES 1,000 · VVIP KES 1,500 · Beneficiary school students free</dd></div></dl><p className="run-poster-cause">Every step supports children’s education through the Thomas D.K. Wahome Scholarship Program.</p></div><div className="run-poster-preview"><img src={posterImage} alt="Miles for Minds Run 2027 event poster." /></div></div></section>
    {activeDialog && <div className="run-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveDialog(null); }}>
      <div className="run-dialog" role="dialog" aria-modal="true" aria-labelledby="run-dialog-title">
        <header className="run-dialog-header support-modal-header"><h2 id="run-dialog-title">{activeDialog === "registration" ? "Participant Registration" : "Become a Sponsor"}</h2><button type="button" className="run-dialog-close support-modal-close" onClick={() => setActiveDialog(null)} aria-label="Close dialog"><X size={20} /></button></header>
        <div className={`run-dialog-content${activeDialog === "registration" ? " registration-dialog-content" : ""}`}>
          {activeDialog === "registration" ? <><RegistrationForm initialCategory={selectedCategory} initialTier={selectedTier} onRegistered={handleRegistrationSuccess} /><aside className="run-payment-note"><span className="eyebrow">Registration packages</span><h2>Choose your entry package</h2><p>Regular: KES 500 — entry ticket.</p><p>VIP: KES 1,000 — entry ticket, participation medal, and VIP tent access.</p><p>VVIP: KES 1,500 — entry ticket, participation medal, T-shirt, and sponsor lounge access.</p><p>Students from beneficiary schools register free through a school representative. Paid registrations stay pending until an administrator confirms payment; student entries stay pending until eligibility is confirmed.</p></aside></> : <SponsorForm />}
        </div>
      </div>
    </div>}
  </div>;
}
