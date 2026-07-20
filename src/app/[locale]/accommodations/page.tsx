"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Search, ChevronDown, ArrowRight, ArrowDown, X, Check, MapPin, Compass, MessageCircle } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SkeletonCard from "@/components/ui/SkeletonCard";
import FeaturedCarousel from "@/components/ui/FeaturedCarousel";
import { useDebounce } from "@/lib/useDebounce";
import { apiClient } from "@/lib/api";

interface StayItem {
  slug: string;
  name: string;
  accommodationType?: string;
  category?: string;
  region?: string;
  priceRange?: string;
  primaryImageUrl?: string;
  safariCount?: number; // distinct active itineraries that stay here — powers "guest favourites"
}

const SERIF = "var(--font-source-serif), Georgia, serif";
const PAGE_SIZE = 9;
const TYPE_ORDER = ["LODGE", "TENTED_CAMP", "MOBILE_CAMP", "RESORT", "HOTEL", "BOUTIQUE_HOTEL", "ECO_LODGE", "VILLA", "COTTAGE", "GUESTHOUSE", "CAMPSITE", "BANDA", "TREE_HOUSE", "APARTMENT", "HOSTEL", "OTHER"];
const CAT_ORDER = ["ULTRA_LUXURY", "LUXURY", "PREMIUM", "MID_RANGE", "BUDGET", "BACKPACKER"];
const VALID_TYPES = new Set(TYPE_ORDER);
const VALID_CATS = new Set(CAT_ORDER);
const VALID_SORTS = ["popular", "az", "za"];

const GRADIENTS = [
  "linear-gradient(150deg,#5a7a3a,#274e22)",
  "linear-gradient(150deg,#8a6a2a,#5a3410)",
  "linear-gradient(150deg,#c9962f,#7a2f14)",
  "linear-gradient(150deg,#3a8a7a,#134a42)",
  "linear-gradient(150deg,#9aa06a,#4a5a2a)",
  "linear-gradient(150deg,#8a5a2a,#3e1502)",
];
const hashStr = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const gradFor = (slug: string) => GRADIENTS[hashStr(slug) % GRADIENTS.length];
const ONE_LINE: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

/** Lodge/tent roofline motif for branded placeholders. */
const Lodge = ({ w = 200, o = 0.14 }: { w?: number; o?: number }) => (
  <svg aria-hidden="true" viewBox="0 0 240 160" style={{ position: "absolute", right: "-16px", bottom: "10%", width: w, opacity: o, color: "#fff" }}>
    <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 150v-46l60-40 60 40v46" />
      <path d="M18 108 90 58l72 50" />
    </g>
  </svg>
);

interface Opt { value: string; label: string }
function Dropdown({ label, active, open, onToggle, onClose, options, value, onPick, ariaLabel }: {
  label: string; active: boolean; open: boolean; onToggle: () => void; onClose: () => void;
  options: Opt[]; value: string; onPick: (v: string) => void; ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);
  return (
    <div ref={ref} style={{ position: "relative", flex: "0 1 auto" }}>
      <button type="button" onClick={onToggle} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}
        className="flex items-center gap-2.5 rounded-lg text-sm whitespace-nowrap cursor-pointer transition-colors"
        style={{ border: `1.5px solid ${active || open ? "#c48f2b" : "#e4ddd1"}`, background: active ? "#f3e6c8" : "#fff", color: active ? "#96631a" : "#2a2018", fontWeight: active ? 600 : 500, padding: "12px 14px", boxShadow: open ? "0 0 0 3px #f3e6c8" : "none" }}>
        {label}
        <ChevronDown size={15} strokeWidth={2} style={{ color: active || open ? "#96631a" : "#7a6f61", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && (
        <div role="listbox" aria-label={ariaLabel} style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 200, background: "#fff", border: "1px solid #e4ddd1", borderRadius: 11, boxShadow: "0 16px 44px rgba(62,21,2,.2)", padding: 6, zIndex: 111, maxHeight: 300, overflow: "auto" }}>
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
      )}
    </div>
  );
}

