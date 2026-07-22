"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { Clock, Globe, Sparkles, Mail, Phone, MapPin, Send, Check, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api";

const ParkMap = dynamic(() => import("@/components/ui/ParkMap"), { ssr: false, loading: () => null });

const SERIF = "var(--font-source-serif), Georgia, serif";
const WHATSAPP = "https://wa.me/255786345408";
const ARUSHA = { lat: -3.3869, lng: 36.683 };

// Contact details assembled at runtime (light obfuscation against scrapers).
function useContact() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const email = ready ? `${"info"}@${"kabengosafaris"}.com` : "…";
  const phone = ready ? ["+255", "786", "345", "408"].join(" ") : "…";
  return { ready, email, phone, emailHref: ready ? `mailto:${email}` : "#", phoneHref: ready ? `tel:${phone.replace(/\s/g, "")}` : "#" };
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.4.5c-.2.2-.3.4-.1.6.5.8 1 1.4 1.7 1.9.5.3.8.4 1 .1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.2.1.6-.1 1.2Z" /></svg>;
}
function Arrow({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

const CSS = `
.ctc *{box-sizing:border-box}
.ctc .kfield{width:100%;border:1.5px solid #e4ddd1;background:#fff;border-radius:10px;padding:14px 16px;font-size:15px;color:#2a2018;outline:none;transition:border-color .18s,box-shadow .18s;font-family:inherit}
.ctc .kfield:focus{border-color:#c48f2b;box-shadow:0 0 0 3px #f3e6c8}
.ctc .kfield.err{border-color:#c0492b;box-shadow:0 0 0 3px rgba(192,73,43,.12)}
.ctc .contact-cols{display:grid;grid-template-columns:1fr;gap:22px}
.ctc .find-cols{display:grid;grid-template-columns:1fr;gap:20px}
.ctc .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(min-width:900px){
  .ctc .contact-cols{grid-template-columns:minmax(0,0.85fr) minmax(0,1fr);gap:32px;align-items:stretch}
  .ctc .find-cols{grid-template-columns:1.5fr 1fr;align-items:stretch}
}
@media(prefers-reduced-motion:reduce){.ctc *{animation:none!important;transition:none!important}}
`;

export default function ContactPage() {
  const t = useTranslations("contact");
  const footer = useTranslations("footer");
  const nav = useTranslations("nav");
  const locale = useLocale();
  const contact = useContact();

  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [touched, setTouched] = useState(false);

  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const nameBad = touched && !form.name.trim();
  const emailBad = touched && (!form.email.trim() || !validEmail(form.email));
  const msgBad = touched && !form.message.trim();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !validEmail(form.email) || !form.message.trim()) {
      setTouched(true);
      setStatus("error");
      return;
    }
    setSending(true);
    setStatus("idle");
    try {
      const res = await apiClient.post("/public/contact", form, { headers: { "Accept-Language": locale } });
      if (res.data.success) {
        setStatus("success");
        setTouched(false);
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSending(false);
    }
  };

  const features = [
    { icon: Clock, title: t("featRespTitle"), sub: t("featRespSub") },
    { icon: Globe, title: t("featLangTitle"), sub: t("featLangSub") },
    { icon: Sparkles, title: t("featPersTitle"), sub: t("featPersSub") },
  ];
  const contacts = [
    { icon: <Mail size={18} />, label: t("cEmail"), value: contact.email, href: contact.emailHref },
    { icon: <Phone size={18} />, label: t("cPhone"), value: contact.phone, href: contact.phoneHref },
    { icon: <MapPin size={18} />, label: t("cOffice"), value: t("addressValue"), href: "#find" },
  ];

  return (
    <div className="ctc" style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", background: "linear-gradient(175deg,#faf8f5,#f1ece3 150%)", color: "#4a3f34", overflowX: "clip" }}>
      <style>{CSS}</style>

      {/* HERO */}
      <header style={{ textAlign: "center", padding: "clamp(104px,15vh,150px) clamp(18px,5vw,56px) clamp(20px,3vw,32px)", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ color: "#96631a", fontSize: 12, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 14 }}>{t("heroEyebrow")}</div>
        <h1 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(32px,5.2vw,54px)", lineHeight: 1.04, letterSpacing: "-.015em", margin: "0 0 14px" }}>{t("heroTitle")}</h1>
        <p style={{ color: "#4a3f34", fontSize: "clamp(16px,2vw,19px)", lineHeight: 1.55, margin: "0 0 22px" }}>{t("heroSubtitle")}</p>
        <div className="flex flex-wrap justify-center" style={{ gap: 10 }}>
          <span className="inline-flex items-center" style={{ gap: 7, background: "#fff", border: "1px solid #e4ddd1", borderRadius: 20, padding: "8px 15px", fontSize: 13, fontWeight: 500, color: "#4a3f34" }}><span style={{ color: "#c48f2b", letterSpacing: 1 }}>★★★★★</span>5.0 Tripadvisor</span>
          <span className="inline-flex items-center" style={{ gap: 7, background: "#fff", border: "1px solid #e4ddd1", borderRadius: 20, padding: "8px 15px", fontSize: 13, fontWeight: 500, color: "#4a3f34" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#96631a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>{t("licensedBadge")}</span>
        </div>
      </header>

      <main style={{ maxWidth: 1160, margin: "0 auto", padding: "clamp(20px,3vw,32px) clamp(18px,5vw,56px) 0" }}>
        {/* TWO-COLUMN */}
        <div className="contact-cols" style={{ marginBottom: "clamp(40px,6vw,64px)" }}>
          {/* LEFT: reassurance panel */}
          <aside style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg,#1b3717,#12280f)", borderRadius: 20, padding: "clamp(26px,3.4vw,38px)", color: "#faf8f5", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative" }}>
              <div style={{ color: "#c48f2b", fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 12 }}>{t("panelEyebrow")}</div>
              <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(24px,3vw,30px)", lineHeight: 1.15, margin: "0 0 10px" }}>{t("panelTitle")}</h2>
              <p style={{ color: "rgba(242,236,224,.8)", fontSize: 15, lineHeight: 1.6, margin: "0 0 26px" }}>{t("panelSub")}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
                {features.map((f) => (
                  <div key={f.title} className="flex items-start" style={{ gap: 13 }}>
                    <span className="flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(196,143,43,.2)", color: "#c48f2b" }}><f.icon size={17} /></span>
                    <div><div style={{ fontWeight: 600, color: "#fff", fontSize: 15, marginBottom: 2 }}>{f.title}</div><div style={{ color: "rgba(242,236,224,.72)", fontSize: 13.5, lineHeight: 1.45 }}>{f.sub}</div></div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 24, borderTop: "1px solid rgba(242,236,224,.16)" }}>
                {contacts.map((c) => (
                  <a key={c.label} href={c.href} className="flex items-center" style={{ gap: 13, padding: "12px 0", color: "#faf8f5" }}>
                    <span className="flex-shrink-0" style={{ color: "#c48f2b", display: "flex" }}>{c.icon}</span>
                    <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: "rgba(242,236,224,.6)", textTransform: "uppercase", letterSpacing: ".05em" }}>{c.label}</div><div style={{ fontWeight: 600, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.value}</div></div>
                  </a>
                ))}
              </div>

              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center" style={{ gap: 9, marginTop: 20, background: "#00aa6c", color: "#fff", fontWeight: 600, fontSize: 15, borderRadius: 10, padding: 14 }}><WhatsAppIcon />{footer("whatsapp")}</a>

              <div className="flex items-center justify-between" style={{ marginTop: 20, padding: "15px 17px", background: "rgba(242,236,224,.08)", border: "1px solid rgba(242,236,224,.16)", borderRadius: 12, gap: 12 }}>
                <span style={{ fontSize: 13.5, color: "rgba(242,236,224,.85)", lineHeight: 1.4 }}>{t("crossSell")}</span>
                <Link href="/plan" className="inline-flex items-center flex-shrink-0" style={{ gap: 6, color: "#c48f2b", fontWeight: 600, fontSize: 13.5 }}>{nav("planYourSafari")}<Arrow size={14} /></Link>
              </div>
            </div>
          </aside>

          {/* RIGHT: form / success */}
          <section style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 20, boxShadow: "0 18px 48px rgba(62,21,2,.1)", padding: "clamp(24px,3.4vw,38px)", display: "flex", flexDirection: "column" }}>
            {status === "success" ? (
              <div style={{ margin: "auto", textAlign: "center", padding: "20px 0" }}>
                <div className="flex items-center justify-center" style={{ width: 78, height: 78, borderRadius: "50%", background: "#e6ece2", margin: "0 auto 22px" }}><Check size={38} color="#274e22" strokeWidth={2.6} /></div>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.2vw,32px)", margin: "0 0 12px" }}>{t("successTitle")}</h2>
                <p style={{ color: "#4a3f34", fontSize: 16, lineHeight: 1.6, maxWidth: 400, margin: "0 auto 26px" }}>{t("successBody")}</p>
                <button onClick={() => setStatus("idle")} style={{ background: "#274e22", color: "#faf8f5", fontWeight: 600, fontSize: 15, border: "none", borderRadius: 9, padding: "13px 26px", cursor: "pointer" }}>{t("sendAnother")}</button>
              </div>
            ) : (
              <div>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(22px,2.8vw,28px)", margin: "0 0 6px" }}>{t("formH2")}</h2>
                <p style={{ color: "#7a6f61", fontSize: 14.5, margin: "0 0 24px" }}>{t("requiredNote")}</p>

                {status === "error" && (
                  <div className="flex items-center" style={{ gap: 10, background: "rgba(192,73,43,.08)", border: "1px solid rgba(192,73,43,.3)", borderRadius: 10, padding: "12px 15px", marginBottom: 20, color: "#9a3412", fontSize: 13.5 }}>
                    <AlertCircle size={17} className="flex-shrink-0" />{t("errorMsg")}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <label><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4a3f34", marginBottom: 7 }}>{t("name")} *</span><input value={form.name} onChange={(e) => set("name", e.target.value)} className={`kfield ${nameBad ? "err" : ""}`} placeholder="Amani Mushi" /></label>
                    <label><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4a3f34", marginBottom: 7 }}>{t("email")} *</span><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={`kfield ${emailBad ? "err" : ""}`} placeholder="you@email.com" /></label>
                    <label style={{ gridColumn: "1/-1" }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4a3f34", marginBottom: 7 }}>{t("phone")}</span><input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="kfield" placeholder="+44 712 345 678" /></label>
                    <label style={{ gridColumn: "1/-1" }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4a3f34", marginBottom: 7 }}>{t("subject")}</span><input value={form.subject} onChange={(e) => set("subject", e.target.value)} className="kfield" placeholder={t("subjectPlaceholder")} /></label>
                    <label style={{ gridColumn: "1/-1" }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4a3f34", marginBottom: 7 }}>{t("message")} *</span><textarea rows={5} value={form.message} onChange={(e) => set("message", e.target.value)} className={`kfield ${msgBad ? "err" : ""}`} style={{ resize: "vertical", lineHeight: 1.6 }} placeholder={t("messagePlaceholder")} /></label>
                  </div>
                  <button type="submit" disabled={sending} className="flex items-center justify-center" style={{ width: "100%", gap: 9, marginTop: 22, background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 16, border: "none", borderRadius: 10, padding: 16, cursor: "pointer", boxShadow: "0 8px 22px rgba(196,143,43,.4)", opacity: sending ? 0.7 : 1 }}>{sending ? t("sending") : t("send")}<Send size={17} /></button>
                  <p style={{ textAlign: "center", color: "#7a6f61", fontSize: 12.5, margin: "14px 0 0" }}>🔒 {t("privacyNote")}</p>
                </form>
              </div>
            )}
          </section>
        </div>

        {/* FIND US */}
        <section id="find" aria-label={t("findTitle")} style={{ marginBottom: "clamp(40px,6vw,64px)" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.2vw,34px)", margin: "0 0 18px" }}>{t("findTitle")}</h2>
          <div className="find-cols">
            <div style={{ position: "relative", border: "1px solid #e4ddd1", borderRadius: 16, overflow: "hidden", minHeight: 300, isolation: "isolate", boxShadow: "0 10px 30px rgba(62,21,2,.08)" }}>
              <ParkMap latitude={ARUSHA.lat} longitude={ARUSHA.lng} name="Kabengo Safaris · Arusha" zoom={12} />
            </div>
            <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 16, padding: 24 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 18, marginBottom: 16 }}>{t("ourOffice")}</div>
              <div className="flex" style={{ gap: 12, padding: "12px 0", borderBottom: "1px solid #e4ddd1" }}>
                <span className="flex-shrink-0" style={{ color: "#96631a", display: "flex", marginTop: 1 }}><MapPin size={18} /></span>
                <div><div style={{ fontSize: 12, color: "#7a6f61", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>{t("addressLabel")}</div><div style={{ fontWeight: 500, color: "#2a2018", fontSize: 14.5, lineHeight: 1.45, whiteSpace: "pre-line" }}>{t("addressLines")}</div></div>
              </div>
              <div className="flex" style={{ gap: 12, padding: "12px 0", borderBottom: "1px solid #e4ddd1" }}>
                <span className="flex-shrink-0" style={{ color: "#96631a", display: "flex", marginTop: 1 }}><Clock size={18} /></span>
                <div><div style={{ fontSize: 12, color: "#7a6f61", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>{t("officeHoursLabel")}</div><div style={{ fontWeight: 500, color: "#2a2018", fontSize: 14.5, lineHeight: 1.45 }}>{t("officeHoursValue")}</div></div>
              </div>
              <p style={{ color: "#7a6f61", fontSize: 13.5, lineHeight: 1.55, margin: "14px 0 0" }}>{t("officeNote")}</p>
            </div>
          </div>
        </section>
      </main>

      {/* CONVERSION BAND */}
      <section style={{ position: "relative", overflow: "hidden", background: "#3d1402", padding: "clamp(48px,7vw,84px) clamp(18px,5vw,56px)" }}>
        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <div style={{ color: "#c48f2b", fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 14 }}>{t("bandEyebrow")}</div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(28px,4.2vw,46px)", lineHeight: 1.08, margin: "0 0 16px" }}>{t("bandTitle")}</h2>
          <p style={{ color: "rgba(242,236,224,.82)", fontSize: 17, lineHeight: 1.6, margin: "0 auto 30px", maxWidth: 520 }}>{t("bandBody")}</p>
          <div className="flex flex-wrap justify-center" style={{ gap: 12 }}>
            <Link href="/plan" className="inline-flex items-center" style={{ gap: 9, background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 16, borderRadius: 9, padding: "16px 30px", boxShadow: "0 10px 30px rgba(196,143,43,.4)" }}>{nav("planYourSafari")}<Arrow size={17} /></Link>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center" style={{ gap: 9, background: "rgba(242,236,224,.1)", color: "#fff", fontWeight: 600, fontSize: 16, border: "1.5px solid rgba(242,236,224,.4)", borderRadius: 9, padding: "15px 26px" }}><WhatsAppIcon />{footer("whatsapp")}</a>
          </div>
        </div>
      </section>
    </div>
  );
}
