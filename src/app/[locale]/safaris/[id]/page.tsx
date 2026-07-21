"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, notFound } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import SafariDetailSkeleton from "@/components/safari/SafariDetailSkeleton";
import ContextualFAQ from "@/components/ui/ContextualFAQ";
import FeaturedCarousel from "@/components/ui/FeaturedCarousel";
import ReviewCard, { type ReviewItem } from "@/components/ui/ReviewCard";
import type { MapStopGeo } from "@/components/safari/ItineraryRouteMap";
import { apiClient } from "@/lib/api";

// Real OSM route map — client-only (Leaflet needs window).
const ItineraryRouteMap = dynamic(() => import("@/components/safari/ItineraryRouteMap"), { ssr: false, loading: () => null });

// ── types (local — includes fields the global Itinerary type doesn't yet carry) ──
interface DayPark { parkSlug?: string; parkName?: string; primaryImageUrl?: string; latitude?: number; longitude?: number }
interface DayActivity { activitySlug?: string; activityName?: string; durationHours?: number; isOptional?: boolean }
interface DayAccommodation { accommodationSlug?: string; accommodationName?: string; primaryImageUrl?: string; board?: string; roomType?: string; roomStandard?: string; nights?: number }
interface ItinDay {
  dayNumber: number; dayTag?: string; title?: string; description?: string;
  morningActivities?: string; afternoonActivities?: string; eveningActivities?: string;
  wildlifeHighlights?: string; scenicHighlights?: string; specialNotes?: string;
  startLocation?: string; endLocation?: string; distanceKm?: number; isOvernight?: boolean;
  mealsIncluded?: string; dayImageUrl?: string;
  parks?: DayPark[]; activities?: DayActivity[]; accommodations?: DayAccommodation[];
}
interface CostSummary { currency?: string; accommodationRack?: number; parkFeesRack?: number; activitiesRack?: number; grandTotalRack?: number }
interface Pax { nationCategoryName?: string; ageCategoryName?: string; count?: number }
interface Itin {
  name: string; code: string; tripTypeDisplayName?: string; budgetCategoryDisplayName?: string; budgetCategoryTier?: number;
  totalDays?: number; totalNights?: number; startLocation?: string; endLocation?: string; carCount?: number; totalPaxCount?: number;
  description?: string; highlights?: string; primaryImageUrl?: string;
  inclusions?: string[]; exclusions?: string[]; costSummary?: CostSummary[]; paxBreakdown?: Pax[]; days?: ItinDay[];
}
interface SimilarSafari { code: string; name: string; description?: string; totalDays?: number; totalPaxCount?: number; primaryImageUrl?: string; costSummary?: CostSummary[] }

const SERIF = "var(--font-source-serif), Georgia, serif";
const WHATSAPP = "https://wa.me/255786345408";
const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", TZS: "TSh " };
const GRADIENTS = [
  "linear-gradient(150deg,#5a7a3a,#274e22)", "linear-gradient(150deg,#8a6a2a,#5a3410)",
  "linear-gradient(150deg,#c9962f,#7a2f14)", "linear-gradient(150deg,#3a8a7a,#134a42)",
  "linear-gradient(150deg,#9aa06a,#4a5a2a)", "linear-gradient(150deg,#8a5a2a,#3e1502)",
];
const hashStr = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const grad = (s: string) => GRADIENTS[hashStr(s || "x") % GRADIENTS.length];
const ONE_LINE: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