export default function AccommodationsPage() {
  const t = useTranslations("accommodations");
  const af = useTranslations("accommodationsFinder");
  const home = useTranslations("home");
  const nav = useTranslations("footer");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const debouncedSearch = useDebounce(search, 400);
  const [type, setType] = useState(() => { const v = searchParams.get("type"); return v && VALID_TYPES.has(v) ? v : "all"; });
  const [category, setCategory] = useState(() => { const v = searchParams.get("category"); return v && VALID_CATS.has(v) ? v : "all"; });
  const [sort, setSort] = useState(() => { const v = searchParams.get("sort"); return v && VALID_SORTS.includes(v) ? v : "popular"; });
  const [openDD, setOpenDD] = useState<string | null>(null);

  const [items, setItems] = useState<StayItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [all, setAll] = useState<StayItem[]>([]); // static: guest-favourites carousel + facet options

  const anyFilter = !!debouncedSearch || type !== "all" || category !== "all";

  // reflect filters into URL
  useEffect(() => {
    const q: Record<string, string> = {};
    if (debouncedSearch) q.q = debouncedSearch;
    if (type !== "all") q.type = type;
    if (category !== "all") q.category = category;
    if (sort !== "popular") q.sort = sort;
    router.replace({ pathname, query: q }, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, type, category, sort]);

  const buildParams = useCallback((pg: number) => {
    const p = new URLSearchParams();
    p.set("page", String(pg));
    p.set("size", String(PAGE_SIZE));
    if (sort === "az") { p.set("sortBy", "name"); p.set("sortDirection", "asc"); }
    else if (sort === "za") { p.set("sortBy", "name"); p.set("sortDirection", "desc"); }
    else { p.set("sortBy", "visited"); p.set("sortDirection", "desc"); } // popularity from itinerary-day-accommodation
    if (debouncedSearch) p.set("keyword", debouncedSearch);
    if (type !== "all") p.set("type", type);
    if (category !== "all") p.set("category", category);
    return p;
  }, [sort, debouncedSearch, type, category]);

  // main grid (server-driven)
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPage(0);
    apiClient
      .get(`/public/accommodations?${buildParams(0)}`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (!alive) return; const d = res.data?.data; setItems(d?.accommodations || d || []); setTotalItems(d?.totalItems || 0); })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [buildParams, locale]);

  const hasMore = items.length < totalItems;
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await apiClient.get(`/public/accommodations?${buildParams(next)}`, { headers: { "Accept-Language": locale } });
      const d = res.data?.data;
      const more: StayItem[] = d?.accommodations || d || [];
      setItems((prev) => { const seen = new Set(prev.map((a) => a.slug)); return [...prev, ...more.filter((a) => !seen.has(a.slug))]; });
      setPage(next);
    } catch { /* ignore */ } finally { setLoadingMore(false); }
  };

  // guest-favourites carousel + facet source (once) — ranked by popularity (safariCount)
  useEffect(() => {
    let alive = true;
    apiClient
      .get(`/public/accommodations?page=0&size=60&sortBy=visited&sortDirection=desc`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive) { const d = res.data?.data; setAll(d?.accommodations || d || []); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [locale]);

  // most-booked stays for the featured strip (only those that actually appear in itineraries)
  const popular = useMemo(
    () => all.filter((a) => (a.safariCount ?? 0) > 0).slice(0, 8),
    [all]
  );
  const presentTypes = useMemo(() => TYPE_ORDER.filter((tp) => all.some((a) => a.accommodationType === tp) || items.some((a) => a.accommodationType === tp)), [all, items]);
  const presentCats = useMemo(() => CAT_ORDER.filter((c) => all.some((a) => a.category === c) || items.some((a) => a.category === c)), [all, items]);

  const typeLabel = (v: string) => af(`type.${v}`);
  const catLabel = (v: string) => af(`category.${v}`);
  const typeOpts: Opt[] = [{ value: "all", label: af("allTypes") }, ...presentTypes.map((v) => ({ value: v, label: typeLabel(v) }))];
  const catOpts: Opt[] = [{ value: "all", label: af("allCategories") }, ...presentCats.map((v) => ({ value: v, label: catLabel(v) }))];
  const sortOpts: Opt[] = [
    { value: "popular", label: af("sortPopular") },
    { value: "az", label: af("sortAz") },
    { value: "za", label: af("sortZa") },
  ];

  const chips: { label: string; remove: () => void }[] = [];
  if (type !== "all") chips.push({ label: typeLabel(type), remove: () => setType("all") });
  if (category !== "all") chips.push({ label: catLabel(category), remove: () => setCategory("all") });
  if (debouncedSearch) chips.push({ label: `“${debouncedSearch}”`, remove: () => setSearch("") });
  const clearAll = () => { setSearch(""); setType("all"); setCategory("all"); };

  // tall card for the guest-favourites carousel
  const renderFavouriteCard = (a: StayItem) => {
    const img = a.primaryImageUrl;
    const bg = img ? `50% 45%/cover no-repeat url('${img}')` : gradFor(a.slug);
    const kicker = [a.region, a.accommodationType ? typeLabel(a.accommodationType) : null].filter(Boolean).join(" · ");
    const n = a.safariCount ?? 0;
    return (
      <article className="group relative" style={{ height: 300, borderRadius: 20, overflow: "hidden", background: bg }}>
        <Link href={`/accommodations/${a.slug}`} aria-label={a.name} className="absolute inset-0 z-[5]" />
        {!img && <Lodge w={200} o={0.13} />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 30%,rgba(20,12,4,.55) 62%,rgba(20,12,4,.92) 100%)" }} />
        {n > 0 && (
          <div className="absolute inline-flex items-center" style={{ top: 14, right: 14, gap: 5, background: "#3d1402", color: "#f3e6c8", fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 20 }}><Compass size={11} strokeWidth={2.4} />{af("safariStat", { count: n })}</div>
        )}
        <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between" style={{ padding: 22, gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            {kicker && <div style={{ color: "#f3e6c8", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6, ...ONE_LINE }}>{kicker}</div>}
            <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: 21, lineHeight: 1.14, margin: 0, textShadow: "0 1px 12px rgba(20,12,4,.5)", ...ONE_LINE }}>{a.name}</h3>
          </div>
          <span className="flex items-center justify-center bg-white text-[#2a2018] group-hover:bg-brand-green group-hover:text-white transition-colors" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%" }}><ArrowRight size={17} strokeWidth={2.4} /></span>
        </div>
      </article>
    );
  };

  const faqs = [1, 2, 3].map((n) => ({ q: af(`faqQ${n}`), a: af(`faqA${n}`) }));

  return (
    <>
      <PageHero heroPage="ACCOMMODATIONS" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      {/* ===== Sticky finder bar (server-driven) ===== */}
      <div className="sticky top-20 z-30" style={{ background: "rgba(250,248,245,.9)", backdropFilter: "blur(12px)", borderTop: "1px solid #e4ddd1", borderBottom: "1px solid #e4ddd1", padding: "10px clamp(16px,5vw,56px)" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div className="flex items-stretch gap-2 flex-wrap">
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180, display: "flex", alignItems: "center" }}>
              <Search size={17} strokeWidth={2} style={{ position: "absolute", left: 14, color: "#7a6f61", pointerEvents: "none" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={af("searchPlaceholder")}
                style={{ width: "100%", border: "1.5px solid #e4ddd1", background: "#fff", borderRadius: 9, padding: "12px 14px 12px 40px", fontSize: 14.5, color: "#2a2018", outline: "none" }} />
            </div>
            <Dropdown ariaLabel={af("typeAria")} label={type === "all" ? af("allTypes") : typeLabel(type)} active={type !== "all"} open={openDD === "type"} onToggle={() => setOpenDD(openDD === "type" ? null : "type")} onClose={() => setOpenDD(null)} value={type} onPick={setType} options={typeOpts} />
            <Dropdown ariaLabel={af("categoryAria")} label={category === "all" ? af("allCategories") : catLabel(category)} active={category !== "all"} open={openDD === "cat"} onToggle={() => setOpenDD(openDD === "cat" ? null : "cat")} onClose={() => setOpenDD(null)} value={category} onPick={setCategory} options={catOpts} />
            <Dropdown ariaLabel={af("sortAria")} label={sortOpts.find((o) => o.value === sort)!.label} active={false} open={openDD === "sort"} onToggle={() => setOpenDD(openDD === "sort" ? null : "sort")} onClose={() => setOpenDD(null)} value={sort} onPick={setSort} options={sortOpts} />
          </div>
          <div className="flex items-center flex-wrap gap-2" style={{ marginTop: 10, minHeight: 24 }}>
            <span style={{ fontSize: 13, color: "#7a6f61", marginRight: 2 }}>{loading ? "…" : totalItems === 0 ? af("noStays") : af("resultCount", { count: totalItems })}</span>
            {chips.map((c) => (
              <button key={c.label} onClick={c.remove} className="inline-flex items-center cursor-pointer" style={{ gap: 6, background: "#e6ece2", color: "#274e22", border: "1px solid rgba(39,78,34,.18)", fontSize: 12.5, fontWeight: 600, padding: "5px 9px 5px 11px", borderRadius: 20 }}>
                {c.label}<X size={12} strokeWidth={2.6} />
              </button>
            ))}
            {anyFilter && <button onClick={clearAll} style={{ background: "none", border: "none", color: "#96631a", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>{af("clear")}</button>}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1220, margin: "0 auto", padding: "clamp(28px,4vw,44px) clamp(16px,5vw,56px) 0" }}>
        {/* ===== Guest favourites (carousel, unfiltered) — most-booked stays ===== */}
        {!anyFilter && popular.length > 0 && (
          <div style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
            <FeaturedCarousel title={af("guestFavourites")} subtitle={af("guestFavouritesSub")} items={popular} renderCard={renderFavouriteCard} prevLabel={af("prev")} nextLabel={af("next")} />
          </div>
        )}
        {/* ===== All stays heading (unfiltered) ===== */}
        {!anyFilter && !loading && items.length > 0 && (
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(20px,2.6vw,26px)", margin: "0 0 18px" }}>{af("allStays")}</h2>
        )}

        {loading ? (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "clamp(18px,2.4vw,28px)" }}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} variant="park" />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "clamp(40px,7vw,72px) 20px", background: "#fff", border: "1px solid #e4ddd1", borderRadius: 18 }}>
            <div className="mx-auto flex items-center justify-center" style={{ width: 60, height: 60, borderRadius: 16, background: "#e6ece2", marginBottom: 20, color: "#274e22" }}><Search size={28} strokeWidth={1.7} /></div>
            <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 26, margin: "0 0 10px" }}>{af("emptyTitle")}</h3>
            <p style={{ color: "#7a6f61", fontSize: 16, lineHeight: 1.55, maxWidth: 420, margin: "0 auto 24px" }}>{af("emptyBody")}</p>
            <div className="flex flex-wrap gap-2.5 justify-center">
              <Link href="/plan" className="rounded-lg font-semibold" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 15, padding: "13px 26px" }}>{home("ctaCta")}</Link>
              <button onClick={clearAll} className="rounded-lg font-semibold cursor-pointer" style={{ background: "none", border: "1.5px solid #e4ddd1", color: "#5a1e03", fontSize: 15, padding: "12px 24px" }}>{af("clearFilters")}</button>
            </div>
          </div>
        ) : (
          <section aria-label={af("allStays")}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "clamp(18px,2.4vw,28px)" }}>
              {items.map((a) => {
                const img = a.primaryImageUrl;
                const bg = img ? `50% 45%/cover no-repeat url('${img}')` : gradFor(a.slug);
                return (
                  <article key={a.slug} className="group relative flex flex-col" style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 16, overflow: "hidden" }}>
                    <Link href={`/accommodations/${a.slug}`} aria-label={a.name} className="absolute inset-0 z-[5]" />
                    <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 11", background: bg }}>
                      {!img && <Lodge w={180} o={0.14} />}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 44%,rgba(20,12,4,.82))" }} />
                      {a.accommodationType && <span className="absolute" style={{ top: 14, left: 14, background: "rgba(250,248,245,.94)", color: "#5a1e03", fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 5 }}>{typeLabel(a.accommodationType)}</span>}
                      <div className="absolute left-0 bottom-0" style={{ right: 52, padding: 16 }}>
                        {a.region && <div className="flex items-center gap-1.5" style={{ color: "#f3e6c8", fontSize: 12, fontWeight: 600, marginBottom: 5 }}><MapPin size={12} strokeWidth={2} style={{ flexShrink: 0 }} /><span style={ONE_LINE}>{a.region}</span></div>}
                        <h3 style={{ fontFamily: SERIF, fontWeight: 600, color: "#fff", fontSize: 20, lineHeight: 1.14, margin: 0, textShadow: "0 1px 12px rgba(20,12,4,.5)", ...ONE_LINE }}>{a.name}</h3>
                      </div>
                      <span className="absolute flex items-center justify-center bg-white text-[#2a2018] group-hover:bg-brand-green group-hover:text-white transition-colors" style={{ bottom: 14, right: 14, width: 38, height: 38, borderRadius: "50%" }}><ArrowRight size={16} strokeWidth={2.4} /></span>
                    </div>
                  </article>
                );
              })}
            </div>
            {hasMore && (
              <div className="flex justify-center" style={{ marginTop: "clamp(30px,4vw,44px)" }}>
                <button onClick={loadMore} disabled={loadingMore} className="inline-flex items-center gap-2 cursor-pointer transition-colors hover:bg-brand-green hover:text-brand-cream disabled:opacity-60" style={{ background: "none", color: "#274e22", fontWeight: 600, fontSize: 15, border: "1.5px solid #274e22", borderRadius: 8, padding: "14px 30px" }}>{loadingMore ? "…" : af("showMore")}<ArrowDown size={16} strokeWidth={2.2} /></button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ===== Conversion band + FAQ ===== */}
      <section style={{ position: "relative", background: "#3d1402", color: "#faf8f5", padding: "clamp(56px,8vw,96px) clamp(16px,5vw,56px)", overflow: "hidden", marginTop: "clamp(48px,7vw,80px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(28px,4.4vw,46px)", lineHeight: 1.07, margin: "0 0 14px" }}>{af("bandTitle")}</h2>
          <p style={{ color: "rgba(242,236,224,.82)", fontSize: 17, lineHeight: 1.55, margin: "0 0 30px" }}>{af("bandBody")}</p>
          <div className="flex flex-wrap gap-3 justify-center" style={{ marginBottom: 34 }}>
            <Link href="/plan" className="inline-flex items-center gap-2 font-semibold rounded-lg" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 16, padding: "16px 30px", boxShadow: "0 10px 28px rgba(196,143,43,.4)" }}>{home("ctaCta")}<ArrowRight size={17} strokeWidth={2.3} /></Link>
            <a href="https://wa.me/255786345408" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold rounded-lg" style={{ background: "rgba(242,236,224,.08)", color: "#fff", border: "1.5px solid rgba(242,236,224,.4)", fontSize: 16, padding: "15px 28px" }}><MessageCircle size={18} strokeWidth={2.2} />{nav("whatsapp")}</a>
          </div>
          <div className="flex flex-wrap justify-center" style={{ gap: "14px 26px", paddingTop: 26, borderTop: "1px solid rgba(242,236,224,.15)" }}>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><span style={{ color: "#00aa6c", fontWeight: 700, fontFamily: SERIF, fontSize: 16 }}>5.0</span><span style={{ color: "#c48f2b", letterSpacing: 1 }}>★★★★★</span>Tripadvisor</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><Check size={15} strokeWidth={2.4} style={{ color: "#c48f2b" }} />TATO / TALA</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><Check size={15} strokeWidth={2.4} style={{ color: "#c48f2b" }} />{af("trustReply")}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 text-left" style={{ gap: 14, marginTop: 40 }}>
            {faqs.map((item) => (
              <div key={item.q} style={{ background: "rgba(242,236,224,.06)", border: "1px solid rgba(242,236,224,.12)", borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontFamily: SERIF, fontWeight: 600, color: "#fff", fontSize: 15.5, marginBottom: 7 }}>{item.q}</div>
                <p style={{ color: "rgba(242,236,224,.72)", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
