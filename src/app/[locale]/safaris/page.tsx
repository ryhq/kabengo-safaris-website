"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Search, ChevronDown, X, ArrowRight, Check, Star, MessageCircle } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SkeletonCard from "@/components/ui/SkeletonCard";
import SafariCard from "@/components/safari/SafariCard";
import { useDebounce } from "@/lib/useDebounce";
import { apiClient } from "@/lib/api";
import type { Itinerary } from "@/types";

const PAGE_SIZE = 9;
const SERIF = "var(--font-source-serif), Georgia, serif";

/* Brushed/torn organic mask — reused from the homepage "Book your dream safari" section. */
const PHOTO_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cdefs%3E%3Cfilter id='r' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3' seed='14' result='n'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='n' scale='52' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3C/defs%3E%3Cellipse cx='400' cy='300' rx='352' ry='262' fill='white' filter='url(%23r)'/%3E%3C/svg%3E\") center/100% 100% no-repeat";

const DURATIONS = [
  { key: "all", min: undefined, max: undefined },
  { key: "dayTrip", min: 1, max: 1 },
  { key: "short", min: 2, max: 3 },
  { key: "medium", min: 4, max: 6 },
  { key: "week", min: 7, max: 9 },
  { key: "extended", min: 10, max: undefined },
] as const;

const TRIP_TYPES = ["", "PRIVATE", "GROUP", "CUSTOM", "HONEYMOON", "FAMILY", "PHOTOGRAPHY", "ADVENTURE"] as const;
const TRIP_TYPE_LABEL: Record<string, string> = { "": "all", PRIVATE: "private", GROUP: "group", CUSTOM: "custom", HONEYMOON: "honeymoon", FAMILY: "family", PHOTOGRAPHY: "photography", ADVENTURE: "adventure" };
const BUDGETS = ["", "ULTRA_LUXURY", "LUXURY", "MID_RANGE", "BUDGET", "BACKPACKER"] as const;
const BUDGET_LABEL: Record<string, string> = { "": "all", ULTRA_LUXURY: "ultraLuxury", LUXURY: "luxury", MID_RANGE: "midRange", BUDGET: "budget", BACKPACKER: "backpacker" };
const SORTS = [
  { key: "popular", sortBy: "featured", dir: "desc" },
  { key: "priceAsc", sortBy: "price", dir: "asc" },
  { key: "priceDesc", sortBy: "price", dir: "desc" },
  { key: "duration", sortBy: "duration", dir: "asc" },
  { key: "newest", sortBy: "newest", dir: "desc" },
] as const;
const SORT_LABEL_KEY: Record<string, string> = { popular: "sortPopular", priceAsc: "sortPriceAsc", priceDesc: "sortPriceDesc", duration: "sortDuration", newest: "sortNewest" };

interface Opt { value: string; label: string }

