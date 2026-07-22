"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ActivityDetailSkeleton from "@/components/activity/ActivityDetailSkeleton";
import FeaturedCarousel from "@/components/ui/FeaturedCarousel";
import PhotoWheel from "@/components/park/PhotoWheel";
import { apiClient } from "@/lib/api";

export interface ActivityImage { imageUrl: string; altText?: string; caption?: string }
export interface ActivityDetail {
  name: string; slug: string; description?: string; detailedDescription?: string;
  primaryImageUrl?: string; tags?: string; seasonAvailability?: string;
  minimumAge?: number; maximumParticipants?: number; equipmentRequired?: string; safetyInformation?: string;
}
interface ParkItem { slug: string; name: string; shortDescription?: string; region?: string; primaryImageUrl?: string }
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
const PARKS_PAGE_SIZE = 12;
const IMAGES_PAGE_SIZE = 12;

const CSS = `
.ad *{box-sizing:border-box}
.ad .factstrip{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;align-items:stretch}
.ad .factstrip>div{height:100%}
.ad .detail-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:28px}
.ad .mobile-bar{display:flex}
@media(min-width:980px){
  .ad .detail-grid{grid-template-columns:minmax(0,1fr) 340px;gap:40px}
  .ad .rail-sticky{position:sticky;top:96px}
  .ad .mobile-bar{display:none!important}
}
@media(prefers-reduced-motion:reduce){.ad *{animation:none!important;transition:none!important}}
`;

