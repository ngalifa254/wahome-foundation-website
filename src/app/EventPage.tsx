import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, CalendarDays, Clock3, MapPin, HeartHandshake } from "lucide-react";
import runPhoto from "@/imports/marathon1.jpg";
import foundationLogo from "@/imports/mainlogo.png";

type Category = "21K" | "10K" | "Children's 5K";

const fieldClass = "run-field";

function PosterDownload() {
  const [message, setMessage] = useState("");

  const download = async () => {
    setMessage("");
    try {
      const [photo, logo] = await Promise.all([runPhoto, foundationLogo].map((src) => new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Poster artwork could not be loaded."));
        image.src = src;
      })));
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Poster image could not be created.");

      ctx.fillStyle = "#F1F4F7";
      ctx.fillRect(0, 0, 1080, 1350);
      const imageHeight = 520;
      const scale = Math.max(1080 / photo.width, imageHeight / photo.height);
      const sw = 1080 / scale;
      const sh = imageHeight / scale;
      ctx.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, 0, 0, 1080, imageHeight);
      const shade = ctx.createLinearGradient(0, 0, 0, imageHeight);
      shade.addColorStop(0, "rgba(16,32,47,.2)");
      shade.addColorStop(1, "rgba(16,32,47,.86)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, 1080, imageHeight);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(64, 52, 270, 94);
      ctx.drawImage(logo, 80, 61, 238, 77);
      ctx.fillStyle = "#E8C67D";
      ctx.font = "600 25px Montserrat, Arial, sans-serif";
      ctx.fillText("RUN FOR A BRIGHTER FUTURE", 74, 367);
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 61px Montserrat, Arial, sans-serif";
      ctx.fillText("Miles for Minds:", 72, 435);
      ctx.font = "500 40px Montserrat, Arial, sans-serif";
      ctx.fillText("The Wahome Foundation Run", 74, 488);

      ctx.fillStyle = "#2C6E9E";
      ctx.fillRect(0, imageHeight, 1080, 830);
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 32px Montserrat, Arial, sans-serif";
      ctx.fillText("SATURDAY, JANUARY 9, 2027", 72, 604);
      ctx.font = "500 28px Montserrat, Arial, sans-serif";
      ctx.fillText("7:00 AM  ·  MUGUMO CENTER", 72, 658);
      ctx.fillStyle = "#E8C67D";
      ctx.font = "700 26px Montserrat, Arial, sans-serif";
      ctx.fillText("CHOOSE YOUR DISTANCE", 72, 738);
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 43px Montserrat, Arial, sans-serif";
      ctx.fillText("21K   ·   10K   ·   CHILDREN'S 5K", 72, 801);
      ctx.fillStyle = "#16324A";
      ctx.fillRect(72, 846, 360, 78);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 34px Montserrat, Arial, sans-serif";
      ctx.fillText("KSh 1,000 per participant", 91, 897);
      ctx.fillStyle = "#E8C67D";
      ctx.font = "600 23px Montserrat, Arial, sans-serif";
      ctx.fillText("EVERY STEP SUPPORTS EDUCATION", 72, 1010);
      ctx.fillStyle = "#ffffff";
      ctx.font = "500 29px Montserrat, Arial, sans-serif";
      ctx.fillText("Supporting children through the", 72, 1072);
      ctx.font = "600 29px Montserrat, Arial, sans-serif";
      ctx.fillText("Thomas D.K. Wahome Scholarship Program", 72, 1115);
      ctx.fillStyle = "#dce6ee";
      ctx.font = "500 22px Montserrat, Arial, sans-serif";
      ctx.fillText("Open to everyone · Children’s 5K registrations by a parent or guardian", 72, 1210);
      ctx.fillStyle = "#16324A";
      ctx.fillRect(0, 1290, 1080, 60);
      ctx.fillStyle = "#ffffff";
      ctx.font = "500 19px Montserrat, Arial, sans-serif";
      ctx.fillText("WAHOME FOUNDATION", 72, 1328);

      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Poster image could not be downloaded.")), "image/png"));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "miles-for-minds-wahome-foundation-run.png";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Poster downloaded as a PNG image.");
    } catch {
      setMessage("The poster could not be created. Please try again.");
    }
  };

  return <div className="run-poster-action"><button type="button" className="button button-green" onClick={download}><ArrowDownToLine size={17} /> Download event poster</button><span aria-live="polite">{message}</span></div>;
}