function Dropdown({ label, active, open, onToggle, onClose, options, value, onPick, ariaLabel }: {
  label: string; active: boolean; open: boolean; onToggle: () => void; onClose: () => void;
  options: Opt[]; value: string; onPick: (v: string) => void; ariaLabel: string;
}) {
  return (
    <div style={{ position: "relative", flex: "0 1 auto" }}>
      <button type="button" onClick={onToggle} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}
        className="flex items-center gap-2.5 rounded-lg text-sm whitespace-nowrap cursor-pointer transition-colors"
        style={{ border: `1.5px solid ${active || open ? "#c48f2b" : "#e4ddd1"}`, background: active ? "#f3e6c8" : "#fff", color: active ? "#96631a" : "#2a2018", fontWeight: active ? 600 : 500, padding: "12px 14px", boxShadow: open ? "0 0 0 3px #f3e6c8" : "none" }}>
        {label}
        <ChevronDown size={15} strokeWidth={2} style={{ color: active || open ? "#96631a" : "#7a6f61", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && (
        <>
          <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div role="listbox" aria-label={ariaLabel} style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 190, background: "#fff", border: "1px solid #e4ddd1", borderRadius: 11, boxShadow: "0 16px 44px rgba(62,21,2,.2)", padding: 6, zIndex: 41, maxHeight: 300, overflow: "auto" }}>
            {options.map((o) => {
              const sel = o.value === value;
              return (
                <button key={o.value} type="button" role="option" aria-selected={sel} onClick={() => { onPick(o.value); onClose(); }}
                  className="flex items-center justify-between gap-4 w-full text-left rounded-md cursor-pointer"
                  style={{ background: sel ? "#f3e6c8" : "transparent", color: sel ? "#96631a" : "#2a2018", fontWeight: sel ? 600 : 500, border: "none", padding: "10px 12px", fontSize: 14 }}>
                  {o.label}{sel && <Check size={15} style={{ color: "#c48f2b" }} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function SafarisPage() {
  const t = useTranslations("safaris");
  const f = useTranslations("safariFinder");
  const home = useTranslations("home");
  const hiw = useTranslations("howItWorks");
  const nav = useTranslations("footer");
  const locale = useLocale();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [durationKey, setDurationKey] = useState("all");
  const [tripType, setTripType] = useState("");
  const [budget, setBudget] = useState("");
  const [sortKey, setSortKey] = useState("popular");
  const [openDD, setOpenDD] = useState<string | null>(null);

  const [items, setItems] = useState<Itinerary[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [featured, setFeatured] = useState<Itinerary[]>([]);

  const anyFilter = !!debouncedSearch || durationKey !== "all" || !!tripType || !!budget;
  const dur = DURATIONS.find((d) => d.key === durationKey)!;
  const sort = SORTS.find((s) => s.key === sortKey)!;

  const buildParams = (pg: number) => {
    const p = new URLSearchParams();
    p.set("page", String(pg));
    p.set("size", String(PAGE_SIZE));
    p.set("sortBy", sort.sortBy);
    p.set("sortDirection", sort.dir);
    if (debouncedSearch) p.set("keyword", debouncedSearch);
    if (tripType) p.set("tripType", tripType);
    if (budget) p.set("budgetCategory", budget);
    if (dur.min !== undefined) p.set("minDays", String(dur.min));
    if (dur.max !== undefined) p.set("maxDays", String(dur.max));
    return p;
  };

  // main results
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPage(0);
    apiClient
      .get(`/public/safaris?${buildParams(0)}`, { headers: { "Accept-Language": locale } })
      .then((res) => {
        if (!alive) return;
        const data = res.data?.data;
        setItems(data?.safaris || data || []);
        setTotalItems(data?.totalItems || 0);
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, durationKey, tripType, budget, sortKey, locale]);

  // editor's picks (once)
  useEffect(() => {
    let alive = true;
    apiClient
      .get(`/public/safaris?page=0&size=2&featured=true&sortBy=featured&sortDirection=desc`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive) { const d = res.data?.data; setFeatured(d?.safaris || d || []); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [locale]);

  const hasMore = items.length < totalItems;
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await apiClient.get(`/public/safaris?${buildParams(next)}`, { headers: { "Accept-Language": locale } });
      const data = res.data?.data;
      const more: Itinerary[] = data?.safaris || data || [];
      setItems((prev) => {
        const seen = new Set(prev.map((s) => s.code));
        return [...prev, ...more.filter((s) => !seen.has(s.code))];
      });
      setPage(next);
    } finally {
      setLoadingMore(false);
    }
  };

  const clearAll = () => { setSearch(""); setDurationKey("all"); setTripType(""); setBudget(""); };

  const chips = useMemo(() => {
    const c: { label: string; remove: () => void }[] = [];
    if (durationKey !== "all") c.push({ label: t(`filters.durations.${durationKey}`), remove: () => setDurationKey("all") });
    if (tripType) c.push({ label: t(`filters.tripTypes.${TRIP_TYPE_LABEL[tripType]}`), remove: () => setTripType("") });
    if (budget) c.push({ label: t(`filters.budgetCategories.${BUDGET_LABEL[budget]}`), remove: () => setBudget("") });
    if (debouncedSearch) c.push({ label: `“${debouncedSearch}”`, remove: () => setSearch("") });
    return c;
  }, [durationKey, tripType, budget, debouncedSearch, t]);

  const trust = hiw.raw("trust") as string[];
  const faqs = [1, 2, 3, 4].map((n) => ({ q: f(`faqQ${n}`), a: f(`faqA${n}`) }));

  return (
    <>
      <PageHero heroPage="SAFARIS" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      {/* ===== Finder bar (sticky) ===== */}
      <div className="sticky top-20 z-30" style={{ background: "rgba(250,248,245,.9)", backdropFilter: "blur(12px)", borderTop: "1px solid #e4ddd1", borderBottom: "1px solid #e4ddd1", padding: "10px clamp(16px,5vw,56px)" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div className="flex items-stretch gap-2 flex-wrap">
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180, display: "flex", alignItems: "center" }}>
              <Search size={17} strokeWidth={2} style={{ position: "absolute", left: 14, color: "#7a6f61", pointerEvents: "none" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchPlaceholder")}
                style={{ width: "100%", border: "1.5px solid #e4ddd1", background: "#fff", borderRadius: 9, padding: "12px 14px 12px 40px", fontSize: 14.5, color: "#2a2018", outline: "none" }} />
            </div>
            <Dropdown ariaLabel={t("filters.duration")} label={durationKey === "all" ? t("filters.duration") : t(`filters.durations.${durationKey}`)} active={durationKey !== "all"} open={openDD === "d"} onToggle={() => setOpenDD(openDD === "d" ? null : "d")} onClose={() => setOpenDD(null)} value={durationKey} onPick={setDurationKey} options={DURATIONS.map((d) => ({ value: d.key, label: t(`filters.durations.${d.key}`) }))} />
            <Dropdown ariaLabel={t("filters.tripType")} label={tripType ? t(`filters.tripTypes.${TRIP_TYPE_LABEL[tripType]}`) : t("filters.tripType")} active={!!tripType} open={openDD === "t"} onToggle={() => setOpenDD(openDD === "t" ? null : "t")} onClose={() => setOpenDD(null)} value={tripType} onPick={setTripType} options={TRIP_TYPES.map((v) => ({ value: v, label: t(`filters.tripTypes.${TRIP_TYPE_LABEL[v]}`) }))} />
            <Dropdown ariaLabel={t("filters.budget")} label={budget ? t(`filters.budgetCategories.${BUDGET_LABEL[budget]}`) : t("filters.budget")} active={!!budget} open={openDD === "b"} onToggle={() => setOpenDD(openDD === "b" ? null : "b")} onClose={() => setOpenDD(null)} value={budget} onPick={setBudget} options={BUDGETS.map((v) => ({ value: v, label: t(`filters.budgetCategories.${BUDGET_LABEL[v]}`) }))} />
            <Dropdown ariaLabel={f("sortLabel")} label={f(SORT_LABEL_KEY[sortKey])} active={false} open={openDD === "s"} onToggle={() => setOpenDD(openDD === "s" ? null : "s")} onClose={() => setOpenDD(null)} value={sortKey} onPick={setSortKey} options={SORTS.map((s) => ({ value: s.key, label: f(SORT_LABEL_KEY[s.key]) }))} />
          </div>
          <div className="flex items-center flex-wrap gap-2" style={{ marginTop: 10, minHeight: 24 }}>
            <span style={{ fontSize: 13, color: "#7a6f61", marginRight: 2 }}>{loading ? "…" : t("resultCount", { count: totalItems })}</span>
            {chips.map((c) => (
              <button key={c.label} onClick={c.remove} className="inline-flex items-center cursor-pointer" style={{ gap: 6, background: "#e6ece2", color: "#274e22", border: "1px solid rgba(39,78,34,.18)", fontSize: 12.5, fontWeight: 600, padding: "5px 9px 5px 11px", borderRadius: 20 }}>
                {c.label}<X size={12} strokeWidth={2.6} />
              </button>
            ))}
            {anyFilter && (
              <button onClick={clearAll} style={{ background: "none", border: "none", color: "#96631a", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>{t("filters.clear")}</button>
            )}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1220, margin: "0 auto", padding: "clamp(28px,4vw,44px) clamp(16px,5vw,56px) 0" }}>
        {/* ===== Editor's picks (only when browsing unfiltered) ===== */}
        {!anyFilter && featured.length > 0 && (
          <section aria-label={f("featuredHeading")} style={{ marginBottom: "clamp(32px,5vw,48px)" }}>
            <div className="flex items-center gap-2.5" style={{ marginBottom: 16 }}>
              <Star size={17} fill="#c48f2b" stroke="none" />
              <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(20px,2.6vw,26px)", margin: 0 }}>{f("featuredHeading")}</h2>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "clamp(16px,2.2vw,24px)" }}>
              {featured.slice(0, 2).map((item) => (
                <SafariCard key={`feat-${item.code}`} safari={item} />
              ))}
            </div>
          </section>
        )}

        {/* ===== Results ===== */}
        {loading ? (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "clamp(18px,2.4vw,28px)" }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} variant="safari" />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "clamp(40px,7vw,72px) 20px", background: "#fff", border: "1px solid #e4ddd1", borderRadius: 18 }}>
            <div className="mx-auto flex items-center justify-center" style={{ width: 60, height: 60, borderRadius: 16, background: "#e6ece2", marginBottom: 20, color: "#274e22" }}><Search size={28} strokeWidth={1.7} /></div>
            <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 26, margin: "0 0 10px" }}>{f("emptyTitle")}</h3>
            <p style={{ color: "#7a6f61", fontSize: 16, lineHeight: 1.55, maxWidth: 420, margin: "0 auto 24px" }}>{f("emptyBody")}</p>
            <div className="flex flex-wrap gap-2.5 justify-center">
              <Link href="/plan" className="rounded-lg font-semibold" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 15, padding: "13px 26px" }}>{home("ctaCta")}</Link>
              <button onClick={clearAll} className="rounded-lg font-semibold cursor-pointer" style={{ background: "none", border: "1.5px solid #e4ddd1", color: "#5a1e03", fontSize: 15, padding: "12px 24px" }}>{t("filters.clear")}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "clamp(18px,2.4vw,28px)" }}>
              {items.map((item, i) => (
                <motion.div key={item.code} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % PAGE_SIZE) * 0.05, duration: 0.45 }}>
                  <SafariCard safari={item} />
                </motion.div>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center" style={{ marginTop: "clamp(30px,4vw,44px)" }}>
                <button onClick={loadMore} disabled={loadingMore} className="inline-flex items-center gap-2 font-semibold rounded-lg border-[1.5px] border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-cream transition-colors cursor-pointer" style={{ padding: "14px 30px", fontSize: 15, opacity: loadingMore ? 0.6 : 1 }}>
                  {loadingMore ? "…" : f("showMore")}
                  <ArrowRight size={16} strokeWidth={2.2} style={{ transform: "rotate(90deg)" }} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ===== Editorial brushed band ===== */}
      <section style={{ padding: "clamp(56px,8vw,100px) clamp(16px,5vw,56px)" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch" style={{ maxWidth: 1120, margin: "0 auto", background: "#1b3717", borderRadius: 22, overflow: "visible" }}>
          {/* photo cell — brushed shape breaks out beyond the card top & bottom (desktop) */}
          <div style={{ position: "relative", minHeight: 300 }}>
            <style>{`
              .tf-photo{position:absolute;inset:clamp(-12px,-1vw,0px)}
              @media(min-width:768px){.tf-photo{inset:auto;top:clamp(-78px,-6vw,-44px);bottom:clamp(-78px,-6vw,-44px);left:clamp(-60px,-4vw,-28px);right:0}}
            `}</style>
            <div className="tf-photo" style={{ background: "50% 15%/cover no-repeat url('/images/guide-binoculars.jpg')", WebkitMask: PHOTO_MASK, mask: PHOTO_MASK }} role="img" aria-label="A Kabengo Safaris guide spotting wildlife at Ngorongoro" />
          </div>
          {/* copy cell */}
          <div style={{ padding: "clamp(30px,4vw,52px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ color: "#c48f2b", fontSize: 12, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 14 }}>{f("bandEyebrow")}</div>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#faf8f5", fontSize: "clamp(28px,3.6vw,42px)", lineHeight: 1.08, margin: "0 0 16px" }}>{f("bandTitle")}</h2>
            <p style={{ color: "rgba(242,236,224,.85)", fontSize: 16, lineHeight: 1.6, margin: "0 0 8px" }}>{f("bandBody1")}</p>
            <p style={{ color: "rgba(242,236,224,.85)", fontSize: 16, lineHeight: 1.6, margin: "0 0 26px" }}>{f("bandBody2")}</p>
            <div className="flex flex-wrap items-center" style={{ gap: 12, marginBottom: 20 }}>
              <Link href="/plan" className="inline-flex items-center gap-2 font-semibold rounded-lg" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 16, padding: "15px 28px", boxShadow: "0 8px 24px rgba(196,143,43,.35)" }}>{home("ctaCta")}<ArrowRight size={16} strokeWidth={2.3} /></Link>
            </div>
            <div className="flex flex-wrap" style={{ gap: "8px 18px" }}>
              {trust.map((label) => (
                <span key={label} className="inline-flex items-center" style={{ gap: 7, color: "#f3e6c8", fontSize: 13, fontWeight: 500 }}><Check size={14} strokeWidth={2.4} style={{ color: "#c48f2b" }} />{label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Bottom conversion band ===== */}
      <section style={{ position: "relative", background: "#3d1402", color: "#faf8f5", padding: "clamp(56px,8vw,96px) clamp(16px,5vw,56px)", overflow: "hidden" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(28px,4.4vw,46px)", lineHeight: 1.07, margin: "0 0 14px" }}>{f("bottomTitle")}</h2>
          <p style={{ color: "rgba(242,236,224,.82)", fontSize: 17, lineHeight: 1.55, margin: "0 0 30px" }}>{f("bottomSubtitle")}</p>
          <div className="flex flex-wrap gap-3 justify-center" style={{ marginBottom: 34 }}>
            <Link href="/plan" className="inline-flex items-center gap-2 font-semibold rounded-lg" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 16, padding: "16px 30px", boxShadow: "0 10px 28px rgba(196,143,43,.4)" }}>{home("ctaCta")}<ArrowRight size={17} strokeWidth={2.3} /></Link>
            <a href="https://wa.me/255786345408" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold rounded-lg" style={{ background: "rgba(242,236,224,.08)", color: "#fff", border: "1.5px solid rgba(242,236,224,.4)", fontSize: 16, padding: "15px 28px" }}><MessageCircle size={18} strokeWidth={2.2} />{nav("whatsapp")}</a>
          </div>
          <div className="flex flex-wrap justify-center" style={{ gap: "14px 26px", paddingTop: 26, borderTop: "1px solid rgba(242,236,224,.15)" }}>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><span style={{ color: "#00aa6c", fontWeight: 700, fontFamily: SERIF, fontSize: 16 }}>5.0</span><span style={{ color: "#c48f2b", letterSpacing: 1 }}>★★★★★</span>Tripadvisor</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><Check size={15} strokeWidth={2.4} style={{ color: "#c48f2b" }} />TATO / TALA</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><Check size={15} strokeWidth={2.4} style={{ color: "#c48f2b" }} />{trust[2]}</span>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginTop: 40, textAlign: "left" }}>
            {faqs.map((q) => (
              <div key={q.q} style={{ background: "rgba(242,236,224,.06)", border: "1px solid rgba(242,236,224,.12)", borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontFamily: SERIF, fontWeight: 600, color: "#fff", fontSize: 15.5, marginBottom: 7 }}>{q.q}</div>
                <p style={{ color: "rgba(242,236,224,.72)", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{q.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