function parseTags(raw?: string): string[] {
  if (!raw) return [];
  const s = raw.trim();
  if (s.startsWith("[")) { try { const a = JSON.parse(s); if (Array.isArray(a)) return a.map((x) => String(x).trim()).filter(Boolean); } catch { /* fall */ } }
  return s.split(",").map((x) => x.replace(/[[\]"'\\]/g, "").trim()).filter(Boolean);
}
function Chevron({ rot }: { rot: string }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: rot, transition: "transform .2s" }}><path d="M6 9l6 6 6-6" /></svg>;
}
function Arrow({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}
const ICONS: Record<string, React.ReactNode> = {
  season: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round" /></svg>,
  age: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" /></svg>,
  group: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M17 5.5a3.2 3.2 0 0 1 0 6M21.5 20c0-2.6-1.4-4.3-3.5-5" strokeLinecap="round" /></svg>,
  equipment: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2 2.5-2.5Z" strokeLinejoin="round" /></svg>,
};

export default function ActivityDetailClient({ initialActivity = null, initialImages = [] }: { initialActivity?: ActivityDetail | null; initialImages?: ActivityImage[] }) {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("activityDetail");
  const pd = useTranslations("parkDetail");
  const nav = useTranslations("nav");
  const footer = useTranslations("footer");
  const home = useTranslations("home");

  const [activity, setActivity] = useState<ActivityDetail | null>(initialActivity);
  const [images, setImages] = useState<ActivityImage[]>(initialImages);
  const [parks, setParks] = useState<ParkItem[]>([]);
  const [safaris, setSafaris] = useState<SafariItem[]>([]);
  const [loading, setLoading] = useState(!initialActivity);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (initialActivity) return; // already server-rendered
    let alive = true;
    setLoading(true);
    apiClient.get(`/public/activities/${params.id}`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (!alive) return; if (res.data.success) { setActivity(res.data.data?.activity || res.data.data); setImages(res.data.data?.images || []); } })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [params.id, locale, initialActivity]);

  useEffect(() => {
    let alive = true;
    apiClient.get(`/public/activities/${params.id}/parks?page=0&size=${PARKS_PAGE_SIZE}`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive && res.data.success) setParks(res.data.data?.parks || []); })
      .catch(() => {});
    apiClient.get(`/public/activities/${params.id}/safaris?page=0&size=12`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive && res.data.success) setSafaris(res.data.data?.safaris || []); })
      .catch(() => {});
    apiClient.get(`/public/activities/${params.id}/images?page=0&size=${IMAGES_PAGE_SIZE}`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive && res.data.success) { const more: ActivityImage[] = res.data.data?.images || []; setImages((prev) => { const seen = new Set(prev.map((i) => i.imageUrl)); return [...prev, ...more.filter((i) => !seen.has(i.imageUrl))]; }); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [params.id, locale]);

  if (loading) return <ActivityDetailSkeleton />;
  if (!activity) { notFound(); }

  const planHref = `/plan?activity=${encodeURIComponent(activity.slug)}&activityName=${encodeURIComponent(activity.name)}`;
  const heroImg = activity.primaryImageUrl || (images[0]?.imageUrl ?? null);
  const heroBg = heroImg ? `50% 42%/cover no-repeat url('${heroImg}')` : gradFor(activity.slug);
  const tags = parseTags(activity.tags);

  const facts = [
    activity.seasonAvailability && { icon: ICONS.season, label: t("factSeason"), value: activity.seasonAvailability },
    activity.minimumAge != null && { icon: ICONS.age, label: t("factMinAge"), value: `${activity.minimumAge}+` },
    activity.maximumParticipants != null && { icon: ICONS.group, label: t("factMaxGroup"), value: `${activity.maximumParticipants}` },
    activity.equipmentRequired && { icon: ICONS.equipment, label: t("factEquipment"), value: activity.equipmentRequired },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  const renderParkCard = (p: ParkItem) => {
    const bg = p.primaryImageUrl ? `50% 45%/cover no-repeat url('${p.primaryImageUrl}')` : gradFor(p.slug);
    return (
      <article className="group relative" style={{ height: 300, borderRadius: 20, overflow: "hidden", background: bg }}>
        <Link href={`/parks/${p.slug}`} aria-label={p.name} className="absolute inset-0 z-[5]" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 30%,rgba(20,12,4,.55) 62%,rgba(20,12,4,.92) 100%)" }} />
        <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between" style={{ padding: 22, gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            {p.region && <div style={{ color: "#f3e6c8", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6, ...ONE_LINE }}>{p.region}</div>}
            <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: 21, lineHeight: 1.14, margin: 0, textShadow: "0 1px 12px rgba(20,12,4,.5)", ...ONE_LINE }}>{p.name}</h3>
          </div>
          <span className="flex items-center justify-center bg-white text-[#2a2018] group-hover:bg-brand-green group-hover:text-white transition-colors" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%" }}><Arrow size={17} /></span>
        </div>
      </article>
    );
  };

  // Editorial safari card for "Safaris featuring this experience".
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
    <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 18, overflow: "hidden", boxShadow: "0 16px 44px rgba(62,21,2,.1)" }}>
      <div style={{ background: "#1b3717", padding: 22, color: "#faf8f5" }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, lineHeight: 1.15, marginBottom: 6 }}>{t("railTitle", { name: activity.name })}</div>
        <p style={{ color: "rgba(242,236,224,.8)", fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>{t("railSub")}</p>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 11 }}>
        <Link href={planHref} className="inline-flex items-center justify-center gap-2" style={{ background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 15, borderRadius: 8, padding: 15, boxShadow: "0 6px 20px rgba(196,143,43,.4)" }}>{t("railEnquire")}<Arrow /></Link>
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2" style={{ background: "none", color: "#274e22", fontWeight: 600, fontSize: 15, border: "1.5px solid #274e22", borderRadius: 8, padding: 14 }}>{footer("whatsapp")}</a>
        <div className="flex items-center" style={{ gap: 8, color: "#7a6f61", fontSize: 12.5, lineHeight: 1.4, marginTop: 4 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00aa6c" strokeWidth={2.2} style={{ flexShrink: 0 }}><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>{pd("railReply")}
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

      {/* ===== TALL HERO — eyebrow + title, bottom-left ===== */}
      <header style={{ position: "relative", overflow: "hidden", minHeight: "clamp(440px,64vh,600px)", display: "flex", alignItems: "flex-end", padding: "clamp(96px,12vh,124px) clamp(18px,5vw,56px) clamp(36px,5vw,56px)", background: heroBg }}>
        {!heroImg && (
          <svg aria-hidden="true" viewBox="0 0 200 200" style={{ position: "absolute", right: "4%", top: "18%", width: "min(300px,34vw)", opacity: 0.1, color: "#fff" }}><g fill="none" stroke="currentColor" strokeWidth={2}><circle cx="100" cy="100" r="78" /><path d="M100 30l14 56 56 14-56 14-14 56-14-56-56-14 56-14Z" strokeLinejoin="round" /></g></svg>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(20,12,4,.2) 0%,rgba(20,12,4,.36) 55%,rgba(20,12,4,.85) 100%)" }} />
        <div style={{ position: "relative", maxWidth: 1220, margin: "0 auto", width: "100%" }}>
          <div className="flex items-center" style={{ gap: 8, color: "rgba(242,236,224,.72)", fontSize: 12.5, marginBottom: 14 }}>
            <Link href="/activities" style={{ color: "rgba(242,236,224,.72)" }}>{nav("activities")}</Link><span>/</span><span style={{ color: "#f3e6c8" }}>{activity.name}</span>
          </div>
          <div style={{ color: "#f3e6c8", fontSize: 12.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 12 }}>{t("eyebrow")}</div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(30px,6.4vw,66px)", lineHeight: 1.04, letterSpacing: "-.015em", margin: 0, maxWidth: 860, overflowWrap: "break-word", textShadow: "0 2px 24px rgba(20,12,4,.4)" }}>{activity.name}</h1>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <main style={{ maxWidth: 1220, margin: "0 auto", padding: "clamp(28px,4vw,44px) clamp(18px,5vw,56px) 0" }}>
        <div className="detail-grid">
          <div>
            {/* FACT STRIP */}
            {(facts.length > 0 || tags.length > 0) && (
              <section aria-label="At a glance" style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
                {facts.length > 0 && (
                  <div className="factstrip">
                    {facts.map((f) => (
                      <div key={f.label} style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 12, padding: "15px 16px" }}>
                        <div className="flex items-center" style={{ gap: 7, color: "#96631a", marginBottom: 8 }}>{f.icon}</div>
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

            {/* ABOUT */}
            {(activity.description || activity.detailedDescription) && (
              <section style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.2vw,32px)", margin: "0 0 14px" }}>{t("aboutHeading")}</h2>
                {activity.description && <p style={{ fontFamily: SERIF, color: "#5a1e03", fontSize: "clamp(18px,2.2vw,22px)", lineHeight: 1.5, margin: "0 0 16px" }}>{activity.description}</p>}
                {activity.detailedDescription && moreOpen && <p style={{ color: "#4a3f34", fontSize: 16, lineHeight: 1.7, margin: "0 0 12px", whiteSpace: "pre-line" }}>{activity.detailedDescription}</p>}
                {activity.detailedDescription && (
                  <button onClick={() => setMoreOpen((v) => !v)} className="inline-flex items-center" style={{ background: "none", border: "none", color: "#96631a", fontWeight: 600, fontSize: 14.5, cursor: "pointer", padding: 0, gap: 6 }}>
                    {moreOpen ? pd("readLess") : pd("readMore")}<Chevron rot={moreOpen ? "rotate(180deg)" : "rotate(0deg)"} />
                  </button>
                )}
              </section>
            )}

            {/* SAFETY */}
            {activity.safetyInformation && (
              <section style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
                <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 16, padding: "clamp(20px,3vw,26px)" }}>
                  <div className="flex items-center" style={{ gap: 9, marginBottom: 12 }}>
                    <span className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 10, background: "#e6ece2", color: "#274e22", flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6Z" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                    <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(19px,2.4vw,22px)", margin: 0 }}>{t("safety")}</h2>
                  </div>
                  <p style={{ color: "#4a3f34", fontSize: 15, lineHeight: 1.65, margin: 0, whiteSpace: "pre-line" }}>{activity.safetyInformation}</p>
                </div>
              </section>
            )}

            {/* PARKS OFFERING THIS ACTIVITY */}
            {parks.length > 0 && (
              <section style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
                <FeaturedCarousel title={t("parksOffering")} subtitle={t("parksOfferingSub")} items={parks} renderCard={renderParkCard} />
              </section>
            )}

            {/* SAFARIS FEATURING THIS EXPERIENCE */}
            {safaris.length > 0 && (
              <section style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
                <FeaturedCarousel title={t("safarisTitle", { name: activity.name })} subtitle={t("safarisSub")} items={safaris} renderCard={renderSafariCard} />
              </section>
            )}

            {/* PHOTOS */}
            {images.length > 0 && (
              <section style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.2vw,32px)", margin: "0 0 18px" }}>{t("inPhotos", { name: activity.name })}</h2>
                <PhotoWheel images={images} label={activity.name} />
              </section>
            )}
          </div>

          {/* STICKY RAIL */}
          <aside>
            <div className="rail-sticky">{railCard}</div>
          </aside>
        </div>
      </main>

      {/* FINAL CONVERSION BAND */}
      <section style={{ position: "relative", background: "#3d1402", color: "#faf8f5", padding: "clamp(56px,8vw,90px) clamp(18px,5vw,56px)", overflow: "hidden", marginTop: "clamp(40px,6vw,72px)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.08, margin: "0 0 14px" }}>{t("bandTitle", { name: activity.name })}</h2>
          <p style={{ color: "rgba(242,236,224,.82)", fontSize: 17, lineHeight: 1.55, margin: "0 0 30px" }}>{t("bandBody", { name: activity.name })}</p>
          <div className="flex flex-wrap justify-center" style={{ gap: 12, marginBottom: 34 }}>
            <Link href={planHref} className="inline-flex items-center gap-2 font-semibold" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 16, borderRadius: 8, padding: "16px 30px", boxShadow: "0 10px 28px rgba(196,143,43,.4)" }}>{home("ctaCta")}<Arrow size={17} /></Link>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold" style={{ background: "rgba(242,236,224,.08)", color: "#fff", border: "1.5px solid rgba(242,236,224,.4)", fontSize: 16, borderRadius: 8, padding: "15px 28px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.4.5c-.2.2-.3.4-.1.6.5.8 1 1.4 1.7 1.9.5.3.8.4 1 .1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.2.1.6-.1 1.2Z" /></svg>{footer("whatsapp")}
            </a>
          </div>
          <div className="flex flex-wrap justify-center" style={{ gap: "14px 26px", paddingTop: 26, borderTop: "1px solid rgba(242,236,224,.15)" }}>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><span style={{ color: "#00aa6c", fontWeight: 700, fontFamily: SERIF, fontSize: 16 }}>5.0</span><span style={{ color: "#c48f2b", letterSpacing: 1 }}>★★★★★</span>Tripadvisor</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c48f2b" strokeWidth={2}><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6Z" strokeLinejoin="round" /></svg>{pd("accredited")}</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c48f2b" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" /></svg>{pd("replyBadge")}</span>
          </div>
        </div>
      </section>

      {/* MOBILE STICKY ENQUIRE BAR */}
      <div className="mobile-bar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 120, background: "#fff", borderTop: "1px solid #e4ddd1", boxShadow: "0 -6px 24px rgba(0,0,0,.1)", padding: "11px 16px", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#7a6f61" }}>{t("mobilePlanTo")}</div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 16, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activity.name}</div>
        </div>
        <Link href={planHref} className="inline-flex items-center gap-2" style={{ flexShrink: 0, background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 15, borderRadius: 8, padding: "13px 22px" }}>{t("enquire")}<Arrow size={15} /></Link>
      </div>
      <div className="mobile-bar" style={{ height: 70 }} aria-hidden="true" />
    </div>
  );
}
