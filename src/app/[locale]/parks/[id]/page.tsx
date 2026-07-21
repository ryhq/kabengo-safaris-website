"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ParkDetailSkeleton from "@/components/park/ParkDetailSkeleton";
import FeaturedCarousel from "@/components/ui/FeaturedCarousel";
import PhotoWheel from "@/components/park/PhotoWheel";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api";

// Real OSM map — client-only (Leaflet needs window). Shared with the itinerary map.
const ParkMap = dynamic(() => import("@/components/ui/ParkMap"), { ssr: false, loading: () => null });

const IMAGES_PAGE_SIZE = 12;
const ACTIVITIES_PAGE_SIZE = 12;

interface ParkImage { imageUrl: string; altText?: string; caption?: string }
interface ParkDetail {
  name: string; slug: string; parkType?: string; region?: string; district?: string;
  location?: string; latitude?: number; longitude?: number; elevation?: string; size?: string;
  shortDescription?: string; fullDescription?: string; history?: string; ecosystem?: string;
  wildlife?: string; vegetation?: string; bestTimeToVisit?: string; openingHours?: string;
  accessInformation?: string; tags?: string; primaryImageUrl?: string;
}
interface ActivityItem { slug: string; name: string; description?: string; seasonAvailability?: string; primaryImage?: string; primaryImageUrl?: string }
interface SafariItem { code: string; name: string; totalDays?: number; tripTypeDisplayName?: string; totalPaxCount?: number; primaryImageUrl?: string; costSummary?: { grandTotalRack?: number; currency?: string }[] }
const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", TZS: "TSh " };
function safariFromPrice(s: SafariItem): string | null {
  const gt = s.costSummary?.[0]?.grandTotalRack;
  if (!gt || gt <= 0) return null;
  const pax = s.totalPaxCount && s.totalPaxCount > 0 ? s.totalPaxCount : 1;
  const cur = s.costSummary?.[0]?.currency;
  const sym = cur ? CURRENCY_SYMBOLS[cur] ?? `${cur} ` : "$";
  return `${sym}${Math.round(gt / pax).toLocaleString()}`;
}

const SERIF = "var(--font-source-serif), Georgia, serif";
const ONE_LINE: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const GRADIENTS = [
  "linear-gradient(150deg,#5a7a3a,#274e22)", "linear-gradient(150deg,#8a6a2a,#5a3410)",
  "linear-gradient(150deg,#c9962f,#7a2f14)", "linear-gradient(150deg,#3a8a7a,#134a42)",
  "linear-gradient(150deg,#9aa06a,#4a5a2a)", "linear-gradient(150deg,#8a5a2a,#3e1502)",
];
const hashStr = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const gradFor = (s: string) => GRADIENTS[hashStr(s || "x") % GRADIENTS.length];
const WHATSAPP = "https://wa.me/255786345408";

const CSS = `
.pd *{box-sizing:border-box}
.pd .factstrip{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;align-items:stretch}
.pd .factstrip>div{height:100%}
.pd .stretch::after{content:"";position:absolute;inset:0;z-index:4}
.pd .detail-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:28px}
.pd .getting-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}
.pd .mobile-bar{display:flex}
@media(min-width:980px){
  .pd .detail-grid{grid-template-columns:minmax(0,1fr) 340px;gap:40px}
  .pd .rail-sticky{position:sticky;top:96px}
  .pd .getting-grid{grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);align-items:stretch}
  .pd .mobile-bar{display:none!important}
}
@media(prefers-reduced-motion:reduce){.pd *{animation:none!important;transition:none!important}}
`;

