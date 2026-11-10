import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, Clock3, MapPin, HeartHandshake, X } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import posterImage from "@/imports/event-poster-2027.jpg";
import { functions } from "@/lib/firebase";
import RegistrationForm from "./RegistrationForm";

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
    <section className="run-hero"><div className="layout run-hero-inner"><div className="run-hero-copy"><span className="eyebrow">Move for education</span><h1>Miles for Minds:<br /><em>The Wahome Foundation Run</em></h1><p>Join us to support children’s education through the Thomas D.K. Wahome Scholarship Program.</p><div className="run-hero-details"><span><CalendarDays size={18} /> Saturday, January 9, 2027</span><span><Clock3 size={18} /> 7:00 AM</span><span><MapPin size={18} /> Mugumo Center</span></div><div className="run-hero-actions"><button type="button" className="button button-gold" onClick={() => setActiveDialog("registration")}>Register <ArrowRight size={17} /></button><button type="button" className="button button-outline" onClick={() => setActiveDialog("sponsor")}>Become a Sponsor <HeartHandshake size={17} /></button></div></div></div></section>
    <section className="layout run-details-section">
      <div className="run-purpose">
        <span className="eyebrow">Every mile makes a difference</span>
        <h2>Run for the next generation</h2>
        <p>Funds raised support children’s education through the Thomas D.K. Wahome Scholarship Program. Choose a race distance and package: Regular KES 500, VIP KES 1,000, or VVIP KES 1,500. Students from beneficiary schools participate free through school representative registration. Participants under 18 need parent or guardian authorization.</p>
      </div>
      <div className="run-category-grid">
        <article><span>01</span><h3>Children&apos;s Fun Run</h3><p>For participants under 18</p><strong>Choose a package</strong></article>
        <article><span>02</span><h3>5KM Run/Walk</h3><p>Open to everyone</p><strong>Choose a package</strong></article>
        <article><span>03</span><h3>10KM Run</h3><p>Open to everyone</p><strong>Choose a package</strong></article>
        <article><span>04</span><h3>21KM Half Marathon</h3><p>Open to everyone</p><strong>Choose a package</strong></article>
      </div>
    </section>
    <section className="run-info-band"><div className="layout run-info-grid"><div><span className="eyebrow">Event information</span><h2>Details to follow</h2><p>We’ll share more information when it is confirmed.</p></div><dl><div><dt>Route</dt><dd>To be announced</dd></div><div><dt>Registration deadline</dt><dd>To be announced</dd></div><div><dt>Participant capacity</dt><dd>To be announced</dd></div><div><dt>Event-day guidance</dt><dd>To be announced</dd></div></dl></div></section>
    <section className="run-poster-section"><div className="layout run-poster-grid"><div className="run-poster-info"><span className="eyebrow">Save the date</span><h2>Invite someone to run with you</h2><p>The poster provides an event overview. Use the current package details on this page when registering.</p><dl className="run-poster-details"><div><dt>Date</dt><dd>Saturday, January 9, 2027</dd></div><div><dt>Time &amp; venue</dt><dd>7:00 AM · Mugumo Center</dd></div><div><dt>Distances</dt><dd>Children&apos;s Fun Run · 5KM Run/Walk · 10KM Run · 21KM Half Marathon</dd></div><div><dt>Packages</dt><dd>Regular KES 500 · VIP KES 1,000 · VVIP KES 1,500 · Beneficiary school students free</dd></div></dl><p className="run-poster-cause">Every step supports children’s education through the Thomas D.K. Wahome Scholarship Program.</p></div><div className="run-poster-preview"><img src={posterImage} alt="Miles for Minds Run 2027 event poster." /></div></div></section>
    {activeDialog && <div className="run-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveDialog(null); }}>
      <div className="run-dialog" role="dialog" aria-modal="true" aria-labelledby="run-dialog-title">
        <header className="run-dialog-header support-modal-header"><h2 id="run-dialog-title">{activeDialog === "registration" ? "Participant Registration" : "Become a Sponsor"}</h2><button type="button" className="run-dialog-close support-modal-close" onClick={() => setActiveDialog(null)} aria-label="Close dialog"><X size={20} /></button></header>
        <div className={`run-dialog-content${activeDialog === "registration" ? " registration-dialog-content" : ""}`}>
          {activeDialog === "registration" ? <><RegistrationForm /><aside className="run-payment-note"><span className="eyebrow">Registration packages</span><h2>Choose your entry package</h2><p>Regular: KES 500 — entry ticket.</p><p>VIP: KES 1,000 — entry ticket, participation medal, and VIP tent access.</p><p>VVIP: KES 1,500 — entry ticket, participation medal, T-shirt, and sponsor lounge access.</p><p>Students from beneficiary schools register free through a school representative. Paid registrations stay pending until an administrator confirms payment; student entries stay pending until eligibility is confirmed.</p></aside></> : <SponsorForm />}
        </div>
      </div>
    </div>}
  </div>;
}
