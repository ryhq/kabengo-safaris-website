"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import AccommodationDetailSkeleton from "@/components/accommodation/AccommodationDetailSkeleton";
import ContextualFAQ from "@/components/ui/ContextualFAQ";
import FeaturedCarousel from "@/components/ui/FeaturedCarousel";
import PhotoWheel from "@/components/park/PhotoWheel";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api";

// Real OSM map — client-only (Leaflet needs window). Shared across the site.
const ParkMap = dynamic(() => import("@/components/ui/ParkMap"), { ssr: false, loading: () => null });

export interface AccImage { imageUrl: string; altText?: string; caption?: string; imageType?: string }
interface SafariItem { code: string; name: string; totalDays?: number; tripTypeDisplayName?: string; totalPaxCount?: number; primaryImageUrl?: string; costSummary?: { grandTotalRack?: number; currency?: string }[] }
export interface AccommodationDetail {
  name: string; slug: string;
  accommodationTypeDisplayName?: string; categoryDisplayName?: string; categoryApproximateStars?: number;
  region?: string; district?: string; location?: string; address?: string;
  latitude?: number; longitude?: number; elevation?: string;
  totalRooms?: number; totalBeds?: number; maxGuests?: number; starRating?: number;
  shortDescription?: string; details?: string; amenities?: string; services?: string; nearbyAttractions?: string;
  cancellationPolicy?: string; checkInPolicy?: string; checkOutPolicy?: string; childPolicy?: string; petPolicy?: string;
  priceRange?: string; currency?: string; bestSeason?: string; tags?: string;
  website?: string; primaryImageUrl?: string; logoUrl?: string;
  imageCount?: number; roomTypeCount?: number; roomStandardCount?: number; boardTypeCount?: number;
}

const SERIF = "var(--font-source-serif), Georgia, serif";
const ONE_LINE: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const WHATSAPP = "https://wa.me/255786345408";
const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", TZS: "TSh " };
const GRADIENTS = [
  "linear-gradient(150deg,#5a7a3a,#274e22)", "linear-gradient(150deg,#8a6a2a,#5a3410)",
  "linear-gradient(150deg,#c9962f,#7a2f14)", "linear-gradient(150deg,#3a8a7a,#134a42)",
  "linear-gradient(150deg,#9aa06a,#4a5a2a)", "linear-gradient(150deg,#8a5a2a,#3e1502)",
];
const hashStr = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const gradFor = (s: string) => GRADIENTS[hashStr(s || "x") % GRADIENTS.length];