/** Strip the generic suffix so "Serengeti National Park" -> "Serengeti". */
function shortNameOf(name: string) {
  return name.replace(/\s+(National Park|Conservation Area|Game Reserve|Marine Park|National Reserve|Nature Reserve|Forest Reserve|Wildlife Reserve)$/i, "").trim() || name;
}
function parseTags(raw?: string): string[] {
  if (!raw) return [];
  const s = raw.trim();
  if (s.startsWith("[")) { try { const a = JSON.parse(s); if (Array.isArray(a)) return a.map((x) => String(x).trim()).filter(Boolean); } catch { /* fall */ } }
  return s.split(",").map((x) => x.replace(/[[\]"'\\]/g, "").trim()).filter(Boolean);
}
/** Split a wildlife/list string into pills; returns [] if it reads like prose. */
function parseList(raw?: string): string[] {
  if (!raw) return [];
  const parts = raw.split(/[,;\n·|]+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length < 2) return [];
  if (parts.some((p) => p.length > 34)) return [];
  return parts.slice(0, 16);
}

function Chevron({ rot }: { rot: string }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: rot, transition: "transform .2s" }}><path d="M6 9l6 6 6-6" /></svg>;
}
function Arrow({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export default function ParkDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("parkDetail");
  const nav = useTranslations("nav");
  const footer = useTranslations("footer");
  const home = useTranslations("home");
  const pf = useTranslations("parksFinder");

  const [park, setPark] = useState<ParkDetail | null>(null);
  const [images, setImages] = useState<ParkImage[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [safaris, setSafaris] = useState<SafariItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiClient.get(`/public/parks/${params.id}`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (!alive) return; if (res.data.success) { setPark(res.data.data?.park || res.data.data); setImages(res.data.data?.images || []); } })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [params.id, locale]);

  useEffect(() => {
    let alive = true;
    apiClient.get(`/public/parks/${params.id}/activities?page=0&size=${ACTIVITIES_PAGE_SIZE}`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive && res.data.success) setActivities(res.data.data?.activities || []); })
      .catch(() => {});
    apiClient.get(`/public/parks/${params.id}/safaris?page=0&size=12`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive && res.data.success) setSafaris(res.data.data?.safaris || []); })
      .catch(() => {});
    // also try to pull a few more gallery images
    apiClient.get(`/public/parks/${params.id}/images?page=0&size=${IMAGES_PAGE_SIZE}`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive && res.data.success) { const more: ParkImage[] = res.data.data?.images || []; setImages((prev) => { const seen = new Set(prev.map((i) => i.imageUrl)); return [...prev, ...more.filter((i) => !seen.has(i.imageUrl))]; }); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [params.id, locale]);

  if (loading) return <ParkDetailSkeleton />;
  if (!park) { notFound(); }

  const shortName = shortNameOf(park.name);
  const typeLabel = park.parkType ? pf(`type.${park.parkType}`) : "";
  const planHref = `/plan?park=${encodeURIComponent(park.slug)}&parkName=${encodeURIComponent(park.name)}`;
  const heroImg = park.primaryImageUrl || (images[0]?.imageUrl ?? null);
  const heroBg = heroImg ? `50% 42%/cover no-repeat url('${heroImg}')` : gradFor(park.slug);
  const kicker = [typeLabel, park.region].filter(Boolean).join(" · ");
  const tags = parseTags(park.tags);
  const wildlife = parseList(park.wildlife);
  const hasCoords = park.latitude != null && park.longitude != null && park.latitude !== 0 && park.longitude !== 0;

  const facts = [
    typeLabel && { label: t("factParkType"), value: typeLabel },
    park.region && { label: t("factRegion"), value: park.region },
    park.size && { label: t("factSize"), value: park.size },
    park.elevation && { label: t("factElevation"), value: park.elevation },
  ].filter(Boolean) as { label: string; value: string }[];

  const faqs = [
    park.bestTimeToVisit && { q: t("faqBestTimeQ", { name: shortName }), a: park.bestTimeToVisit },
    park.accessInformation && { q: t("faqAccessQ", { name: shortName }), a: park.accessInformation },
    (park.wildlife || wildlife.length > 0) && { q: t("faqWildlifeQ", { name: shortName }), a: park.wildlife || t("faqWildlifeA") },
  ].filter(Boolean) as { q: string; a: string }[];

  const ecosystemText = [park.ecosystem, park.vegetation].filter(Boolean).join(" ");

  // Editorial overlay card for "Things to do" — same design as /activities, no safari-count badge.
  const renderActivityCard = (a: ActivityItem) => {
    const img = a.primaryImageUrl || a.primaryImage;
    const bg = img ? `50% 45%/cover no-repeat url('${img}')` : gradFor(a.slug);
    return (
      <article className="group relative" style={{ height: 300, borderRadius: 20, overflow: "hidden", background: bg }}>
        <Link href={`/activities/${a.slug}`} aria-label={a.name} className="absolute inset-0 z-[5]" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 30%,rgba(20,12,4,.55) 62%,rgba(20,12,4,.92) 100%)" }} />
        <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between" style={{ padding: 22, gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            {a.seasonAvailability && <div style={{ color: "#f3e6c8", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6, ...ONE_LINE }}>{a.seasonAvailability}</div>}
            <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: 21, lineHeight: 1.14, margin: 0, textShadow: "0 1px 12px rgba(20,12,4,.5)", ...ONE_LINE }}>{a.name}</h3>
          </div>
          <span className="flex items-center justify-center bg-white text-[#2a2018] group-hover:bg-brand-green group-hover:text-white transition-colors" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%" }}><Arrow size={17} /></span>
        </div>
      </article>
    );
  };

  // Editorial safari card for "Safaris that visit this park".
  const renderSafariCard = (s: SafariItem) => {
    const bg = s.primaryImageUrl ? `50% 45%/cover no-repeat url('${s.primaryImageUrl}')` : gradFor(s.code);
    const kicker = [s.totalDays ? `${s.totalDays} ${s.totalDays === 1 ? "Day" : "Days"}` : null, s.tripTypeDisplayName].filter(Boolean).join(" · ");
    const price = safariFromPrice(s);
    return (
      <article className="group relative" style={{ height: 300, borderRadius: 20, overflow: "hidden", background: bg }}>
        <Link href={`/safaris/${s.code}`} aria-label={s.name} className="absolute inset-0 z-[5]" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 28%,rgba(20,12,4,.55) 58%,rgba(20,12,4,.92) 100%)" }} />
        {price && <div className="absolute" style={{ top: 14, right: 14, background: "#3d1402", color: "#f3e6c8", fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 20 }}>From {price} pp</div>}
        <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between" style={{ padding: 22, gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            {kicker && <div style={{ color: "#f3e6c8", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6, ...ONE_LINE }}>{kicker}</div>}
            <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: 21, lineHeight: 1.14, margin: 0, textShadow: "0 1px 12px rgba(20,12,4,.5)", ...ONE_LINE }}>{s.name}</h3>
          </div>
          <span className="flex items-center justify-center bg-white text-[#2a2018] group-hover:bg-brand-green group-hover:text-white transition-colors" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%" }}><Arrow size={17} /></span>
        </div>
      </article>
    );
  };

  const railCard = (
    <div style={{ background: "var(--card,#fff)", border: "1px solid #e4ddd1", borderRadius: 18, overflow: "hidden", boxShadow: "0 16px 44px rgba(62,21,2,.1)" }}>
      <div style={{ background: "#1b3717", padding: 22, color: "#faf8f5" }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, lineHeight: 1.15, marginBottom: 6 }}>{t("railTitle", { name: shortName })}</div>
        <p style={{ color: "rgba(242,236,224,.8)", fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>{t("railSub")}</p>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 11 }}>
        <Link href={planHref} className="inline-flex items-center justify-center gap-2" style={{ background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 15, borderRadius: 8, padding: 15, boxShadow: "0 6px 20px rgba(196,143,43,.4)" }}>{t("railEnquire")}<Arrow /></Link>
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2" style={{ background: "none", color: "#274e22", fontWeight: 600, fontSize: 15, border: "1.5px solid #274e22", borderRadius: 8, padding: 14 }}>{footer("whatsapp")}</a>
        <div className="flex items-center" style={{ gap: 8, color: "#7a6f61", fontSize: 12.5, lineHeight: 1.4, marginTop: 4 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00aa6c" strokeWidth={2.2} style={{ flexShrink: 0 }}><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>{t("railReply")}
        </div>
        <div className="flex items-center" style={{ gap: 8, paddingTop: 12, borderTop: "1px solid #e4ddd1", marginTop: 4 }}>
          <span style={{ color: "#c48f2b", letterSpacing: 1, fontSize: 14 }}>★★★★★</span><span style={{ color: "#7a6f61", fontSize: 12.5 }}>5.0 · Tripadvisor · TATO/TALA</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pd" style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", background: "linear-gradient(175deg,#faf8f5,#f1ece3 140%)", color: "#4a3f34", overflowX: "clip" }}>
      <style>{CSS}</style>

      {/* ===== (1) TALL HERO — kicker + title, bottom-left ===== */}
      <header style={{ position: "relative", overflow: "hidden", minHeight: "clamp(460px,70vh,640px)", display: "flex", alignItems: "flex-end", padding: "clamp(96px,12vh,124px) clamp(18px,5vw,56px) clamp(36px,5vw,56px)", background: heroBg }}>
        {!heroImg && (
          <svg aria-hidden="true" viewBox="0 0 240 160" style={{ position: "absolute", right: -20, bottom: 0, width: "min(380px,42vw)", opacity: 0.12, color: "#fff" }}><g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><path d="M120 160v-70" /><path d="M120 94c-24-6-48-22-64-28 14 12 38 26 56 30M120 94c24-6 50-20 66-26-16 12-42 24-60 28" /><path d="M50 68c20-14 42-14 70-12 28 2 50-2 72 8-18-14-42-16-70-16-30 0-52 6-72 20Z" /></g></svg>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(20,12,4,.18) 0%,rgba(20,12,4,.35) 55%,rgba(20,12,4,.85) 100%)" }} />
        <div style={{ position: "relative", maxWidth: 1220, margin: "0 auto", width: "100%" }}>
          <div className="flex items-center" style={{ gap: 8, color: "rgba(242,236,224,.72)", fontSize: 12.5, marginBottom: 14 }}>
            <Link href="/parks" style={{ color: "rgba(242,236,224,.72)" }}>{nav("parks")}</Link><span>/</span><span style={{ color: "#f3e6c8" }}>{park.name}</span>
          </div>
          {kicker && <div style={{ color: "#f3e6c8", fontSize: 12.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 12 }}>{kicker}</div>}
          <h1 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(30px,6.4vw,66px)", lineHeight: 1.04, letterSpacing: "-.015em", margin: 0, maxWidth: 860, overflowWrap: "break-word", textShadow: "0 2px 24px rgba(20,12,4,.4)" }}>{park.name}</h1>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <main style={{ maxWidth: 1220, margin: "0 auto", padding: "clamp(28px,4vw,44px) clamp(18px,5vw,56px) 0" }}>
        <div className="detail-grid">
          <div>
            {/* (3) FACT STRIP */}
            {(facts.length > 0 || tags.length > 0) && (
              <section aria-label="At a glance" style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
                {facts.length > 0 && (
                  <div className="factstrip">
                    {facts.map((f) => (
                      <div key={f.label} style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 12, padding: "15px 16px" }}>
                        <div style={{ fontSize: 11, color: "#7a6f61", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{f.label}</div>
                        <div style={{ fontWeight: 600, color: "#2a2018", fontSize: 15, lineHeight: 1.3, overflowWrap: "anywhere" }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {tags.length > 0 && (
                  <div className="flex flex-wrap" style={{ gap: 8, marginTop: 14 }}>
                    {tags.map((tg) => <span key={tg} style={{ background: "#e6ece2", color: "#274e22", fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 20 }}>{tg}</span>)}
                  </div>
                )}
              </section>
            )}

            {/* (4) WHY VISIT */}
            {(park.shortDescription || park.fullDescription) && (
              <section style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.2vw,32px)", margin: "0 0 14px" }}>{t("whyVisit", { name: shortName })}</h2>
                {park.shortDescription && <p style={{ fontFamily: SERIF, color: "#5a1e03", fontSize: "clamp(18px,2.2vw,22px)", lineHeight: 1.5, margin: "0 0 16px" }}>{park.shortDescription}</p>}
                {park.fullDescription && moreOpen && <p style={{ color: "#4a3f34", fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>{park.fullDescription}</p>}
                {park.fullDescription && (
                  <button onClick={() => setMoreOpen((v) => !v)} className="inline-flex items-center" style={{ background: "none", border: "none", color: "#96631a", fontWeight: 600, fontSize: 14.5, cursor: "pointer", padding: 0, gap: 6 }}>
                    {moreOpen ? t("readLess") : t("readMore")}<Chevron rot={moreOpen ? "rotate(180deg)" : "rotate(0deg)"} />
                  </button>
                )}
              </section>
            )}

            {/* (5) WILDLIFE & LANDSCAPE */}
            {(wildlife.length > 0 || ecosystemText) && (
              <section style={{ marginBottom: "clamp(36px,5vw,52px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
                {wildlife.length > 0 && (
                  <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 14, padding: 20 }}>
                    <div className="flex items-center" style={{ gap: 8, marginBottom: 12, color: "#274e22" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M4 15c2-6 5-9 8-9s6 3 8 9M8 15v3M16 15v3M10 9c0-1.5 1-2.5 2-2.5s2 1 2 2.5" strokeLinecap="round" /></svg>
                      <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 16, color: "#2a2018" }}>{t("wildlifeYouSee")}</span>
                    </div>
                    <div className="flex flex-wrap" style={{ gap: 7 }}>
                      {wildlife.map((w) => <span key={w} style={{ background: "#f1ece3", color: "#4a3f34", fontSize: 12.5, fontWeight: 500, padding: "6px 11px", borderRadius: 20 }}>{w}</span>)}
                    </div>
                  </div>
                )}
                {ecosystemText && (
                  <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 14, padding: 20 }}>
                    <div className="flex items-center" style={{ gap: 8, marginBottom: 12, color: "#274e22" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 22V12M12 12c0-4 2-7 5-8-1 3-2 6-5 8ZM12 12c0-3-2-5-5-6 1 2.5 2 4.5 5 6Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 16, color: "#2a2018" }}>{t("ecosystemHeading")}</span>
                    </div>
                    <p style={{ color: "#4a3f34", fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{ecosystemText}</p>
                  </div>
                )}
              </section>
            )}

            {/* (6) BEST TIME */}
            {park.bestTimeToVisit && (
              <section style={{ marginBottom: "clamp(36px,5vw,52px)", background: "#e6ece2", borderRadius: 16, padding: "clamp(22px,3vw,30px)" }}>
                <div className="flex items-center" style={{ gap: 9, marginBottom: 12 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#274e22" strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" /></svg>
                  <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#1b3717", fontSize: "clamp(22px,2.8vw,28px)", margin: 0 }}>{t("bestTime")}</h2>
                </div>
                <p style={{ color: "#3e3117", fontSize: 15, lineHeight: 1.6, margin: 0 }}>{park.bestTimeToVisit}</p>
              </section>
            )}

            {/* (7) THINGS TO DO — editorial cards in a carousel (no safari-count) */}
            {activities.length > 0 && (
              <section style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
                <FeaturedCarousel title={t("thingsToDo")} subtitle={t("thingsToDoSub")} items={activities} renderCard={renderActivityCard} />
              </section>
            )}

            {/* (8) SAFARIS THAT VISIT THIS PARK */}
            {safaris.length > 0 && (
              <section style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
                <FeaturedCarousel title={t("safarisTitle", { name: shortName })} subtitle={t("safarisSub")} items={safaris} renderCard={renderSafariCard} />
              </section>
            )}

            {/* (9) GALLERY — continuous photo wheel (swipeable) + lightbox on click */}
            {images.length > 0 && (
              <section style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.2vw,32px)", margin: "0 0 18px" }}>{t("inPhotos", { name: shortName })}</h2>
                <PhotoWheel images={images} label={park.name} />
              </section>
            )}

            {/* (10) GETTING THERE — info + real map (map takes the wide column) */}
            {(park.accessInformation || park.openingHours || hasCoords || park.location) && (() => {
              const AccessCard = park.accessInformation && (
                <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 14, padding: 20 }}>
                  <div className="flex items-center" style={{ gap: 8, marginBottom: 10, color: "#274e22" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 2 4 7v10l8 5 8-5V7Z" strokeLinejoin="round" /><path d="M9 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg><span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 16, color: "#2a2018" }}>{t("access")}</span></div>
                  <p style={{ color: "#4a3f34", fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{park.accessInformation}</p>
                </div>
              );
              const HoursCard = park.openingHours && (
                <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 14, padding: 20 }}>
                  <div className="flex items-center" style={{ gap: 8, marginBottom: 10, color: "#274e22" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" /></svg><span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 16, color: "#2a2018" }}>{t("openingHours")}</span></div>
                  <p style={{ color: "#4a3f34", fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{park.openingHours}</p>
                </div>
              );
              const Map = hasCoords ? (
                <div style={{ position: "relative", border: "1px solid #e4ddd1", borderRadius: 14, overflow: "hidden", minHeight: 320, height: "100%", isolation: "isolate" }}>
                  <ParkMap latitude={park.latitude as number} longitude={park.longitude as number} name={park.name} />
                </div>
              ) : (park.location || park.region) ? (
                <div style={{ background: "#e6ece2", border: "1px solid #e4ddd1", borderRadius: 14, padding: 20, display: "flex", alignItems: "center", gap: 12 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#274e22" strokeWidth={1.8} style={{ flexShrink: 0 }}><path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z" /><circle cx="12" cy="11" r="2.4" /></svg>
                  <span style={{ color: "#274e22", fontWeight: 600, fontSize: 15 }}>{[park.location, park.district, park.region].filter(Boolean).join(" · ")}</span>
                </div>
              ) : null;
              return (
                <section style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
                  <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.2vw,32px)", margin: "0 0 18px" }}>{t("gettingThere")}</h2>
                  <div className="getting-grid">
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{AccessCard}{HoursCard}</div>
                    {Map}
                  </div>
                </section>
              );
            })()}

            {/* (11) FAQ */}
            {faqs.length > 0 && (
              <section style={{ marginBottom: "clamp(20px,3vw,28px)" }}>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.2vw,32px)", margin: "0 0 18px" }}>{t("goodToKnow")}</h2>
                <div className="flex flex-col" style={{ gap: 10 }}>
                  {faqs.map((f, i) => {
                    const open = openFaq === i;
                    return (
                      <div key={i} style={{ border: "1px solid #e4ddd1", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                        <button onClick={() => setOpenFaq(open ? -1 : i)} className="flex items-center justify-between w-full text-left" style={{ gap: 16, background: open ? "#f1ece3" : "#fff", border: "none", padding: "17px 20px", cursor: "pointer", fontWeight: 600, fontSize: 15.5, color: "#2a2018" }}>
                          {f.q}<span style={{ color: "#96631a", fontSize: 22, flexShrink: 0, transform: open ? "rotate(45deg)" : "rotate(0deg)", transition: "transform .2s", lineHeight: 1 }}>+</span>
                        </button>
                        {open && <div style={{ padding: "0 20px 18px", color: "#4a3f34", fontSize: 14.5, lineHeight: 1.65 }}>{f.a}</div>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* (2) STICKY RAIL */}
          <aside>
            <div className="rail-sticky">{railCard}</div>
          </aside>
        </div>
      </main>

      {/* (12) FINAL CONVERSION BAND */}
      <section style={{ position: "relative", background: "#3d1402", color: "#faf8f5", padding: "clamp(56px,8vw,90px) clamp(18px,5vw,56px)", overflow: "hidden", marginTop: "clamp(40px,6vw,72px)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.08, margin: "0 0 14px" }}>{t("bandTitle", { name: shortName })}</h2>
          <p style={{ color: "rgba(242,236,224,.82)", fontSize: 17, lineHeight: 1.55, margin: "0 0 30px" }}>{t("bandBody", { name: shortName })}</p>
          <div className="flex flex-wrap justify-center" style={{ gap: 12, marginBottom: 34 }}>
            <Link href={planHref} className="inline-flex items-center gap-2 font-semibold" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 16, borderRadius: 8, padding: "16px 30px", boxShadow: "0 10px 28px rgba(196,143,43,.4)" }}>{home("ctaCta")}<Arrow size={17} /></Link>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold" style={{ background: "rgba(242,236,224,.08)", color: "#fff", border: "1.5px solid rgba(242,236,224,.4)", fontSize: 16, borderRadius: 8, padding: "15px 28px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.4.5c-.2.2-.3.4-.1.6.5.8 1 1.4 1.7 1.9.5.3.8.4 1 .1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.2.1.6-.1 1.2Z" /></svg>{footer("whatsapp")}
            </a>
          </div>
          <div className="flex flex-wrap justify-center" style={{ gap: "14px 26px", paddingTop: 26, borderTop: "1px solid rgba(242,236,224,.15)" }}>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><span style={{ color: "#00aa6c", fontWeight: 700, fontFamily: SERIF, fontSize: 16 }}>5.0</span><span style={{ color: "#c48f2b", letterSpacing: 1 }}>★★★★★</span>Tripadvisor</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c48f2b" strokeWidth={2}><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6Z" strokeLinejoin="round" /></svg>{t("accredited")}</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c48f2b" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" /></svg>{t("replyBadge")}</span>
          </div>
        </div>
      </section>

      {/* MOBILE STICKY ENQUIRE BAR */}
      <div className="mobile-bar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 120, background: "#fff", borderTop: "1px solid #e4ddd1", boxShadow: "0 -6px 24px rgba(0,0,0,.1)", padding: "11px 16px", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#7a6f61" }}>{t("mobilePlanTo")}</div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 16, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shortName}</div>
        </div>
        <Link href={planHref} className="inline-flex items-center gap-2" style={{ flexShrink: 0, background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 15, borderRadius: 8, padding: "13px 22px" }}>{t("enquire")}<Arrow size={15} /></Link>
      </div>
      <div className="mobile-bar" style={{ height: 70 }} aria-hidden="true" />
    </div>
  );
}