function FormField({ id, label, type = "text", required = true, min, autoComplete, error, onChange, inputRef }: { id: string; label: string; type?: string; required?: boolean; min?: number; autoComplete?: string; error?: string; onChange?: () => void; inputRef?: React.Ref<HTMLInputElement> }) {
  return <div className={fieldClass}><label htmlFor={id}>{label}{required ? " *" : ""}</label><input ref={inputRef} id={id} name={id} type={type} required={required} min={min} autoComplete={autoComplete} pattern={type === "tel" ? "[+0-9() .-]{7,20}" : undefined} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} onChange={onChange} />{error && <p className="run-field-error" id={`${id}-error`}>{error}</p>}</div>;
}

function RegistrationForm() {
  const [category, setCategory] = useState<Category>("21K");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const child = category === "Children's 5K";

  const clearFieldError = (id: string) => setErrors((current) => {
    if (!current[id]) return current;
    const next = { ...current };
    delete next[id];
    return next;
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const value = (id: string) => String(values.get(id) ?? "").trim();
    const next: Record<string, string> = {};
    const fullName = value("participant-name");
    if (!fullName) next["participant-name"] = "Enter the participant’s full name.";
    else if (fullName.split(/\s+/).length < 2) next["participant-name"] = "Enter both the participant’s first and last name.";
    const age = value("participant-age");
    if (!age) next["participant-age"] = "Enter the participant’s age in years.";
    else if (!Number.isInteger(Number(age)) || Number(age) < 0) next["participant-age"] = "Enter a whole-number age of zero or older.";
    const phonePattern = /^\+?[0-9][0-9\s().-]{6,18}$/;
    const validatePhone = (id: string, label: string) => {
      const phone = value(id);
      if (!phone) next[id] = `Enter ${label}.`;
      else if (!phonePattern.test(phone) || phone.replace(/\D/g, "").length < 7) next[id] = "Enter a valid phone number with at least 7 digits.";
    };
    validatePhone("participant-phone", "a participant phone number");
    const email = value("participant-email");
    if (!email) next["participant-email"] = "Enter an email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next["participant-email"] = "Enter a valid email address, such as name@example.com.";
    if (child) {
      const guardian = value("guardian-name");
      if (!guardian) next["guardian-name"] = "Enter the parent or guardian’s full name.";
      else if (guardian.split(/\s+/).length < 2) next["guardian-name"] = "Enter both the parent or guardian’s first and last name.";
      validatePhone("guardian-phone", "a parent or guardian phone number");
      const guardianEmail = value("guardian-email");
      if (!guardianEmail) next["guardian-email"] = "Enter the parent or guardian’s email address.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) next["guardian-email"] = "Enter a valid parent or guardian email address.";
    } else {
      const contactName = value("emergency-name");
      if (!contactName) next["emergency-name"] = "Enter the emergency contact’s full name.";
      else if (contactName.split(/\s+/).length < 2) next["emergency-name"] = "Enter both the emergency contact’s first and last name.";
      validatePhone("emergency-phone", "an emergency contact phone number");
    }
    if (!values.get("consent")) next.consent = "Consent is required before continuing.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      const firstInvalid = Object.keys(next)[0];
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setConfirmationOpen(true);
  };

  return <>
  <form className="run-form" noValidate hidden={confirmationOpen} onSubmit={handleSubmit}>
    <div className="run-form-heading"><span className="eyebrow">Participant registration · demo form</span><h2 id="registration-form-heading">Register for Miles for Minds</h2><p>One participant per submission. Fee: <strong>KSh 1,000 per participant</strong> in every category.</p></div>
    {child && <div className="run-notice" role="note"><strong>Children’s 5K:</strong> A parent or guardian must complete this form. The parent or guardian is the child’s emergency contact, so their details are collected once below.</div>}
    <div className="run-form-grid">
      <FormField inputRef={firstFieldRef} id="participant-name" label="Participant full name" autoComplete="name" error={errors["participant-name"]} onChange={() => clearFieldError("participant-name")} />
      <FormField id="participant-age" label="Participant age in years" type="number" min={0} error={errors["participant-age"]} onChange={() => clearFieldError("participant-age")} />
      <FormField id="participant-phone" label="Participant phone" type="tel" autoComplete="tel" error={errors["participant-phone"]} onChange={() => clearFieldError("participant-phone")} />
      <FormField id="participant-email" label="Participant email" type="email" autoComplete="email" error={errors["participant-email"]} onChange={() => clearFieldError("participant-email")} />
      <div className={fieldClass}><label htmlFor="run-category">Selected category *</label><select id="run-category" name="category" required value={category} aria-invalid={errors.category ? true : undefined} aria-describedby={errors.category ? "run-category-error" : undefined} onChange={(event) => { setCategory(event.target.value as Category); setErrors({}); }}><option>21K</option><option>10K</option><option>Children&apos;s 5K</option></select>{errors.category && <p className="run-field-error" id="run-category-error">{errors.category}</p>}</div>
      {child ? <>
        <FormField id="guardian-name" label="Parent or guardian full name" autoComplete="name" error={errors["guardian-name"]} onChange={() => clearFieldError("guardian-name")} />
        <FormField id="guardian-phone" label="Parent or guardian phone (emergency contact)" type="tel" autoComplete="tel" error={errors["guardian-phone"]} onChange={() => clearFieldError("guardian-phone")} />
        <FormField id="guardian-email" label="Parent or guardian email" type="email" autoComplete="email" error={errors["guardian-email"]} onChange={() => clearFieldError("guardian-email")} />
      </> : <>
        <FormField id="emergency-name" label="Emergency contact full name" error={errors["emergency-name"]} onChange={() => clearFieldError("emergency-name")} />
        <FormField id="emergency-phone" label="Emergency contact phone" type="tel" error={errors["emergency-phone"]} onChange={() => clearFieldError("emergency-phone")} />
      </>}
    </div>
    <div className="run-registration-review" aria-live="polite"><span>Registration review</span><strong>{category}</strong><b>KSh 1,000</b></div>
    <label className="run-consent"><input id="consent" name="consent" type="checkbox" required aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? "consent-error" : undefined} onChange={() => clearFieldError("consent")} /> <span>I confirm this information is being provided for event registration and safety. For a child, I am their parent or guardian and consent to provide their information. *</span></label>
    {errors.consent && <p className="run-field-error run-consent-error" id="consent-error">{errors.consent}</p>}
    <p className="run-privacy">This frontend-only demonstration keeps form values in page memory while you interact with it. It does not transmit or persist participant or child information.</p>
    <button className="button button-green" type="submit">Preview demo submission <ArrowRight size={17} /></button>
  </form>
  {confirmationOpen && <section className="run-form run-demo-confirmation" role="status" aria-labelledby="run-demo-heading">
    <span className="run-demo-label">Demo only</span>
    <h2 id="run-demo-heading">Demo confirmation</h2>
    <p>This is only a form mockup. Your details were not saved, no payment was taken, and this is not a completed registration.</p>
    <button type="button" className="button button-green" onClick={() => { setConfirmationOpen(false); window.setTimeout(() => firstFieldRef.current?.focus(), 0); }}>Close confirmation and return to the form</button>
  </section>}
  </>;
}