function parseTags(raw?: string): string[] {
  if (!raw) return [];
  const s = raw.trim();
  if (s.startsWith("[")) { try { const a = JSON.parse(s); if (Array.isArray(a)) return a.map((x) => String(x).trim()).filter(Boolean); } catch { /* fall */ } }
  return s.split(",").map((x) => x.replace(/[[\]"'\\]/g, "").trim()).filter(Boolean);
}
function parseList(raw?: string): string[] {
  if (!raw) return [];
  const parts = raw.split(/[,;\n·|]+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length < 1) return [];
  if (parts.some((p) => p.length > 40)) return [];
  return parts.slice(0, 18);
}
function safariFromPrice(s: SafariItem): string | null {
  const gt = s.costSummary?.[0]?.grandTotalRack;
  if (!gt || gt <= 0) return null;
  const pax = s.totalPaxCount && s.totalPaxCount > 0 ? s.totalPaxCount : 1;
  const cur = s.costSummary?.[0]?.currency;
  const sym = cur ? CURRENCY_SYMBOLS[cur] ?? `${cur} ` : "$";
  return `${sym}${Math.round(gt / pax).toLocaleString()}`;
}

function Arrow({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.4.5c-.2.2-.3.4-.1.6.5.8 1 1.4 1.7 1.9.5.3.8.4 1 .1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.2.1.6-.1 1.2Z" /></svg>;
}

const CSS = `
.ad *{box-sizing:border-box}
.ad .body-cols{display:grid;grid-template-columns:minmax(0,1fr);gap:28px}
.ad .loc-cols{display:grid;grid-template-columns:minmax(0,1fr);gap:20px}
.ad .mobile-bar{display:flex}
.ad .stretch::after{content:"";position:absolute;inset:0;z-index:4}
@media(min-width:980px){
  .ad .body-cols{grid-template-columns:minmax(0,1fr) 360px;gap:44px}
  .ad .body-side{position:sticky;top:104px}
  .ad .loc-cols{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);align-items:stretch}
  .ad .mobile-bar{display:none!important}
}
@media(prefers-reduced-motion:reduce){.ad *{animation:none!important;transition:none!important}}
`;

export default function AccommodationDetailClient({ initialAcc = null, initialImages = [], initialTotalImages = 0 }: { initialAcc?: AccommodationDetail | null; initialImages?: AccImage[]; initialTotalImages?: number }) {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("accommodations");
  const nav = useTranslations("nav");
  const footer = useTranslations("footer");

  const [acc, setAcc] = useState<AccommodationDetail | null>(initialAcc);
  const [images, setImages] = useState<AccImage[]>(initialImages);
  const [totalImages, setTotalImages] = useState(initialTotalImages);
  const [safaris, setSafaris] = useState<SafariItem[]>([]);
  const [loading, setLoading] = useState(!initialAcc);

  useEffect(() => {
    if (initialAcc) return; // already server-rendered
    let alive = true;
    setLoading(true);
    apiClient.get(`/public/accommodations/${params.id}`, { headers: { "Accept-Language": locale } })
      .then((res) => {
        if (!alive) return;
        if (res.data.success) {
          setAcc(res.data.data?.accommodation || res.data.data);
          setImages(res.data.data?.images || []);
          setTotalImages(res.data.data?.totalImages || 0);
        }
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [params.id, locale, initialAcc]);

  useEffect(() => {
    let alive = true;
    apiClient.get(`/public/accommodations/${params.id}/safaris?page=0&size=12`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive && res.data.success) setSafaris(res.data.data?.safaris || []); })
      .catch(() => {});
    apiClient.get(`/public/accommodations/${params.id}/images?page=0&size=12`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive && res.data.success) { const more: AccImage[] = res.data.data?.images || []; setImages((prev) => { const seen = new Set(prev.map((i) => i.imageUrl)); return [...prev, ...more.filter((i) => !seen.has(i.imageUrl))]; }); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [params.id, locale]);

  if (loading) return <AccommodationDetailSkeleton />;
  if (!acc) { notFound(); }

  const planHref = `/plan?accommodation=${encodeURIComponent(acc.slug)}&accommodationName=${encodeURIComponent(acc.name)}`;
  const heroImg = acc.primaryImageUrl || (images[0]?.imageUrl ?? null);
  const heroBg = heroImg ? `50% 42%/cover no-repeat url('${heroImg}')` : gradFor(acc.slug);
  // Note: rating/stars, category, max guests, rooms/beds and price are commercial /
  // operational data — kept out of the public page (owner-facing only).
  const type = acc.accommodationTypeDisplayName;
  const regionFull = [acc.region, acc.district].filter(Boolean).join(", ");
  const photoCount = totalImages || images.length;

  const chipGroups = [
    { title: t("detail.amenities"), items: parseList(acc.amenities) },
    { title: t("detail.services"), items: parseList(acc.services) },
    { title: t("detail.nearbyAttractions"), items: parseList(acc.nearbyAttractions) },
  ].filter((g) => g.items.length > 0);

  const tags = parseTags(acc.tags);

  const hasCoords = acc.latitude != null && acc.longitude != null && acc.latitude !== 0 && acc.longitude !== 0;
  const locRows = [
    regionFull && { label: t("detail.regionLabel"), value: regionFull },
    (acc.location || acc.address) && { label: t("detail.addressLabel"), value: [acc.location, acc.address].filter(Boolean).join(" · ") },
    acc.elevation && { label: t("detail.elevationLabel"), value: acc.elevation },
  ].filter(Boolean) as { label: string; value: string }[];

  const renderSafariCard = (s: SafariItem) => {
    const bg = s.primaryImageUrl ? `50% 45%/cover no-repeat url('${s.primaryImageUrl}')` : gradFor(s.code);
    const kicker = [s.totalDays ? `${s.totalDays} ${s.totalDays === 1 ? "Day" : "Days"}` : null, s.tripTypeDisplayName].filter(Boolean).join(" · ");
    const price = safariFromPrice(s);
    return (
      <article className="group relative" style={{ height: 300, borderRadius: 20, overflow: "hidden", background: bg }}>
        <Link href={`/safaris/${s.code}`} aria-label={s.name} className="absolute inset-0 z-[5]" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 28%,rgba(20,12,4,.55) 58%,rgba(20,12,4,.92) 100%)" }} />
        {price && <div className="absolute" style={{ top: 14, right: 14, background: "#3d1402", color: "#f3e6c8", fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 20 }}>{t("detail.from")} {price} pp</div>}
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
    <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 18, overflow: "hidden", boxShadow: "0 16px 44px rgba(62,21,2,.1)" }}>
      <div style={{ background: "#1b3717", padding: 22, color: "#faf8f5" }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, lineHeight: 1.18, marginBottom: 6 }}>{t("detail.stayHereTitle")}</div>
        <p style={{ color: "rgba(242,236,224,.8)", fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>{t("detail.stayHereSub")}</p>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 11 }}>
        <Link href={planHref} className="inline-flex items-center justify-center gap-2" style={{ background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 15, borderRadius: 8, padding: 15, boxShadow: "0 6px 20px rgba(196,143,43,.4)" }}>{t("detail.enquireLodge")}<Arrow /></Link>
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2" style={{ background: "none", color: "#274e22", fontWeight: 600, fontSize: 15, border: "1.5px solid #274e22", borderRadius: 8, padding: 14 }}><WhatsAppIcon />{footer("whatsapp")}</a>
        <div className="flex items-center" style={{ gap: 8, color: "#7a6f61", fontSize: 12.5, lineHeight: 1.4, marginTop: 4 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00aa6c" strokeWidth={2.2} style={{ flexShrink: 0 }}><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>{t("detail.reply24")}
        </div>
        <div className="flex items-center" style={{ gap: 8, paddingTop: 12, borderTop: "1px solid #e4ddd1", marginTop: 4 }}>
          <span style={{ color: "#c48f2b", letterSpacing: 1, fontSize: 14 }}>★★★★★</span><span style={{ color: "#7a6f61", fontSize: 12.5 }}>5.0 · Tripadvisor · TATO/TALA</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ad" style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", background: "linear-gradient(175deg,#faf8f5,#f1ece3 140%)", color: "#4a3f34", overflowX: "clip" }}>
      <style>{CSS}</style>

      {/* ===== (1) HERO ===== */}
      <header style={{ position: "relative", overflow: "hidden", minHeight: "clamp(460px,70vh,640px)", display: "flex", alignItems: "flex-end", padding: "clamp(104px,13vh,140px) clamp(18px,5vw,56px) clamp(40px,5vw,60px)", background: heroBg }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(20,12,4,.24) 0%,rgba(20,12,4,.36) 45%,rgba(20,12,4,.86) 100%)" }} />
        <div style={{ position: "relative", maxWidth: 1240, margin: "0 auto", width: "100%" }}>
          <div className="flex items-center" style={{ gap: 8, color: "rgba(242,236,224,.72)", fontSize: 12.5, marginBottom: 16 }}>
            <Link href="/accommodations" style={{ color: "rgba(242,236,224,.72)" }}>{nav("accommodations")}</Link><span>/</span><span style={{ color: "#f3e6c8" }}>{acc.region || acc.name}</span>
          </div>
          {acc.logoUrl && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(250,248,245,.94)", borderRadius: 10, padding: "6px 10px", height: 40 }}>
                <img src={acc.logoUrl} alt={acc.name} style={{ maxHeight: 26, maxWidth: 120, objectFit: "contain", display: "block" }} />
              </span>
            </div>
          )}
          <h1 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(32px,6vw,60px)", lineHeight: 1.03, letterSpacing: "-.015em", margin: "0 0 14px", maxWidth: 820, overflowWrap: "break-word", textShadow: "0 2px 24px rgba(20,12,4,.4)" }}>{acc.name}</h1>
          <div className="flex flex-wrap items-center" style={{ gap: "8px 14px", color: "#fff", fontSize: "clamp(14px,1.9vw,17px)", fontWeight: 500 }}>
            {type && <span>{type}</span>}
            {type && regionFull && <span style={{ color: "#c48f2b" }}>·</span>}
            {regionFull && <span className="inline-flex items-center" style={{ gap: 6 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c48f2b" strokeWidth={2}><path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z" /><circle cx="12" cy="11" r="2.3" /></svg>{regionFull}</span>}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "clamp(26px,4vw,42px) clamp(18px,5vw,56px) 0" }}>

        {/* ===== (2) TWO-COLUMN BODY ===== */}
        <div className="body-cols" style={{ marginBottom: "clamp(36px,5vw,60px)" }}>
          <div>
            {acc.shortDescription && <p style={{ fontFamily: SERIF, color: "#5a1e03", fontSize: "clamp(19px,2.4vw,25px)", lineHeight: 1.5, margin: "0 0 24px" }}>{acc.shortDescription}</p>}
            {acc.details && <p style={{ color: "#4a3f34", fontSize: 16, lineHeight: 1.7, margin: "0 0 32px", whiteSpace: "pre-line" }}>{acc.details}</p>}

            {chipGroups.map((g) => (
              <div key={g.title} style={{ marginBottom: 28 }}>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 19, margin: "0 0 14px" }}>{g.title}</h3>
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {g.items.map((i) => <span key={i} style={{ background: "#f1ece3", color: "#4a3f34", fontSize: 13.5, fontWeight: 500, padding: "9px 15px", borderRadius: 9, border: "1px solid #e4ddd1" }}>{i}</span>)}
                </div>
              </div>
            ))}

            {(acc.bestSeason || tags.length > 0) && (
              <div className="flex flex-wrap" style={{ gap: "18px 32px", marginTop: 8, paddingTop: 24, borderTop: "1px solid #e4ddd1" }}>
                {acc.bestSeason && (
                  <div>
                    <div style={{ fontSize: 11, color: "#7a6f61", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{t("detail.bestSeason")}</div>
                    <div style={{ fontWeight: 600, color: "#2a2018", fontSize: 15 }}>{acc.bestSeason}</div>
                  </div>
                )}
                {tags.length > 0 && (
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, color: "#7a6f61", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>{t("detail.goodFor")}</div>
                    <div className="flex flex-wrap" style={{ gap: 7 }}>
                      {tags.map((tg) => <span key={tg} style={{ background: "#f3e6c8", color: "#96631a", fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 20 }}>{tg}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* sticky money card */}
          <aside>
            <div className="body-side">{railCard}</div>
          </aside>
        </div>

        {/* ===== (4) PHOTO GALLERY ===== */}
        {images.length > 0 && (
          <section aria-label={t("detail.photosTitle")} style={{ marginBottom: "clamp(36px,5vw,60px)" }}>
            <div className="flex items-end justify-between" style={{ gap: 16, marginBottom: 18 }}>
              <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.2vw,34px)", margin: 0 }}>{t("detail.photosTitle")}</h2>
              {photoCount > 0 && <span style={{ color: "#7a6f61", fontSize: 13.5 }}>{t("detail.photosCount", { count: photoCount })}</span>}
            </div>
            <PhotoWheel images={images} label={acc.name} />
          </section>
        )}

        {/* ===== (5) SAFARIS THAT STAY HERE ===== */}
        {safaris.length > 0 && (
          <section aria-label={t("detail.safarisHereTitle")} style={{ marginBottom: "clamp(36px,5vw,60px)" }}>
            <div style={{ marginBottom: 6 }}>
              <div style={{ color: "#96631a", fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>{t("detail.bookingBridge")}</div>
            </div>
            <FeaturedCarousel title={t("detail.safarisHereTitle")} subtitle={t("detail.safarisHereSub", { name: acc.name })} items={safaris} renderCard={renderSafariCard} />
          </section>
        )}

        {/* ===== (6) LOCATION ===== */}
        {(hasCoords || locRows.length > 0) && (
          <section aria-label={t("detail.whereYoullBe")} style={{ marginBottom: "clamp(36px,5vw,60px)" }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.2vw,34px)", margin: "0 0 18px" }}>{t("detail.whereYoullBe")}</h2>
            <div className="loc-cols">
              {hasCoords ? (
                <div style={{ position: "relative", border: "1px solid #e4ddd1", borderRadius: 16, overflow: "hidden", minHeight: 300, height: "100%", isolation: "isolate" }}>
                  <ParkMap latitude={acc.latitude as number} longitude={acc.longitude as number} name={acc.name} />
                </div>
              ) : (
                <div style={{ background: "#e6ece2", border: "1px solid #e4ddd1", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 12 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#274e22" strokeWidth={1.8} style={{ flexShrink: 0 }}><path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z" /><circle cx="12" cy="11" r="2.4" /></svg>
                  <span style={{ color: "#274e22", fontWeight: 600, fontSize: 15 }}>{regionFull || acc.location}</span>
                </div>
              )}
              <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 16, padding: 22 }}>
                <div style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 18, marginBottom: 8 }}>{t("detail.gettingThere")}</div>
                {locRows.map((r) => (
                  <div key={r.label} style={{ padding: "12px 0", borderBottom: "1px solid #e4ddd1" }}>
                    <div style={{ fontSize: 12, color: "#7a6f61", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontWeight: 500, color: "#2a2018", fontSize: 14.5, lineHeight: 1.45 }}>{r.value}</div>
                  </div>
                ))}
                <Link href={planHref} className="inline-flex items-center gap-2" style={{ marginTop: 16, color: "#274e22", fontWeight: 600, fontSize: 14 }}>{t("detail.arrangeTransfers")}<Arrow size={15} /></Link>
              </div>
            </div>
          </section>
        )}

        {/* ===== (8) FAQ ===== */}
        <div style={{ marginBottom: "clamp(20px,3vw,28px)" }}>
          <ContextualFAQ type="accommodation" />
        </div>
      </main>

      {/* ===== (9) CONVERSION BAND ===== */}
      <section style={{ position: "relative", background: "#3d1402", color: "#faf8f5", padding: "clamp(56px,8vw,90px) clamp(18px,5vw,56px)", overflow: "hidden", marginTop: "clamp(40px,6vw,72px)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{ color: "#c48f2b", fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 14 }}>{t("detail.bandKicker")}</div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.08, margin: "0 0 14px" }}>{t("detail.bandTitle", { name: acc.name })}</h2>
          <p style={{ color: "rgba(242,236,224,.82)", fontSize: 17, lineHeight: 1.55, margin: "0 auto 30px", maxWidth: 560 }}>{t("detail.bandBody")}</p>
          <div className="flex flex-wrap justify-center" style={{ gap: 12, marginBottom: 34 }}>
            <Link href={planHref} className="inline-flex items-center gap-2 font-semibold" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 16, borderRadius: 8, padding: "16px 30px", boxShadow: "0 10px 28px rgba(196,143,43,.4)" }}>{t("detail.enquireLodge")}<Arrow size={17} /></Link>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold" style={{ background: "rgba(242,236,224,.08)", color: "#fff", border: "1.5px solid rgba(242,236,224,.4)", fontSize: 16, borderRadius: 8, padding: "15px 28px" }}><WhatsAppIcon />{footer("whatsapp")}</a>
          </div>
          <div className="flex flex-wrap justify-center" style={{ gap: "14px 26px", paddingTop: 26, borderTop: "1px solid rgba(242,236,224,.15)" }}>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><span style={{ color: "#00aa6c", fontWeight: 700, fontFamily: SERIF, fontSize: 16 }}>5.0</span><span style={{ color: "#c48f2b", letterSpacing: 1 }}>★★★★★</span>Tripadvisor</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c48f2b" strokeWidth={2}><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6Z" strokeLinejoin="round" /></svg>{t("detail.accredited")}</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c48f2b" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" /></svg>{t("detail.replyBadge")}</span>
          </div>
        </div>
      </section>

      {/* ===== (10) MOBILE STICKY BOOKING BAR ===== */}
      <div className="mobile-bar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 120, background: "#fff", borderTop: "1px solid #e4ddd1", boxShadow: "0 -6px 24px rgba(0,0,0,.1)", padding: "11px 16px", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {type && <div style={{ fontSize: 11, color: "#7a6f61", ...ONE_LINE }}>{type}</div>}
          <div style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 16, lineHeight: 1.1, ...ONE_LINE }}>{acc.name}</div>
        </div>
        <Link href={planHref} className="inline-flex items-center gap-2" style={{ flexShrink: 0, background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 15, borderRadius: 8, padding: "13px 22px" }}>{t("detail.enquire")}<Arrow size={15} /></Link>
      </div>
      <div className="mobile-bar" style={{ height: 70 }} aria-hidden="true" />
    </div>
  );
}
