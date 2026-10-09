import { useEffect, useState, type FormEvent } from "react";
import { ArrowDownToLine, ArrowRight, CalendarDays, Clock3, MapPin, HeartHandshake } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import posterImage from "@/imports/event-poster-2027.jpg";
import { functions } from "@/lib/firebase";
import RegistrationForm from "./RegistrationForm";

declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

type Category = "21K" | "10K" | "Children's 5K";

const fieldClass = "run-field";

function PosterDownload() {
  return <div className="run-poster-action"><a className="button button-green" href={posterImage} download="miles-for-minds-wahome-foundation-run.jpg"><ArrowDownToLine size={17} /> Download event poster</a></div>;
}

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
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const configured = Boolean(functions && siteKey);

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
    const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
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
      setStatus(`Sponsor inquiry received. Your reference is ${response.data.inquiryId}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Your inquiry could not be submitted. Please try again.";
      setStatus(message);
      window.turnstile?.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  return <form id="sponsor-inquiry" className="run-form" onSubmit={handleSubmit}>
    <div className="run-form-heading"><span className="eyebrow">Partner with the run</span><h2>Become a Sponsor</h2><p>Tell us how you would like to support this event. Your inquiry will be saved for the Foundation team to follow up; submitting it does not confirm sponsorship.</p></div>
    <div className="run-form-grid">
      <SponsorField id="sponsor-contact" name="contactName" label="Contact name" autoComplete="name" />
      <SponsorField id="sponsor-organization" name="organization" label="Organization (optional)" required={false} autoComplete="organization" />
      <SponsorField id="sponsor-email" name="contactEmail" label="Email" type="email" autoComplete="email" />
      <SponsorField id="sponsor-phone" name="contactPhone" label="Phone" type="tel" autoComplete="tel" />
      <div className={`${fieldClass} run-field-wide`}><label htmlFor="sponsor-message">How would you like to support the event? *</label><textarea id="sponsor-message" name="supportMessage" rows={5} minLength={10} maxLength={2000} required /></div>
    </div>
    {siteKey && <div className="cf-turnstile" data-sitekey={siteKey} data-action="event_sponsor_inquiry" />}
    {!configured && <p className="run-form-status" role="status">Sponsor inquiry submission is not configured in this environment.</p>}
    <button className="button button-green" type="submit" disabled={isSubmitting || !configured}>{isSubmitting ? "Submitting…" : "Send sponsor inquiry"} <ArrowRight size={17} /></button>
    <p className="run-form-status" role="status" aria-live="polite">{status}</p>
  </form>;
}

export function EventPage() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute("content");
    document.title = "Miles for Minds: The Wahome Foundation Run | Wahome Foundation";
    description?.setAttribute("content", "Join Miles for Minds on January 9, 2027 at Mugumo Center. Run 21K, 10K, or the children’s 5K to support the Thomas D.K. Wahome Scholarship Program.");
    return () => {
      document.title = previousTitle;
      if (previousDescription != null && description) description.setAttribute("content", previousDescription);
    };
  }, []);
  return <div className="run-page">
    <section className="run-hero"><div className="layout run-hero-inner"><div className="run-hero-copy"><span className="eyebrow">Move for education</span><h1>Miles for Minds:<br /><em>The Wahome Foundation Run</em></h1><p>Join us to support children’s education through the Thomas D.K. Wahome Scholarship Program.</p><div className="run-hero-details"><span><CalendarDays size={18} /> Saturday, January 9, 2027</span><span><Clock3 size={18} /> 7:00 AM</span><span><MapPin size={18} /> Mugumo Center</span></div><div className="run-hero-actions"><button type="button" className="button button-gold" onClick={() => document.getElementById("participant-registration")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Register <ArrowRight size={17} /></button><button type="button" className="button button-outline" onClick={() => document.getElementById("sponsor-inquiry")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Become a Sponsor <HeartHandshake size={17} /></button></div></div></div></section>
    <section className="layout run-details-section"><div className="run-purpose"><span className="eyebrow">Every mile makes a difference</span><h2>Run for the next generation</h2><p>Funds raised support children’s education through the Thomas D.K. Wahome Scholarship Program. Registration is open to everyone. There is no minimum age for the 21K or 10K categories.</p></div><div className="run-category-grid"><article><span>01</span><h3>21K</h3><p>Open to everyone</p><strong>KSh 1,000</strong></article><article><span>02</span><h3>10K</h3><p>Open to everyone</p><strong>KSh 1,000</strong></article><article><span>03</span><h3>Children&apos;s 5K</h3><p>Parent or guardian registers the child</p><strong>KSh 1,000</strong></article></div></section>
    <section className="run-info-band"><div className="layout run-info-grid"><div><span className="eyebrow">Event information</span><h2>Details to follow</h2><p>We’ll share more information when it is confirmed.</p></div><dl><div><dt>Route</dt><dd>To be announced</dd></div><div><dt>Registration deadline</dt><dd>To be announced</dd></div><div><dt>Participant capacity</dt><dd>To be announced</dd></div><div><dt>Event-day guidance</dt><dd>To be announced</dd></div></dl></div></section>
    <section className="layout run-registration-section" id="participant-registration"><RegistrationForm /><aside className="run-payment-note"><span className="eyebrow">Payment & confirmation</span><h2>Secure registration is being set up</h2><p>The existing website has no server-side registration, payment, or verification service. This form will not create a registration or request payment until a secure backend is connected.</p><p>After setup, registration should stay pending until M-Pesa confirms the exact KSh 1,000 payment for that participant. Confirmation messages will follow verified payment only.</p></aside></section>
    <section className="run-poster-section"><div className="layout run-poster-grid"><div className="run-poster-info"><span className="eyebrow">Save the date</span><h2>Invite someone to run with you</h2><p>Download the full event poster to share the details or scan its registration QR code.</p><dl className="run-poster-details"><div><dt>Date</dt><dd>Saturday, January 9, 2027</dd></div><div><dt>Time &amp; venue</dt><dd>7:00 AM · Mugumo Center</dd></div><div><dt>Distances</dt><dd>21K · 10K · Children’s 5K</dd></div><div><dt>Registration</dt><dd>KSh 1,000 per participant</dd></div></dl><p className="run-poster-cause">Every step supports children’s education through the Thomas D.K. Wahome Scholarship Program.</p><PosterDownload /></div><div className="run-poster-preview"><img src={posterImage} alt="Preview of the Miles for Minds run poster. Download the full poster for complete details and its registration QR code." /></div></div></section>
    <section className="layout run-sponsor-section"><SponsorForm /></section>
  </div>;
}