function SponsorForm() {
  const [status, setStatus] = useState("");
  return <form id="sponsor-inquiry" className="run-form" onSubmit={(event) => { event.preventDefault(); setStatus("Sponsor inquiries are not configured yet. No destination is connected, so your details were not sent or saved. Submitting an inquiry does not confirm sponsorship."); }}>
    <div className="run-form-heading"><span className="eyebrow">Partner with the run</span><h2>Become a Sponsor</h2><p>Tell us how you would like to support this event. The team can follow up once an inquiry destination is configured.</p></div>
    <div className="run-form-grid">
      <FormField id="sponsor-contact" label="Contact name" autoComplete="name" />
      <FormField id="sponsor-organization" label="Organization (optional)" required={false} autoComplete="organization" />
      <FormField id="sponsor-email" label="Email" type="email" autoComplete="email" />
      <FormField id="sponsor-phone" label="Phone" type="tel" autoComplete="tel" />
      <div className={`${fieldClass} run-field-wide`}><label htmlFor="sponsor-message">How would you like to support the event? *</label><textarea id="sponsor-message" name="message" rows={5} required /></div>
    </div>
    <button className="button button-green" type="submit">Send sponsor inquiry <ArrowRight size={17} /></button>
    <p className="run-form-status" role="status" aria-live="polite">{status}</p>
  </form>;
}

