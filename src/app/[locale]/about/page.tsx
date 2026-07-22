"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MapPin, Route, ShieldCheck, Leaf, Target, Eye, Check, Globe, Layers, Star } from "lucide-react";
import { apiClient } from "@/lib/api";

const SERIF = "var(--font-source-serif), Georgia, serif";
const WHATSAPP = "https://wa.me/255786345408";

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.4.5c-.2.2-.3.4-.1.6.5.8 1 1.4 1.7 1.9.5.3.8.4 1 .1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.2.1.6-.1 1.2Z" /></svg>;
}
function Arrow({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

const CSS = `
.abt *{box-sizing:border-box}
.abt .two{display:grid;grid-template-columns:1fr;gap:20px}
.abt .four{display:grid;grid-template-columns:1fr;gap:16px}
.abt .three{display:grid;grid-template-columns:1fr;gap:18px}
.abt .trust4{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
@media(min-width:720px){ .abt .four{grid-template-columns:repeat(2,1fr)} .abt .three{grid-template-columns:repeat(3,1fr)} }
@media(min-width:900px){ .abt .two{grid-template-columns:1fr 1fr;gap:28px;align-items:center} .abt .trust4{grid-template-columns:repeat(4,1fr)} }
@media(min-width:1024px){ .abt .four{grid-template-columns:repeat(4,1fr)} }
@media(prefers-reduced-motion:reduce){.abt *{animation:none!important;transition:none!important}}
`;

export default function AboutPage() {
  const t = useTranslations("about");
  const nav = useTranslations("nav");
  const footer = useTranslations("footer");
  const locale = useLocale();

  const [heroImg, setHeroImg] = useState<string | null>(null);
  const [trip, setTrip] = useState<{ rating: number; count: number }>({ rating: 5, count: 5 });

  useEffect(() => {
    let alive = true;
    apiClient.get("/public/heroes", { params: { heroPage: "ABOUT" }, headers: { "Accept-Language": locale } })
      .then((res) => { if (alive && res.data.success && res.data.data?.length) setHeroImg(res.data.data[0]?.primaryImageUrl || null); })
      .catch(() => {});
    apiClient.get("/public/testimonies/summary", { headers: { "Accept-Language": locale } })
      .then((res) => { const d = res.data?.data; if (alive && res.data?.success && d?.reviewCount > 0 && d?.averageRating) setTrip({ rating: d.averageRating, count: d.reviewCount }); })
      .catch(() => {});
    return () => { alive = false; };
  }, [locale]);

  const heroBg = heroImg ? `50% 42%/cover no-repeat url('${heroImg}')` : "linear-gradient(150deg,#6b7a3a,#3e3117 60%,#1b3717)";
  const rating = trip.rating.toFixed(1);

  const heroChips = [
    { el: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>{t("licensedBadge")}</> },
    { el: <><span style={{ color: "#c48f2b", letterSpacing: 1, fontSize: 12 }}>★★★★★</span>{rating} Tripadvisor</> },
    { el: <><Globe size={15} />{t("chipMultilingual")}</> },
  ];

  const trust = [
    { icon: <Star size={26} />, value: `${rating} / 5`, label: t("trustRatedLabel", { count: trip.count }) },
    { icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>, value: "TATO / TALA", label: t("trustLicensedLabel") },
    { icon: <Globe size={26} />, value: t("trustLangValue"), label: t("trustLangLabel") },
    { icon: <Layers size={26} />, value: t("trustPrivateValue"), label: t("trustPrivateLabel") },
  ];

  const values = [
    { icon: MapPin, title: t("whyExpertGuides"), text: t("whyExpertGuidesDesc") },
    { icon: Route, title: t("whyCustomItineraries"), text: t("whyCustomItinerariesDesc") },
    { icon: ShieldCheck, title: t("whySafetyFirst"), text: t("whySafetyFirstDesc") },
    { icon: Leaf, title: t("whySustainable"), text: t("whySustainableDesc") },
  ];

  const steps = [
    { n: "1", title: t("step1Title"), text: t("step1Text") },
    { n: "2", title: t("step2Title"), text: t("step2Text") },
    { n: "3", title: t("step3Title"), text: t("step3Text") },
  ];

  return (
    <div className="abt" style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", background: "linear-gradient(175deg,#faf8f5,#f1ece3 150%)", color: "#4a3f34", overflowX: "clip" }}>
      <style>{CSS}</style>

      {/* HERO */}
      <header style={{ position: "relative", overflow: "hidden", padding: "clamp(120px,20vh,200px) clamp(18px,5vw,56px) clamp(44px,6vw,68px)", background: heroBg }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(20,12,4,.32) 0%,rgba(20,12,4,.4) 45%,rgba(20,12,4,.86) 100%)" }} />
        <div style={{ position: "relative", maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ maxWidth: 720 }}>
            <div className="inline-flex items-center" style={{ gap: 9, color: "#f3e6c8", fontSize: 12, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 18 }}><span style={{ width: 26, height: 1, background: "#c48f2b" }} />{t("heroEyebrow")}</div>
            <h1 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(34px,6vw,64px)", lineHeight: 1.02, letterSpacing: "-.02em", margin: "0 0 16px", textShadow: "0 2px 24px rgba(20,12,4,.4)" }}>{t("heroTitle")}</h1>
            <p style={{ color: "rgba(242,236,224,.9)", fontSize: "clamp(16px,2vw,20px)", lineHeight: 1.55, maxWidth: 540, margin: "0 0 24px" }}>{t("heroSubtitle")}</p>
            <div className="flex flex-wrap" style={{ gap: 10 }}>
              {heroChips.map((c, i) => (
                <span key={i} className="inline-flex items-center" style={{ gap: 7, background: "rgba(250,248,245,.14)", backdropFilter: "blur(4px)", border: "1px solid rgba(250,248,245,.25)", borderRadius: 20, padding: "8px 14px", color: "#fff", fontSize: 13, fontWeight: 600 }}>{c.el}</span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1160, margin: "0 auto", padding: "clamp(40px,6vw,72px) clamp(18px,5vw,56px) 0" }}>
        {/* STORY */}
        <section style={{ marginBottom: "clamp(44px,6vw,72px)" }}>
          <div className="two">
            <div>
              <div style={{ color: "#96631a", fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 12 }}>{t("storyTitle")}</div>
              <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(28px,3.8vw,42px)", lineHeight: 1.08, margin: "0 0 20px" }}>{t("storyH2")}</h2>
              <p style={{ color: "#4a3f34", fontSize: 16, lineHeight: 1.7, margin: "0 0 16px" }}>{t("storyP1")}</p>
              <p style={{ color: "#4a3f34", fontSize: 16, lineHeight: 1.7, margin: 0 }}>{t("storyP2")}</p>
            </div>
            <figure style={{ margin: 0, position: "relative", background: "#fff", border: "1px solid #e4ddd1", borderRadius: 18, padding: 28, boxShadow: "0 14px 40px rgba(62,21,2,.1)" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="#f3e6c8" style={{ marginBottom: 12 }}><path d="M9 7H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v2a2 2 0 0 1-2 2H4v2h1a4 4 0 0 0 4-4V7Zm12 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v2a2 2 0 0 1-2 2h-1v2h1a4 4 0 0 0 4-4V7Z" /></svg>
              <blockquote style={{ fontFamily: SERIF, fontStyle: "italic", color: "#5a1e03", fontSize: "clamp(19px,2.3vw,24px)", lineHeight: 1.45, margin: "0 0 20px" }}>{t("founderQuote")}</blockquote>
              <figcaption className="flex items-center" style={{ gap: 13 }}>
                <span className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#3e3117,#5a1e03)", color: "#faf8f5", fontFamily: SERIF, fontWeight: 700, fontSize: 18 }}>EF</span>
                <span><span style={{ display: "block", fontWeight: 600, color: "#2a2018", fontSize: 15 }}>Enock Fabian</span><span style={{ color: "#7a6f61", fontSize: 13 }}>{t("founderRole")}</span></span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section style={{ marginBottom: "clamp(44px,6vw,72px)" }}>
          <div className="trust4">
            {trust.map((tr, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 14, padding: "22px 20px", textAlign: "center" }}>
                <div className="flex justify-center" style={{ marginBottom: 12, color: "#96631a" }}>{tr.icon}</div>
                <div style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 19, lineHeight: 1.1, marginBottom: 5 }}>{tr.value}</div>
                <div style={{ color: "#7a6f61", fontSize: 13, lineHeight: 1.4 }}>{tr.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MISSION & VISION */}
        <section style={{ marginBottom: "clamp(44px,6vw,72px)" }}>
          <div className="two" style={{ alignItems: "stretch" }}>
            <div style={{ background: "#e6ece2", border: "1px solid #e4ddd1", borderRadius: 18, padding: "clamp(24px,3vw,34px)" }}>
              <div className="flex items-center" style={{ gap: 10, marginBottom: 14, color: "#274e22" }}><Target size={26} strokeWidth={1.7} /><h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 22, margin: 0 }}>{t("missionTitle")}</h3></div>
              <p style={{ color: "#4a3f34", fontSize: 15.5, lineHeight: 1.65, margin: 0 }}>{t("missionText")}</p>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 18, padding: "clamp(24px,3vw,34px)" }}>
              <div className="flex items-center" style={{ gap: 10, marginBottom: 14, color: "#96631a" }}><Eye size={26} strokeWidth={1.7} /><h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 22, margin: 0 }}>{t("visionTitle")}</h3></div>
              <p style={{ color: "#4a3f34", fontSize: 15.5, lineHeight: 1.65, margin: 0 }}>{t("visionText")}</p>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section style={{ marginBottom: "clamp(44px,6vw,72px)" }}>
          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto clamp(28px,4vw,40px)" }}>
            <div style={{ color: "#96631a", fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 12 }}>{t("whyEyebrow")}</div>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(26px,3.6vw,40px)", lineHeight: 1.08, margin: 0 }}>{t("whyH2")}</h2>
          </div>
          <div className="four">
            {values.map((v) => (
              <div key={v.title} style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 16, padding: "26px 22px" }}>
                <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 12, background: "#f3e6c8", color: "#96631a", marginBottom: 16 }}><v.icon size={24} /></div>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 18, lineHeight: 1.2, margin: "0 0 8px" }}>{v.title}</h3>
                <p style={{ color: "#7a6f61", fontSize: 14, lineHeight: 1.55, margin: 0 }}>{v.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ marginBottom: "clamp(44px,6vw,72px)" }}>
          <div style={{ background: "#f1ece3", border: "1px solid #e4ddd1", borderRadius: 20, padding: "clamp(28px,4vw,48px)" }}>
            <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto clamp(24px,3vw,36px)" }}>
              <div style={{ color: "#96631a", fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 12 }}>{t("howEyebrow")}</div>
              <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.4vw,36px)", lineHeight: 1.08, margin: 0 }}>{t("howH2")}</h2>
            </div>
            <div className="three" style={{ marginBottom: "clamp(24px,3vw,34px)" }}>
              {steps.map((s) => (
                <div key={s.n} style={{ textAlign: "center", padding: "0 8px" }}>
                  <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff", border: "2px solid #c48f2b", margin: "0 auto 16px", fontFamily: SERIF, fontWeight: 700, color: "#96631a", fontSize: 22 }}>{s.n}</div>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 19, margin: "0 0 8px" }}>{s.title}</h3>
                  <p style={{ color: "#7a6f61", fontSize: 14, lineHeight: 1.55, margin: 0 }}>{s.text}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <Link href="/plan" className="inline-flex items-center" style={{ gap: 9, background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 16, borderRadius: 9, padding: "15px 28px", boxShadow: "0 8px 22px rgba(196,143,43,.4)" }}>{t("startPlanning")}<Arrow size={17} /></Link>
            </div>
          </div>
        </section>

        {/* TRIPADVISOR BAND */}
        <section style={{ marginBottom: "clamp(44px,6vw,72px)" }}>
          <div className="flex flex-wrap items-center justify-between" style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 18, padding: "clamp(24px,3vw,34px)", gap: 20 }}>
            <div className="flex items-center" style={{ gap: 18 }}>
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 52, height: 52, borderRadius: "50%", background: "#00aa6c" }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><circle cx="8" cy="13" r="3.4" /><circle cx="16" cy="13" r="3.4" /><path d="M12 7c2.5-1.6 6-2 8.5-1.2M12 7C9.5 5.4 6 5 3.5 5.8" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" /><circle cx="8" cy="13" r="1.1" fill="#00aa6c" /><circle cx="16" cy="13" r="1.1" fill="#00aa6c" /></svg>
              </div>
              <div>
                <div className="flex items-center" style={{ gap: 10 }}><span style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 26, lineHeight: 1 }}>{rating}</span><span style={{ color: "#00aa6c", fontSize: 18, letterSpacing: 2 }}>●●●●●</span></div>
                <div style={{ color: "#7a6f61", fontSize: 13.5, marginTop: 3 }}>{t("tripRatedText", { rating, count: trip.count })}</div>
              </div>
            </div>
            <Link href="/reviews" className="inline-flex items-center" style={{ gap: 8, color: "#274e22", fontWeight: 600, fontSize: 14.5, border: "1.5px solid #274e22", borderRadius: 9, padding: "12px 20px" }}>{t("readReviews")}<Arrow size={15} /></Link>
          </div>
        </section>
      </main>

      {/* CONVERSION BAND */}
      <section style={{ position: "relative", overflow: "hidden", background: "#3d1402", padding: "clamp(48px,7vw,84px) clamp(18px,5vw,56px)" }}>
        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <div style={{ color: "#c48f2b", fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 14 }}>{t("bandEyebrow")}</div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(28px,4.2vw,46px)", lineHeight: 1.08, margin: "0 0 16px" }}>{t("bandTitle")}</h2>
          <p style={{ color: "rgba(242,236,224,.82)", fontSize: 17, lineHeight: 1.6, margin: "0 auto 30px", maxWidth: 520 }}>{t("bandBody")}</p>
          <div className="flex flex-wrap justify-center" style={{ gap: 12, marginBottom: 30 }}>
            <Link href="/plan" className="inline-flex items-center" style={{ gap: 9, background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 16, borderRadius: 9, padding: "16px 30px", boxShadow: "0 10px 30px rgba(196,143,43,.4)" }}>{nav("planYourSafari")}<Arrow size={17} /></Link>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center" style={{ gap: 9, background: "rgba(242,236,224,.1)", color: "#fff", fontWeight: 600, fontSize: 16, border: "1.5px solid rgba(242,236,224,.4)", borderRadius: 9, padding: "15px 26px" }}><WhatsAppIcon />{footer("whatsapp")}</a>
          </div>
          <div className="flex flex-wrap items-center justify-center" style={{ gap: "12px 26px", color: "rgba(242,236,224,.7)", fontSize: 13 }}>
            <span className="inline-flex items-center" style={{ gap: 7 }}><span style={{ color: "#c48f2b", letterSpacing: 1 }}>★★★★★</span> {rating} Tripadvisor</span>
            <span className="inline-flex items-center" style={{ gap: 7 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c48f2b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>{t("licensedBadge")}</span>
            <span className="inline-flex items-center" style={{ gap: 7 }}><Check size={15} strokeWidth={2.4} color="#c48f2b" />{t("replyBadge")}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
