import { useEffect, useState } from "react";
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

function FormField({ id, label, type = "text", required = true, min, autoComplete }: { id: string; label: string; type?: string; required?: boolean; min?: number; autoComplete?: string }) {
  return <div className={fieldClass}><label htmlFor={id}>{label}{required ? " *" : ""}</label><input id={id} name={id} type={type} required={required} min={min} autoComplete={autoComplete} pattern={type === "tel" ? "[+0-9() .-]{7,20}" : undefined} title={type === "tel" ? "Enter a phone number using 7 to 20 digits or common phone punctuation." : undefined} /></div>;
}

function RegistrationForm() {
  const [category, setCategory] = useState<Category>("21K");
  const [status, setStatus] = useState("");
  const child = category === "Children's 5K";

  return <form className="run-form" onSubmit={(event) => { event.preventDefault(); setStatus("Registration is not configured yet. This site has no secure registration service or payment verification endpoint, so your details were not sent or saved."); }}>
    <div className="run-form-heading"><span className="eyebrow">Participant registration</span><h2>Take your place at the start</h2><p>Registration fee: <strong>KSh 1,000 per participant</strong> for all categories.</p></div>
    {child && <div className="run-notice" role="note"><strong>Children’s 5K:</strong> A parent or guardian must complete this form. Their details will serve as the child’s emergency contact.</div>}
    <div className="run-form-grid">
      <FormField id="participant-name" label="Participant full name" autoComplete="name" />
      <FormField id="participant-age" label="Participant age in years" type="number" min={0} />
      <FormField id="participant-phone" label="Participant phone" type="tel" autoComplete="tel" />
      <FormField id="participant-email" label="Participant email (or guardian email for a child)" type="email" autoComplete="email" />
      <div className={fieldClass}><label htmlFor="run-category">Category *</label><select id="run-category" name="category" required value={category} onChange={(event) => { setCategory(event.target.value as Category); setStatus(""); }}><option>21K</option><option>10K</option><option>Children&apos;s 5K</option></select></div>
      {child ? <>
        <FormField id="guardian-name" label="Parent or guardian full name" autoComplete="name" />
        <FormField id="guardian-phone" label="Parent or guardian phone" type="tel" autoComplete="tel" />
        <FormField id="guardian-email" label="Parent or guardian email" type="email" autoComplete="email" />
      </> : <>
        <FormField id="emergency-name" label="Emergency contact full name" />
        <FormField id="emergency-phone" label="Emergency contact phone" type="tel" />
      </>}
    </div>
    <label className="run-consent"><input type="checkbox" required /> <span>I confirm I am sharing this information for event registration and consent to its use for event coordination and safety. I will only provide a child’s information as their parent or guardian. *</span></label>
    <p className="run-privacy">Participant and child information should be handled by the event team only for registration, safety, and event updates. This page does not currently transmit or store your details.</p>
    <button className="button button-green" type="submit">Continue registration <ArrowRight size={17} /></button>
    <p className="run-form-status" role="status" aria-live="polite">{status}</p>
  </form>;
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
    <section className="run-hero"><div className="layout run-hero-inner"><div className="run-hero-copy"><span className="eyebrow">Move for education</span><h1>Miles for Minds:<br /><em>The Wahome Foundation Run</em></h1><p>Join us to support children’s education through the Thomas D.K. Wahome Scholarship Program.</p><div className="run-hero-details"><span><CalendarDays size={18} /> Saturday, January 9, 2027</span><span><Clock3 size={18} /> 7:00 AM</span><span><MapPin size={18} /> Mugumo Center</span></div><div className="run-hero-actions"><a className="button button-gold" href="#participant-registration">Register <ArrowRight size={17} /></a><a className="button button-outline" href="#sponsor-inquiry">Become a Sponsor <HeartHandshake size={17} /></a></div></div></div></section>
    <section className="layout run-details-section"><div className="run-purpose"><span className="eyebrow">Every mile makes a difference</span><h2>Run for the next generation</h2><p>Funds raised support children’s education through the Thomas D.K. Wahome Scholarship Program. Registration is open to everyone. There is no minimum age for the 21K or 10K categories.</p></div><div className="run-category-grid"><article><span>01</span><h3>21K</h3><p>Open to everyone</p><strong>KSh 1,000</strong></article><article><span>02</span><h3>10K</h3><p>Open to everyone</p><strong>KSh 1,000</strong></article><article><span>03</span><h3>Children&apos;s 5K</h3><p>Parent or guardian registers the child</p><strong>KSh 1,000</strong></article></div></section>
    <section className="run-info-band"><div className="layout run-info-grid"><div><span className="eyebrow">Event information</span><h2>Details to follow</h2><p>We’ll share more information when it is confirmed.</p></div><dl><div><dt>Route</dt><dd>To be announced</dd></div><div><dt>Registration deadline</dt><dd>To be announced</dd></div><div><dt>Participant capacity</dt><dd>To be announced</dd></div><div><dt>Event-day guidance</dt><dd>To be announced</dd></div></dl></div></section>
    <section className="layout run-registration-section" id="participant-registration"><RegistrationForm /><aside className="run-payment-note"><span className="eyebrow">Payment & confirmation</span><h2>Secure registration is being set up</h2><p>The existing website has no server-side registration, payment, or verification service. This form will not create a registration or request payment until a secure backend is connected.</p><p>After setup, registration should stay pending until M-Pesa confirms the exact KSh 1,000 payment for that participant. Confirmation messages will follow verified payment only.</p></aside></section>
    <section className="run-poster-section"><div className="layout run-poster-grid"><div><span className="eyebrow">Share the date</span><h2>Invite someone to run with you</h2><p>Download the event poster to share the confirmed event details.</p><PosterDownload /></div><div className="run-poster-preview" aria-label="Event poster preview"><div className="run-poster-photo" style={{ backgroundImage: `linear-gradient(0deg, #10202fe0, transparent 80%), url(${runPhoto})` }}><img src={foundationLogo} alt="Wahome Foundation" /><div><span>Run for a brighter future</span><strong>Miles for Minds:</strong><b>The Wahome Foundation Run</b></div></div><div className="run-poster-copy"><strong>Saturday, January 9, 2027 · 7:00 AM</strong><span>Mugumo Center</span><b>21K · 10K · Children’s 5K</b><b>KSh 1,000 per participant</b><p>Supporting children’s education through the Thomas D.K. Wahome Scholarship Program.</p></div></div></div></section>
    <section className="layout run-sponsor-section"><SponsorForm /></section>
  </div>;
}