export function EventPage() {
  useEffect(() => {
    const scrollToRouteSection = () => {
      const hash = window.location.hash;
      const targetId = hash === "#/miles-for-minds/registration"
        ? "participant-registration"
        : hash === "#/miles-for-minds/sponsor"
          ? "sponsor-inquiry"
          : null;
      if (targetId) window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      else if (hash === "#/miles-for-minds") window.scrollTo({ top: 0, behavior: "smooth" });
    };
    scrollToRouteSection();
    window.addEventListener("hashchange", scrollToRouteSection);
    return () => window.removeEventListener("hashchange", scrollToRouteSection);
  }, []);
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute("content");
    document.title = "Miles for Minds: The Wahome Foundation Run | Wahome Foundation";
    description?.setAttribute("content", "Join Miles for Minds on January 9, 2027 at Mugumo Center. Run 21K, 10K, or the children’s 5K to support the Thomas D.K. Wahome Scholarship Program.");
    return () => {
      document.title = previousTitle;
      if (previousDescription !== null && description) description.setAttribute("content", previousDescription);
    };
  }, []);
  return <div className="run-page">
    <section className="run-hero"><div className="layout run-hero-inner"><div className="run-hero-copy"><span className="eyebrow">Move for education</span><h1>Miles for Minds:<br /><em>The Wahome Foundation Run</em></h1><p>Join us to support children’s education through the Thomas D.K. Wahome Scholarship Program.</p><div className="run-hero-details"><span><CalendarDays size={18} /> Saturday, January 9, 2027</span><span><Clock3 size={18} /> 7:00 AM</span><span><MapPin size={18} /> Mugumo Center</span></div><div className="run-hero-actions"><a className="button button-gold" href="#/miles-for-minds/registration">Register <ArrowRight size={17} /></a><a className="button button-outline" href="#/miles-for-minds/sponsor">Become a Sponsor <HeartHandshake size={17} /></a></div></div></div></section>
    <section className="layout run-details-section"><div className="run-purpose"><span className="eyebrow">Every mile makes a difference</span><h2>Run for the next generation</h2><p>Funds raised support children’s education through the Thomas D.K. Wahome Scholarship Program. Registration is open to everyone. There is no minimum age for the 21K or 10K categories.</p></div><div className="run-category-grid"><article><span>01</span><h3>21K</h3><p>Open to everyone</p><strong>KSh 1,000</strong></article><article><span>02</span><h3>10K</h3><p>Open to everyone</p><strong>KSh 1,000</strong></article><article><span>03</span><h3>Children&apos;s 5K</h3><p>Parent or guardian registers the child</p><strong>KSh 1,000</strong></article></div></section>
    <section className="run-info-band"><div className="layout run-info-grid"><div><span className="eyebrow">Event information</span><h2>Details to follow</h2><p>We’ll share more information when it is confirmed.</p></div><dl><div><dt>Route</dt><dd>To be announced</dd></div><div><dt>Registration deadline</dt><dd>To be announced</dd></div><div><dt>Participant capacity</dt><dd>To be announced</dd></div><div><dt>Event-day guidance</dt><dd>To be announced</dd></div></dl></div></section>
    <section className="layout run-registration-section" id="participant-registration"><RegistrationForm /><aside className="run-payment-note"><span className="eyebrow">Payment & confirmation</span><h2>Secure registration is being set up</h2><p>The existing website has no server-side registration, payment, or verification service. This form will not create a registration or request payment until a secure backend is connected.</p><p>After setup, registration should stay pending until M-Pesa confirms the exact KSh 1,000 payment for that participant. Confirmation messages will follow verified payment only.</p></aside></section>
    <section className="run-poster-section"><div className="layout run-poster-grid"><div><span className="eyebrow">Share the date</span><h2>Invite someone to run with you</h2><p>Download the event poster to share the confirmed event details.</p><PosterDownload /></div><div className="run-poster-preview" aria-label="Event poster preview"><div className="run-poster-photo" style={{ backgroundImage: `linear-gradient(0deg, #10202fe0, transparent 80%), url(${runPhoto})` }}><img src={foundationLogo} alt="Wahome Foundation" /><div><span>Run for a brighter future</span><strong>Miles for Minds:</strong><b>The Wahome Foundation Run</b></div></div><div className="run-poster-copy"><strong>Saturday, January 9, 2027 · 7:00 AM</strong><span>Mugumo Center</span><b>21K · 10K · Children’s 5K</b><b>KSh 1,000 per participant</b><p>Supporting children’s education through the Thomas D.K. Wahome Scholarship Program.</p></div></div></div></section>
    <section className="layout run-sponsor-section"><SponsorForm /></section>
  </div>;
}