function splitList(raw?: string): string[] {
  if (!raw) return [];
  const s = raw.trim();
  if (s.startsWith("[")) { try { const a = JSON.parse(s); if (Array.isArray(a)) return a.map((x) => String(x).trim()).filter(Boolean); } catch { /* fall */ } }
  return s.split(/\r?\n|,/).map((x) => x.replace(/[[\]"']/g, "").trim()).filter(Boolean);
}

const CSS = `
.itd *{box-sizing:border-box}
.itd .mwrap{overflow:hidden;padding:6px 0}
.itd .mtrack{display:flex;width:max-content;animation:itd-marquee var(--mdur,40s) linear infinite}
.itd .mwrap:hover .mtrack{animation-play-state:paused}
.itd .mitem{flex:0 0 auto;margin-right:16px}
@keyframes itd-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.itd .tcard{transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s}
.itd .tcard:hover{transform:translateY(-5px);box-shadow:0 22px 46px rgba(62,21,2,.16)}
.itd .chip-link{transition:background .2s,border-color .2s,color .2s}
.itd .chip-link:hover{background:#f3e6c8;border-color:#c48f2b;color:#96631a}
.itd .journey-cols{display:grid;grid-template-columns:minmax(0,1fr);gap:24px}
.itd .journey-left{display:none}
.itd .glance-strip{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.itd .mobile-only{display:block}
@media(min-width:980px){
  .itd .journey-cols{grid-template-columns:360px minmax(0,1fr);gap:36px;align-items:start}
  .itd .journey-left{display:flex;position:sticky;top:150px}
  .itd .glance-strip{grid-template-columns:repeat(4,1fr)}
  .itd .mobile-only{display:none!important}
}
@media(prefers-reduced-motion:reduce){.itd *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
`;

function Arrow({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}
const MoonIcon = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 4 3 20h18L12 4Z" /><path d="M12 4v16" /></svg>;

interface MapStop { n: number; lat?: number; lng?: number }
/** Route map: numbered pins placed at real geographic coordinates (auto-fit to
 *  the frame). Falls back to a stylized path when fewer than 2 stops resolve. */
function RouteMap({ stops, active, height = 300 }: { stops: MapStop[]; active: number; height?: number }) {
  const W = 380, H = height, M = 42;
  const geo = stops.filter((s) => s.lat != null && s.lng != null) as { n: number; lat: number; lng: number }[];
  let order: { n: number; x: number; y: number }[];
  if (geo.length >= 2) {
    const lats = geo.map((s) => s.lat), lngs = geo.map((s) => s.lng);
    let minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    let latR = (maxLat - minLat) || 1, lngR = (maxLng - minLng) || 1;
    minLat -= latR * 0.14; maxLat += latR * 0.14; minLng -= lngR * 0.14; maxLng += lngR * 0.14;
    latR = maxLat - minLat; lngR = maxLng - minLng;
    order = geo.map((s) => ({ n: s.n, x: M + ((s.lng - minLng) / lngR) * (W - 2 * M), y: M + ((maxLat - s.lat) / latR) * (H - 2 * M) }));
  } else {
    const n = stops.length || 1;
    order = stops.map((s, i) => { const t = i / (n - 1 || 1); return { n: s.n, x: 40 + t * (W - 80), y: H * 0.5 + Math.sin(t * Math.PI * 1.6) * (H * 0.26) + (i % 2 ? 12 : -12) }; });
  }
  let path = order.length ? `M${order[0].x.toFixed(1)} ${order[0].y.toFixed(1)}` : "";
  for (let i = 1; i < order.length; i++) { const a = order[i - 1], b = order[i]; const cx = (a.x + b.x) / 2; path += ` C ${cx.toFixed(1)} ${a.y.toFixed(1)}, ${cx.toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`; }
  let pins = "";
  order.forEach((o, i) => { const isAct = o.n === active || (i === order.length - 1 && active >= o.n);
    pins += `<g><circle cx="${o.x.toFixed(1)}" cy="${o.y.toFixed(1)}" r="${isAct ? 15 : 11}" fill="${isAct ? "#c48f2b" : "#3d1402"}" stroke="#fff" stroke-width="2.5"/><text x="${o.x.toFixed(1)}" y="${(o.y + 4).toFixed(1)}" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#fff">${o.n}</text></g>`; });
  const inner = `<defs><pattern id="topo" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M0 17q17 -14 34 0" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/></pattern></defs>`
    + `<rect width="${W}" height="${H}" fill="url(#topo)"/>`
    + `<path d="${path}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>` + pins;
  return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: inner }} />;
}

// Approx coordinates for common non-park stops (airport, towns, Zanzibar) so
// arrival/departure/beach days still place correctly on the route map.
const GAZETTEER: [string, number, number][] = [
  ["kilimanjaro international", -3.4294, 37.0745], ["jro", -3.4294, 37.0745], ["kilimanjaro", -3.0674, 37.3556],
  ["arusha", -3.3869, 36.683], ["karatu", -3.3419, 35.6667], ["moshi", -3.3349, 37.3403],
  ["stone town", -6.1659, 39.2026], ["zanzibar", -6.1659, 39.2026], ["dar es salaam", -6.7924, 39.2083], ["dar", -6.7924, 39.2083],
  ["mto wa mbu", -3.35, 35.85], ["natron", -2.4167, 36.0], ["eyasi", -3.6, 35.05], ["grumeti", -2.15, 34.2], ["seronera", -2.4419, 34.8235],
];
function resolveStopCoord(d: ItinDay): { lat: number; lng: number } | null {
  const p = (d.parks || []).find((x) => x.latitude != null && x.longitude != null);
  if (p) return { lat: Number(p.latitude), lng: Number(p.longitude) };
  const loc = `${d.endLocation || ""} ${d.startLocation || ""}`.toLowerCase();
  const hit = GAZETTEER.find(([k]) => loc.includes(k));
  return hit ? { lat: hit[1], lng: hit[2] } : null;
}

export default function SafariDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("itineraryDetail");
  const pd = useTranslations("parkDetail");
  const nav = useTranslations("nav");
  const footer = useTranslations("footer");

  const [itin, setItin] = useState<Itin | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{ rating: number; count: number } | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [similar, setSimilar] = useState<SimilarSafari[]>([]);

  const [open, setOpen] = useState<Record<number, boolean>>({ 1: true });
  const [allExpanded, setAllExpanded] = useState(false);
  const [active, setActive] = useState(1);
  const [openFaq, setOpenFaq] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiClient.get(`/public/safaris/${params.id}`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive && res.data.success) setItin(res.data.data?.itinerary || res.data.data); })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    apiClient.get(`/public/testimonies/summary`, { headers: { "Accept-Language": locale } })
      .then((res) => { const d = res.data?.data; if (alive && d?.reviewCount > 0) setSummary({ rating: d.averageRating, count: d.reviewCount }); })
      .catch(() => {});
    apiClient.get(`/public/testimonies?page=0&size=2`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive) { const d = res.data?.data; setReviews(d?.testimonies || d || []); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [params.id, locale]);

  const days = useMemo(() => (itin?.days ? [...itin.days].sort((a, b) => a.dayNumber - b.dayNumber) : []), [itin]);

  // similar safaris (by trip type), once itinerary is known
  useEffect(() => {
    if (!itin) return;
    let alive = true;
    apiClient.get(`/public/safaris?page=0&size=8`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (!alive) return; const d = res.data?.data; const arr: SimilarSafari[] = d?.safaris || d || []; setSimilar(arr.filter((s) => s.code !== itin.code).slice(0, 6)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [itin, locale]);

  // scroll: sticky sub-bar + active-day sync
  useEffect(() => {
    if (!days.length) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 420);
        let act = 1;
        for (const d of days) { const el = document.getElementById("itd-day-" + d.dayNumber); if (el && el.getBoundingClientRect().top <= 220) act = d.dayNumber; }
        setActive(act);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [days]);

  const gotoDay = useCallback((n: number) => {
    setActive(n); setOpen((o) => ({ ...o, [n]: true }));
    setTimeout(() => { const el = document.getElementById("itd-day-" + n); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" }); }, 40);
  }, []);
  const toggleDay = (n: number) => setOpen((o) => ({ ...o, [n]: !o[n] }));
  const toggleAll = () => { const all = !allExpanded; setAllExpanded(all); const o: Record<number, boolean> = {}; days.forEach((d) => { o[d.dayNumber] = all; }); setOpen(o); };

  if (loading) return <SafariDetailSkeleton />;
  if (!itin) { notFound(); }

  const cost = itin.costSummary?.[0];
  const cur = cost?.currency;
  const sym = cur ? CURRENCY_SYMBOLS[cur] ?? `${cur} ` : "$";
  const money = (v?: number) => (v != null ? `${sym}${Math.round(v).toLocaleString()}` : null);
  const pax = itin.totalPaxCount && itin.totalPaxCount > 0 ? itin.totalPaxCount : 1;
  const perPax = cost?.grandTotalRack && cost.grandTotalRack > 0 ? cost.grandTotalRack / pax : null;
  const fromPrice = money(perPax ?? undefined);
  const bookHref = `/book?safari=${encodeURIComponent(itin.code)}`;
  const highlights = splitList(itin.highlights);
  const paxLine = (itin.paxBreakdown || []).map((p) => `${p.count} ${(p.nationCategoryName || "").toLowerCase()} ${(p.ageCategoryName || "").toLowerCase()}${(p.count || 0) > 1 ? "s" : ""}`.trim()).filter(Boolean).join(", ");
  const distinctParks = new Set<string>(); days.forEach((d) => (d.parks || []).forEach((p) => p.parkSlug && distinctParks.add(p.parkSlug)));
  const tierDots = itin.budgetCategoryTier ? "●".repeat(itin.budgetCategoryTier) + "○".repeat(Math.max(0, 5 - itin.budgetCategoryTier)) : "";
  const durationShort = `${itin.totalDays ?? 0}d / ${itin.totalNights ?? 0}n`;
  const eyebrow = [itin.tripTypeDisplayName, itin.budgetCategoryDisplayName, t("durationValue", { days: itin.totalDays ?? 0, nights: itin.totalNights ?? 0 })].filter(Boolean).join(" · ");

  const glance = [
    { icon: "M12 7v5l3 3", circle: true, label: t("glDuration"), value: t("durationValue", { days: itin.totalDays ?? 0, nights: itin.totalNights ?? 0 }) },
    { icon: "pin", label: t("glRoute"), value: `${itin.startLocation ?? ""} → ${itin.endLocation ?? ""}` },
    { icon: "grp", label: t("glGroup"), value: paxLine || "—" },
    { icon: "acacia", label: t("glTripType"), value: itin.tripTypeDisplayName || "—" },
    { icon: "star", label: t("glBudget"), value: `${itin.budgetCategoryDisplayName || ""}${tierDots ? " · " + tierDots : ""}` },
    { icon: "car", label: t("glVehicles"), value: t("vehiclesValue", { count: itin.carCount ?? 1 }) },
    { icon: "park", label: t("glParks"), value: t("parksValue", { count: distinctParks.size }) },
    ...(fromPrice ? [{ icon: "coin", label: t("glFrom"), value: `${fromPrice} pp` }] : []),
  ];
  const glanceIcon = (k: string) => {
    const paths: Record<string, string> = {
      pin: "M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z", grp: "M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3.3 2.7-5 6-5s6 1.7 6 5M16 6a2.6 2.6 0 1 1 0 5M21 20c0-2.5-2-4-5-4",
      acacia: "M4 15c2-6 5-9 8-9s6 3 8 9M8 15v3M16 15v3", star: "m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8",
      car: "M2 12l2-5h16l2 5M4 12h16v4H4zM7 16v2M17 16v2", park: "M3 21h18M5 21V9l7-5 7 5v12", coin: "M15 9.5c0-1.4-1.3-2.3-3-2.3s-3 .9-3 2.3 1.3 1.9 3 2.3 3 .9 3 2.3-1.3 2.3-3 2.3-3-.9-3-2.3M12 5.5v13",
    };
    if (k === "M12 7v5l3 3") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" /></svg>;
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={paths[k]} /></svg>;
  };

  const mealPills = (str?: string) => {
    const set = (str || "").split(",").map((s) => s.trim().toUpperCase());
    return ([["B", t("breakfast")], ["L", t("lunch")], ["D", t("dinner")]] as [string, string][]).map(([k, label]) => ({ label, on: set.includes(k) }));
  };
  const mealsShort = (str?: string) => (str || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).join(" · ");

  // dedupe consecutive stays
  const stays: { name: string; slug?: string; sub?: string; image?: string; nights: number }[] = [];
  days.forEach((d) => { const a = (d.accommodations || [])[0]; if (!a || !a.accommodationName) return; const last = stays[stays.length - 1]; if (last && last.slug === a.accommodationSlug) last.nights += 1; else stays.push({ name: a.accommodationName, slug: a.accommodationSlug, sub: a.board || d.endLocation, image: a.primaryImageUrl, nights: a.nights || 1 }); });

  const stops: MapStop[] = days.filter((d) => d.isOvernight || d.dayNumber === 1).map((d) => { const c = resolveStopCoord(d); return { n: d.dayNumber, lat: c?.lat, lng: c?.lng }; });
  const geoStops: MapStopGeo[] = stops.filter((s) => s.lat != null && s.lng != null).map((s) => ({ n: s.n, lat: s.lat as number, lng: s.lng as number }));

  const costRows = cost ? [
    cost.accommodationRack ? { label: t("costAccommodation"), value: money(cost.accommodationRack) } : null,
    cost.parkFeesRack ? { label: t("costParkFees"), value: money(cost.parkFeesRack) } : null,
    cost.activitiesRack ? { label: t("costActivities"), value: money(cost.activitiesRack) } : null,
  ].filter(Boolean) as { label: string; value: string }[] : [];

  // "Where you'll stay" — accommodation overlay card with a nights badge
  const renderStayCard = (s: { name: string; slug?: string; sub?: string; image?: string; nights: number }) => {
    const bg = s.image ? `50% 45%/cover no-repeat url('${s.image}')` : grad(s.name);
    return (
      <article className="group relative" style={{ height: 300, borderRadius: 20, overflow: "hidden", background: bg }}>
        {s.slug && <Link href={`/accommodations/${s.slug}`} aria-label={s.name} className="absolute inset-0 z-[5]" />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 30%,rgba(20,12,4,.55) 62%,rgba(20,12,4,.92) 100%)" }} />
        <div className="absolute" style={{ top: 14, right: 14, background: "#3d1402", color: "#f3e6c8", fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 20 }}>{t("nights", { count: s.nights })}</div>
        <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between" style={{ padding: 22, gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            {s.sub && <div style={{ color: "#f3e6c8", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6, ...ONE_LINE }}>{s.sub}</div>}
            <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: 21, lineHeight: 1.14, margin: 0, textShadow: "0 1px 12px rgba(20,12,4,.5)", ...ONE_LINE }}>{s.name}</h3>
          </div>
          {s.slug && <span className="flex items-center justify-center bg-white text-[#2a2018] group-hover:bg-brand-green group-hover:text-white transition-colors" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%" }}><Arrow size={17} /></span>}
        </div>
      </article>
    );
  };

  // "Similar safaris" — editorial safari card with "From {price}*" pill
  const renderSimilarCard = (s: SimilarSafari) => {
    const bg = s.primaryImageUrl ? `50% 45%/cover no-repeat url('${s.primaryImageUrl}')` : grad(s.code);
    const sp = s.costSummary?.[0]?.grandTotalRack && (s.totalPaxCount || 0) > 0 ? money(s.costSummary[0].grandTotalRack! / (s.totalPaxCount || 1)) : null;
    return (
      <article className="group relative" style={{ height: 300, borderRadius: 20, overflow: "hidden", background: bg }}>
        <Link href={`/safaris/${s.code}`} aria-label={s.name} className="absolute inset-0 z-[5]" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 26%,rgba(20,12,4,.5) 56%,rgba(20,12,4,.92) 100%)" }} />
        {sp && <div className="absolute inline-flex items-center" style={{ top: 14, right: 14, background: "rgba(20,12,4,.6)", backdropFilter: "blur(4px)", border: "1px solid rgba(196,143,43,.6)", color: "#f3e6c8", fontSize: 12.5, fontWeight: 700, padding: "6px 12px", borderRadius: 20 }}>{t("from")} {sp}*</div>}
        <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between" style={{ padding: 22, gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            {!!s.totalDays && <div style={{ color: "#f3e6c8", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>{t("durationValue", { days: s.totalDays, nights: Math.max(0, s.totalDays - 1) }).split("·")[0].trim()}</div>}
            <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: 20, lineHeight: 1.14, margin: 0, textShadow: "0 1px 12px rgba(20,12,4,.5)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.name}</h3>
            {s.description && <p style={{ color: "rgba(242,236,224,.82)", fontSize: 12.5, lineHeight: 1.4, margin: "6px 0 0", ...ONE_LINE }}>{s.description}</p>}
          </div>
          <span className="flex items-center justify-center bg-white text-[#2a2018] group-hover:bg-brand-green group-hover:text-white transition-colors" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%" }}><Arrow size={17} /></span>
        </div>
      </article>
    );
  };

  return (
    <div className="itd" style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", background: "linear-gradient(175deg,#faf8f5,#f1ece3 150%)", color: "#4a3f34", overflowX: "clip" }}>
      <style>{CSS}</style>

      {/* sticky sub-bar */}
      <div style={{ position: "fixed", top: 80, left: 0, right: 0, zIndex: 40, transform: scrolled ? "none" : "translateY(-120%)", opacity: scrolled ? 1 : 0, transition: "transform .3s,opacity .3s", background: "rgba(250,248,245,.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e4ddd1" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "10px clamp(18px,5vw,56px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 15, maxWidth: "min(46vw,340px)", ...ONE_LINE }}>{itin.name}</span>
            <span style={{ color: "#7a6f61", fontSize: 13, whiteSpace: "nowrap" }}>{durationShort}</span>
            {fromPrice && <span style={{ color: "#96631a", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>{t("from").toLowerCase()} {fromPrice} pp</span>}
          </div>
          <Link href={bookHref} className="inline-flex items-center gap-2" style={{ flexShrink: 0, background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 14, borderRadius: 7, padding: "10px 18px" }}>{t("tailor")}<Arrow size={15} /></Link>
        </div>
      </div>

      {/* hero */}
      <header style={{ position: "relative", overflow: "hidden", padding: "clamp(94px,13vh,132px) clamp(18px,5vw,56px) clamp(38px,5vw,58px)", background: itin.primaryImageUrl ? `50% 42%/cover no-repeat url('${itin.primaryImageUrl}')` : grad(itin.name) }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(20,12,4,.34) 0%,rgba(20,12,4,.42) 45%,rgba(20,12,4,.86) 100%)" }} />
        <div style={{ position: "relative", maxWidth: 1240, margin: "0 auto" }}>
          <div className="flex items-center" style={{ gap: 8, color: "rgba(242,236,224,.72)", fontSize: 12.5, marginBottom: 16 }}>
            <Link href="/safaris" style={{ color: "rgba(242,236,224,.72)" }}>{nav("safaris")}</Link><span>/</span><span style={{ color: "#f3e6c8" }}>{itin.code}</span>
          </div>
          <div style={{ maxWidth: 680 }}>
            {eyebrow && <div style={{ color: "#f3e6c8", fontSize: 12, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 12 }}>{eyebrow}</div>}
            <h1 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(30px,5.4vw,56px)", lineHeight: 1.03, letterSpacing: "-.015em", margin: "0 0 14px", overflowWrap: "break-word", textShadow: "0 2px 24px rgba(20,12,4,.4)" }}>{itin.name}</h1>
            {(itin.startLocation || itin.endLocation) && (
              <div className="flex items-center" style={{ gap: 10, color: "#fff", fontSize: "clamp(15px,2vw,18px)", fontWeight: 500, marginBottom: 22 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#c48f2b" strokeWidth={2}><path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z" /><circle cx="12" cy="11" r="2.3" /></svg>
                {itin.startLocation} <span style={{ color: "#c48f2b" }}>→</span> {itin.endLocation}
              </div>
            )}
            <div className="flex flex-wrap items-center" style={{ gap: 12, marginBottom: 20 }}>
              <Link href={bookHref} className="inline-flex items-center gap-2" style={{ background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 16, borderRadius: 8, padding: "15px 26px", boxShadow: "0 10px 30px rgba(196,143,43,.45)" }}>{t("tailor")}<Arrow size={17} /></Link>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2" style={{ background: "rgba(242,236,224,.1)", color: "#fff", fontWeight: 600, fontSize: 16, border: "1.5px solid rgba(242,236,224,.45)", borderRadius: 8, padding: "14px 22px" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.4.5c-.2.2-.3.4-.1.6.5.8 1 1.4 1.7 1.9.5.3.8.4 1 .1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.2.1.6-.1 1.2Z" /></svg>{footer("whatsapp")}</a>
            </div>
            <div className="flex flex-wrap items-center" style={{ gap: "10px 16px" }}>
              {fromPrice && <span className="inline-flex items-center" style={{ gap: 7, background: "rgba(250,248,245,.14)", backdropFilter: "blur(4px)", border: "1px solid rgba(250,248,245,.25)", borderRadius: 20, padding: "7px 14px", color: "#fff", fontSize: 13.5, fontWeight: 600 }}>{t("from").toLowerCase()} <span style={{ color: "#f3e6c8" }}>{fromPrice}</span> pp</span>}
              {summary && <span className="inline-flex items-center" style={{ gap: 6, color: "rgba(242,236,224,.85)", fontSize: 13 }}><span style={{ color: "#c48f2b", letterSpacing: 1 }}>★★★★★</span> {summary.rating.toFixed(1)} · Tripadvisor</span>}
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "clamp(26px,4vw,42px) clamp(18px,5vw,56px) 0" }}>
        {/* trip at a glance */}
        <section aria-label={t("journey")} style={{ marginBottom: "clamp(30px,4vw,44px)" }}>
          <div className="glance-strip">
            {glance.map((g) => (
              <div key={g.label} style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 7 }}>
                <div className="flex items-center" style={{ gap: 7, color: "#96631a" }}>{glanceIcon(g.icon)}</div>
                <div><div style={{ fontSize: 11, color: "#7a6f61", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>{g.label}</div><div style={{ fontWeight: 600, color: "#2a2018", fontSize: 15, lineHeight: 1.25, overflowWrap: "anywhere" }}>{g.value}</div></div>
              </div>
            ))}
          </div>
          {highlights.length > 0 && (
            <div className="flex flex-wrap" style={{ gap: 8, marginTop: 14 }}>
              {highlights.map((h) => <span key={h} className="inline-flex items-center" style={{ gap: 7, background: "#f3e6c8", color: "#96631a", fontSize: 13, fontWeight: 600, padding: "7px 13px", borderRadius: 20 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7Z" /></svg>{h}</span>)}
            </div>
          )}
        </section>

        {/* answer-first intro (full width) */}
        {itin.description && (
          <section style={{ marginBottom: "clamp(32px,4vw,48px)" }}>
            <p style={{ fontFamily: SERIF, color: "#5a1e03", fontSize: "clamp(19px,2.4vw,24px)", lineHeight: 1.5, margin: 0 }}>{itin.description}</p>
          </section>
        )}

        {/* the journey */}
        <section aria-label={t("journey")}>
          <div className="flex items-end justify-between flex-wrap" style={{ gap: 16, marginBottom: 6 }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(26px,3.4vw,36px)", margin: 0 }}>{t("journey")}</h2>
            {days.length > 1 && <button onClick={toggleAll} style={{ background: "none", border: "1.5px solid #e4ddd1", color: "#274e22", fontWeight: 600, fontSize: 13.5, borderRadius: 8, padding: "9px 16px", cursor: "pointer" }}>{allExpanded ? t("collapseAll") : t("expandAll")}</button>}
          </div>
          <div className="flex flex-wrap" style={{ gap: 14, margin: "0 0 22px", color: "#7a6f61", fontSize: 12.5 }}>
            <span className="inline-flex items-center" style={{ gap: 6 }}>{MoonIcon}{t("legendOvernight")}</span>
            <span className="inline-flex items-center" style={{ gap: 6 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 13l2-5h14l2 5M5 13h14v4H5zM8 17v2M16 17v2" /></svg>{t("legendDrive")}</span>
            <span className="inline-flex items-center" style={{ gap: 6 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M5 3v8M8 3v8M6.5 11v10M11 3c-1 0-2 1-2 4s1 3.5 2 4v10M17 3c-2 0-3 2-3 5s1 3.5 2 4v9" /></svg>{t("legendMeals")}</span>
          </div>

          {/* mobile map card */}
          {geoStops.length > 0 && (
            <div className="mobile-only" style={{ position: "relative", height: 210, borderRadius: 16, overflow: "hidden", border: "1px solid #e4ddd1", background: "linear-gradient(150deg,#8aa06a,#4a5a2a)", isolation: "isolate", marginBottom: 16 }}>
              <ItineraryRouteMap stops={geoStops} active={active} />
            </div>
          )}

          {/* mobile day-chip scroller */}
          {days.length > 1 && (
            <div className="mobile-only" style={{ position: "sticky", top: 132, zIndex: 60, margin: "0 -18px 18px", padding: "10px 18px", background: "rgba(250,248,245,.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid #e4ddd1" }}>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                {days.map((d) => { const on = d.dayNumber === active; return <button key={d.dayNumber} onClick={() => gotoDay(d.dayNumber)} aria-current={on} style={{ flex: "0 0 auto", background: on ? "#c48f2b" : "#fff", color: on ? "#3d1402" : "#4a3f34", border: `1.5px solid ${on ? "#c48f2b" : "#e4ddd1"}`, fontWeight: 600, fontSize: 13, borderRadius: 20, padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap" }}>{t("glDuration") && `Day ${d.dayNumber}`}</button>; })}
              </div>
            </div>
          )}

          <div className="journey-cols">
            {/* sticky map + day rail (desktop) */}
            <aside className="journey-left" style={{ flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 16, overflow: "hidden", width: "100%" }}>
                <div style={{ position: "relative", height: 300, background: "linear-gradient(150deg,#8aa06a,#4a5a2a)", isolation: "isolate" }}>{geoStops.length ? <ItineraryRouteMap stops={geoStops} active={active} /> : <RouteMap stops={stops} active={active} />}</div>
                <div style={{ padding: "12px 16px", borderTop: "1px solid #e4ddd1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: "#7a6f61", ...ONE_LINE }}>{itin.startLocation} → {itin.endLocation}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#274e22", whiteSpace: "nowrap" }}>{durationShort}</span>
                </div>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 16, padding: "12px 8px", width: "100%" }}>
                {days.map((d) => { const on = d.dayNumber === active; return (
                  <button key={d.dayNumber} onClick={() => gotoDay(d.dayNumber)} aria-current={on} className="flex items-center w-full text-left" style={{ gap: 12, background: on ? "#f3e6c8" : "transparent", border: "none", borderRadius: 10, padding: "10px 12px", cursor: "pointer", transition: "background .2s" }}>
                    <span className="flex items-center justify-center flex-shrink-0" style={{ width: 30, height: 30, borderRadius: "50%", background: on ? "#c48f2b" : "#fff", color: on ? "#fff" : "#7a6f61", border: `2px solid ${on ? "#c48f2b" : "#e4ddd1"}`, fontSize: 12, fontWeight: 700 }}>{d.dayNumber}</span>
                    <span style={{ minWidth: 0, flex: 1 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: on ? "#96631a" : "#2a2018", ...ONE_LINE }}>{d.title}</span><span style={{ fontSize: 11.5, color: "#7a6f61" }}>{d.startLocation} → {d.endLocation}</span></span>
                    {d.isOvernight && <span title={t("legendOvernight")} className="flex-shrink-0" style={{ color: "#274e22", display: "flex" }}>{MoonIcon}</span>}
                  </button>
                ); })}
              </div>
            </aside>

            {/* timeline */}
            <div className="flex flex-col" style={{ gap: 18 }}>
              {days.map((d) => {
                const isOpen = !!open[d.dayNumber];
                const acc = (d.accommodations || [])[0];
                const meals = mealPills(d.mealsIncluded);
                const timeBlocks = [d.morningActivities && { label: t("morning"), text: d.morningActivities }, d.afternoonActivities && { label: t("afternoon"), text: d.afternoonActivities }, d.eveningActivities && { label: t("evening"), text: d.eveningActivities }].filter(Boolean) as { label: string; text: string }[];
                const activeCard = d.dayNumber === active;
                return (
                  <article key={d.dayNumber} id={"itd-day-" + d.dayNumber} style={{ scrollMarginTop: 140, background: "#fff", border: `1px solid ${activeCard ? "#c48f2b" : "#e4ddd1"}`, borderRadius: 16, overflow: "hidden", boxShadow: activeCard ? "0 12px 34px rgba(196,143,43,.16)" : "0 1px 2px rgba(62,21,2,.04)", transition: "border-color .3s,box-shadow .3s" }}>
                    <button onClick={() => toggleDay(d.dayNumber)} className="flex items-start justify-between w-full text-left" style={{ gap: 14, background: "none", border: "none", padding: "18px 20px", cursor: "pointer" }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="flex items-center" style={{ gap: 9, marginBottom: 4 }}>
                          <span style={{ flexShrink: 0, background: "#274e22", color: "#faf8f5", fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 5 }}>{d.dayTag || `Day ${d.dayNumber}`}</span>
                          {d.isOvernight && <span style={{ color: "#274e22", display: "flex" }}>{MoonIcon}</span>}
                        </div>
                        <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 19, lineHeight: 1.2, margin: "0 0 5px" }}>{d.title}</h3>
                        <div className="flex flex-wrap items-center" style={{ gap: "5px 12px", color: "#7a6f61", fontSize: 12.5 }}>
                          {(d.startLocation || d.endLocation) && <span className="inline-flex items-center" style={{ gap: 5 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z" /></svg>{d.startLocation} → {d.endLocation}</span>}
                          {!!d.distanceKm && d.distanceKm > 0 && <span className="inline-flex items-center" style={{ gap: 5 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 13l2-5h14l2 5M5 13h14v4H5zM8 17v2M16 17v2" /></svg>≈{d.distanceKm} km</span>}
                          {!isOpen && mealsShort(d.mealsIncluded) && <span>{mealsShort(d.mealsIncluded)}</span>}
                        </div>
                      </div>
                      <span style={{ flexShrink: 0, color: "#96631a", fontSize: 24, lineHeight: 1, transform: isOpen ? "rotate(45deg)" : "none", transition: "transform .25s" }}>+</span>
                    </button>

                    {isOpen && (
                      <div style={{ padding: "0 20px 22px" }}>
                        <div style={{ position: "relative", aspectRatio: "16 / 7", borderRadius: 12, overflow: "hidden", background: d.dayImageUrl ? `50% 45%/cover no-repeat url('${d.dayImageUrl}')` : grad(d.title || String(d.dayNumber)), marginBottom: 16 }}>
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 60%,rgba(20,12,4,.4))" }} />
                        </div>
                        {d.description && <p style={{ color: "#4a3f34", fontSize: 15, lineHeight: 1.65, margin: "0 0 16px" }}>{d.description}</p>}
                        {timeBlocks.length > 0 && (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 16 }}>
                            {timeBlocks.map((b) => (
                              <div key={b.label} style={{ background: "#faf8f5", border: "1px solid #e4ddd1", borderRadius: 10, padding: "12px 14px" }}>
                                <div style={{ color: "#96631a", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>{b.label}</div>
                                <div style={{ color: "#4a3f34", fontSize: 13.5, lineHeight: 1.5 }}>{b.text}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {d.wildlifeHighlights && <div className="flex items-start" style={{ gap: 10, background: "#e6ece2", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}><span style={{ flexShrink: 0, color: "#274e22", display: "flex" }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}><ellipse cx="12" cy="15.5" rx="4.2" ry="3.5" /><circle cx="6" cy="10.5" r="1.7" /><circle cx="9.8" cy="7.8" r="1.7" /><circle cx="14.2" cy="7.8" r="1.7" /><circle cx="18" cy="10.5" r="1.7" /></svg></span><div><span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#274e22", marginBottom: 2 }}>{t("wildlife")}</span><span style={{ color: "#3e3117", fontSize: 14, lineHeight: 1.5 }}>{d.wildlifeHighlights}</span></div></div>}
                        {d.scenicHighlights && <div className="flex items-start" style={{ gap: 10, background: "#f1ece3", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}><span style={{ flexShrink: 0, color: "#3e3117", display: "flex" }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 20 9 8l4 6.5 2-3 6 8.5H3Z" /></svg></span><div><span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#3e3117", marginBottom: 2 }}>{t("scenery")}</span><span style={{ color: "#3e3117", fontSize: 14, lineHeight: 1.5 }}>{d.scenicHighlights}</span></div></div>}
                        {d.specialNotes && <div className="flex items-start" style={{ gap: 10, background: "rgba(196,143,43,.1)", border: "1px solid rgba(196,143,43,.3)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#96631a" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" strokeLinecap="round" strokeLinejoin="round" /></svg><span style={{ color: "#5a1e03", fontSize: 13.5, lineHeight: 1.5 }}>{d.specialNotes}</span></div>}

                        <div className="flex flex-col" style={{ gap: 12, paddingTop: 6, borderTop: "1px solid #e4ddd1", marginTop: 4 }}>
                          {acc && acc.accommodationName && (
                            <div className="flex items-center" style={{ gap: 12 }}>
                              <span className="flex-shrink-0 flex justify-center" style={{ width: 26, color: "#274e22" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 18V8M3 12h18M21 18v-4a2 2 0 0 0-2-2H9V9H3M6.5 12V9" /></svg></span>
                              <Link href={acc.accommodationSlug ? `/accommodations/${acc.accommodationSlug}` : "#"} className="tcard flex items-center" style={{ flex: 1, gap: 12, background: "#faf8f5", border: "1px solid #e4ddd1", borderRadius: 10, padding: "8px 12px 8px 8px" }}>
                                <span className="flex-shrink-0" style={{ width: 52, height: 52, borderRadius: 8, background: acc.primaryImageUrl ? `50% 50%/cover no-repeat url('${acc.primaryImageUrl}')` : grad(acc.accommodationName) }} />
                                <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 11, color: "#7a6f61", textTransform: "uppercase", letterSpacing: ".05em" }}>{t("stay")}</span><span style={{ fontFamily: SERIF, fontWeight: 600, color: "#2a2018", fontSize: 15, ...ONE_LINE, display: "block" }}>{acc.accommodationName}</span>{(acc.board || acc.roomStandard || acc.roomType) && <span style={{ fontSize: 12, color: "#7a6f61" }}>{[acc.roomStandard, acc.roomType].filter(Boolean).join(" ")}{acc.board ? ` · ${acc.board}` : ""}</span>}</span>
                              </Link>
                            </div>
                          )}
                          {d.mealsIncluded && (
                            <div className="flex items-center" style={{ gap: 12 }}>
                              <span className="flex-shrink-0 flex justify-center" style={{ width: 26, color: "#274e22" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M5 3v8M8 3v8M6.5 11v10M11 3c-1 0-2 1-2 4s1 3.5 2 4v10M17 3c-2 0-3 2-3 5s1 3.5 2 4v9" /></svg></span>
                              <div className="flex flex-wrap" style={{ gap: 7 }}>
                                {meals.map((m) => <span key={m.label} style={{ background: m.on ? "#c48f2b" : "transparent", color: m.on ? "#3d1402" : "#7a6f61", border: `1px solid ${m.on ? "#c48f2b" : "#e4ddd1"}`, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 20 }}>{m.label}</span>)}
                              </div>
                            </div>
                          )}
                          {(d.activities || []).length > 0 && (
                            <div className="flex items-start" style={{ gap: 12 }}>
                              <span className="flex-shrink-0 flex justify-center" style={{ width: 26, color: "#274e22" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /></svg></span>
                              <div className="flex flex-wrap" style={{ gap: 7 }}>
                                {(d.activities || []).map((a, i) => <Link key={i} href={a.activitySlug ? `/activities/${a.activitySlug}` : "#"} className="chip-link inline-flex items-center" style={{ gap: 6, background: "#fff", border: "1px solid #e4ddd1", fontSize: 12.5, fontWeight: 600, color: "#4a3f34", padding: "6px 12px", borderRadius: 20 }}>{a.activityName}<span style={{ color: "#7a6f61", fontWeight: 500 }}>{a.isOptional ? "· Opt." : a.durationHours ? `· ${a.durationHours}h` : ""}</span></Link>)}
                              </div>
                            </div>
                          )}
                          {(d.parks || []).length > 0 && (
                            <div className="flex items-start" style={{ gap: 12 }}>
                              <span className="flex-shrink-0 flex justify-center" style={{ width: 26, color: "#274e22" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z" /><circle cx="12" cy="11" r="2.3" /></svg></span>
                              <div className="flex flex-wrap" style={{ gap: 7 }}>
                                {(d.parks || []).map((p, i) => <Link key={i} href={p.parkSlug ? `/parks/${p.parkSlug}` : "#"} className="chip-link inline-flex items-center" style={{ gap: 6, background: "#e6ece2", border: "1px solid rgba(39,78,34,.18)", fontSize: 12.5, fontWeight: 600, color: "#274e22", padding: "6px 12px", borderRadius: 20 }}>{p.parkName}</Link>)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* where you'll stay */}
        {stays.length > 0 && (
          <section style={{ marginTop: "clamp(40px,5vw,60px)" }}>
            <FeaturedCarousel title={t("whereStay")} subtitle={t("whereStaySub", { count: stays.length })} items={stays} renderCard={renderStayCard} />
          </section>
        )}

        {/* included / excluded */}
        {(itin.inclusions?.length || itin.exclusions?.length) ? (
          <section style={{ marginTop: "clamp(40px,5vw,60px)" }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.2vw,32px)", margin: "0 0 18px" }}>{t("included")}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
              {itin.inclusions?.length ? (
                <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 600, color: "#274e22", fontSize: 16, marginBottom: 12 }}>{t("includeTitle")}</div>
                  <div className="flex flex-col" style={{ gap: 9 }}>{itin.inclusions.map((i) => <div key={i} className="flex items-start" style={{ gap: 9, fontSize: 14, color: "#4a3f34", lineHeight: 1.45 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#274e22" strokeWidth={2.4} style={{ flexShrink: 0, marginTop: 2 }} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{i}</div>)}</div>
                </div>
              ) : null}
              {itin.exclusions?.length ? (
                <div style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 600, color: "#5a1e03", fontSize: 16, marginBottom: 12 }}>{t("excludeTitle")}</div>
                  <div className="flex flex-col" style={{ gap: 9 }}>{itin.exclusions.map((e) => <div key={e} className="flex items-start" style={{ gap: 9, fontSize: 14, color: "#7a6f61", lineHeight: 1.45 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7a6f61" strokeWidth={2.4} style={{ flexShrink: 0, marginTop: 2 }} strokeLinecap="round"><path d="M5 12h14" /></svg>{e}</div>)}</div>
                </div>
              ) : null}
            </div>
            <p style={{ color: "#7a6f61", fontSize: 13, lineHeight: 1.55, margin: "14px 0 0" }}>{t("includeNote")}</p>
          </section>
        ) : null}

        {/* price & what affects it */}
        <section style={{ marginTop: "clamp(36px,4vw,52px)" }}>
          <div style={{ background: "linear-gradient(160deg,#e6ece2,#f1ece3)", border: "1px solid #e4ddd1", borderRadius: 18, padding: "clamp(24px,4vw,36px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 28, alignItems: "center" }}>
            <div>
              <div style={{ color: "#7a6f61", fontSize: 13, marginBottom: 4 }}>{t("from")}</div>
              <div className="flex items-baseline" style={{ gap: 8, marginBottom: 6 }}><span style={{ fontFamily: SERIF, fontWeight: 700, color: "#96631a", fontSize: "clamp(38px,6vw,54px)", lineHeight: 1 }}>{fromPrice || "—"}</span>{fromPrice && <span style={{ color: "#4a3f34", fontSize: 16, fontWeight: 600 }}>{t("perPerson")}</span>}</div>
              {paxLine && <div style={{ color: "#3e3117", fontSize: 14, marginBottom: 14 }}>{t("basis", { basis: paxLine })}</div>}
              {money(cost?.grandTotalRack) && <div style={{ color: "#7a6f61", fontSize: 13.5, lineHeight: 1.55 }}>{t("priceNote", { total: money(cost?.grandTotalRack)! })}</div>}
            </div>
            <div style={{ justifySelf: "end", width: "100%", maxWidth: 320 }}>
              {costRows.length > 0 && <div className="flex flex-col" style={{ gap: 6, marginBottom: 16 }}>{costRows.map((c) => <div key={c.label} className="flex justify-between" style={{ fontSize: 14, padding: "8px 0", borderBottom: "1px solid rgba(62,49,23,.12)" }}><span style={{ color: "#4a3f34" }}>{c.label}</span><span style={{ fontWeight: 600, color: "#2a2018" }}>{c.value}</span></div>)}</div>}
              <Link href={bookHref} className="flex items-center justify-center gap-2" style={{ background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 16, borderRadius: 8, padding: 15, boxShadow: "0 8px 24px rgba(196,143,43,.4)" }}>{t("tailor")}<Arrow /></Link>
            </div>
          </div>
        </section>

        {/* trust */}
        {(summary || reviews.length > 0) && (
          <section style={{ marginTop: "clamp(40px,5vw,60px)" }}>
            {summary && <div className="flex items-center" style={{ gap: 12, marginBottom: 20 }}><span style={{ fontFamily: SERIF, fontWeight: 700, color: "#00aa6c", fontSize: 26 }}>{summary.rating.toFixed(1)}</span><div><div style={{ color: "#c48f2b", fontSize: 16, letterSpacing: 2 }}>★★★★★</div><div style={{ color: "#7a6f61", fontSize: 12.5 }}>{t("reviewsCount", { count: summary.count })}</div></div></div>}
            {reviews.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18 }}>
                {reviews.slice(0, 2).map((r, i) => <ReviewCard key={i} item={r} height={340} />)}
              </div>
            )}
          </section>
        )}

        {/* FAQ (localized safari FAQ + FAQPage JSON-LD) */}
        <section style={{ marginTop: "clamp(40px,5vw,60px)" }}>
          <ContextualFAQ type="safari" />
        </section>

        {/* similar */}
        {similar.length > 0 && (
          <section style={{ marginTop: "clamp(40px,5vw,60px)" }}>
            <FeaturedCarousel title={t("similar")} items={similar} renderCard={renderSimilarCard} />
          </section>
        )}
      </main>

      {/* final conversion band */}
      <section style={{ position: "relative", background: "#3d1402", color: "#faf8f5", padding: "clamp(56px,8vw,90px) clamp(18px,5vw,56px)", overflow: "hidden", marginTop: "clamp(48px,6vw,80px)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.08, margin: "0 0 14px" }}>{t("bandTitle", { name: itin.name })}</h2>
          <p style={{ color: "rgba(242,236,224,.82)", fontSize: 17, lineHeight: 1.55, margin: "0 0 30px" }}>{t("bandBody")}</p>
          <div className="flex flex-wrap justify-center" style={{ gap: 12, marginBottom: 34 }}>
            <Link href={bookHref} className="inline-flex items-center gap-2 font-semibold" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 16, borderRadius: 8, padding: "16px 30px", boxShadow: "0 10px 28px rgba(196,143,43,.4)" }}>{t("tailor")}<Arrow size={17} /></Link>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold" style={{ background: "rgba(242,236,224,.08)", color: "#fff", border: "1.5px solid rgba(242,236,224,.4)", fontSize: 16, borderRadius: 8, padding: "15px 28px" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.4.5c-.2.2-.3.4-.1.6.5.8 1 1.4 1.7 1.9.5.3.8.4 1 .1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.2.1.6-.1 1.2Z" /></svg>{footer("whatsapp")}</a>
          </div>
          <div className="flex flex-wrap justify-center" style={{ gap: "14px 26px", paddingTop: 26, borderTop: "1px solid rgba(242,236,224,.15)" }}>
            {summary && <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><span style={{ color: "#00aa6c", fontWeight: 700, fontFamily: SERIF, fontSize: 16 }}>{summary.rating.toFixed(1)}</span><span style={{ color: "#c48f2b", letterSpacing: 1 }}>★★★★★</span>Tripadvisor</span>}
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c48f2b" strokeWidth={2}><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6Z" strokeLinejoin="round" /></svg>{pd("accredited")}</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c48f2b" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" /></svg>{pd("replyBadge")}</span>
          </div>
        </div>
      </section>

      {/* mobile sticky booking bar */}
      <div className="mobile-only" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: "#fff", borderTop: "1px solid #e4ddd1", boxShadow: "0 -6px 24px rgba(0,0,0,.1)", padding: "11px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11, color: "#7a6f61" }}>{t("from")}</div><div style={{ fontFamily: SERIF, fontWeight: 700, color: "#96631a", fontSize: 20, lineHeight: 1 }}>{fromPrice || "—"} {fromPrice && <span style={{ color: "#7a6f61", fontSize: 12, fontWeight: 400 }}>pp</span>}</div></div>
        <Link href={bookHref} className="inline-flex items-center gap-2" style={{ flexShrink: 0, background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 15, borderRadius: 8, padding: "13px 22px" }}>{t("tailor")}</Link>
      </div>
      <div className="mobile-only" style={{ height: 70 }} aria-hidden="true" />
    </div>
  );
}
