"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Search, ChevronDown, ArrowRight, ArrowDown, X, Check, MapPin, MessageCircle } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SkeletonCard from "@/components/ui/SkeletonCard";
import FeaturedCarousel from "@/components/ui/FeaturedCarousel";
import { useDebounce } from "@/lib/useDebounce";
import { apiClient } from "@/lib/api";

interface ParkItem {
  slug: string;
  name: string;
  parkType?: string;
  region?: string;
  shortDescription?: string;
  primaryImageUrl?: string;
  tags?: string;
  safariCount?: number;
}

const SERIF = "var(--font-source-serif), Georgia, serif";
const PAGE_SIZE = 9;
const VALID_TYPES = new Set(["NATIONAL_PARK", "GAME_RESERVE", "MARINE_PARK", "CONSERVATION_AREA", "WILDLIFE_RESERVE", "FOREST_RESERVE", "NATURE_RESERVE"]);
const VALID_SORTS = ["visited", "az", "za"];

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

function parseTags(raw?: string): string[] {
  if (!raw) return [];
  const s = raw.trim();
  if (s.startsWith("[")) { try { const a = JSON.parse(s); if (Array.isArray(a)) return a.map((x) => String(x).trim()).filter(Boolean); } catch { /* fall through */ } }
  return s.split(",").map((x) => x.replace(/[[\]"'\\]/g, "").trim()).filter(Boolean);
}

const ONE_LINE: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

const Acacia = ({ w = 200, o = 0.14 }: { w?: number; o?: number }) => (
  <svg aria-hidden="true" viewBox="0 0 240 200" style={{ position: "absolute", right: "-16px", bottom: "12%", width: w, opacity: o, color: "#fff" }}>
    <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
      <path d="M120 200v-92" />
      <path d="M120 112c-26-6-52-24-70-30 16 14 42 28 62 32M120 112c26-6 54-22 72-28-18 14-46 26-66 30" />
      <path d="M44 82c22-16 44-16 76-14 30 2 52-2 76 10-20-16-46-18-76-18-32 0-56 6-76 22Z" />
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

export default function ParksPage() {
  const t = useTranslations("parks");
  const pf = useTranslations("parksFinder");
  const home = useTranslations("home");
  const nav = useTranslations("footer");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── filters (server-driven, initialised from the URL) ──
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const debouncedSearch = useDebounce(search, 400);
  const [parkType, setParkType] = useState(() => { const v = searchParams.get("type"); return v && VALID_TYPES.has(v) ? v : "all"; });
  const [sort, setSort] = useState(() => { const v = searchParams.get("sort"); return v && VALID_SORTS.includes(v) ? v : "visited"; });
  const [activeTags, setActiveTags] = useState<string[]>(() => searchParams.getAll("tag"));
  const [openDD, setOpenDD] = useState<string | null>(null);

  // Reflect filters/search into the URL (shareable, back-button friendly).
  useEffect(() => {
    const q: Record<string, string | string[]> = {};
    if (debouncedSearch) q.q = debouncedSearch;
    if (parkType !== "all") q.type = parkType;
    if (sort !== "visited") q.sort = sort;
    if (activeTags.length) q.tag = activeTags;
    router.replace({ pathname, query: q }, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, parkType, sort, activeTags]);

  const [items, setItems] = useState<ParkItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // carousel + facet source (static: fetched once)
  const [featured, setFeatured] = useState<ParkItem[]>([]);
  const [facetTags, setFacetTags] = useState<string[]>([]);

  const anyFilter = !!debouncedSearch || parkType !== "all" || activeTags.length > 0;

  const buildParams = useCallback((pg: number) => {
    const p = new URLSearchParams();
    p.set("page", String(pg));
    p.set("size", String(PAGE_SIZE));
    if (sort === "az") { p.set("sortBy", "name"); p.set("sortDirection", "asc"); }
    else if (sort === "za") { p.set("sortBy", "name"); p.set("sortDirection", "desc"); }
    else { p.set("sortBy", "visited"); }
    if (debouncedSearch) p.set("keyword", debouncedSearch);
    if (parkType !== "all") p.set("parkType", parkType);
    activeTags.forEach((tg) => p.append("tag", tg));
    return p;
  }, [sort, debouncedSearch, parkType, activeTags]);

  // main (server-side filter/sort/paginate)
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPage(0);
    apiClient
      .get(`/public/parks?${buildParams(0)}`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (!alive) return; const d = res.data?.data; setItems(d?.parks || d || []); setTotalItems(d?.totalItems || 0); })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [buildParams, locale]);

  const hasMore = items.length < totalItems;
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await apiClient.get(`/public/parks?${buildParams(next)}`, { headers: { "Accept-Language": locale } });
      const d = res.data?.data;
      const more: ParkItem[] = d?.parks || d || [];
      setItems((prev) => { const seen = new Set(prev.map((p) => p.slug)); return [...prev, ...more.filter((p) => !seen.has(p.slug))]; });
      setPage(next);
    } catch { /* ignore */ } finally { setLoadingMore(false); }
  };

  // most-visited carousel + tag facets (once per locale)
  useEffect(() => {
    let alive = true;
    apiClient
      .get(`/public/parks?page=0&size=60&sortBy=visited`, { headers: { "Accept-Language": locale } })
      .then((res) => {
        if (!alive) return;
        const d = res.data?.data;
        const all: ParkItem[] = d?.parks || d || [];
        setFeatured(all.filter((p) => (p.safariCount ?? 0) > 0).slice(0, 6));
        const freq: Record<string, number> = {};
        all.forEach((p) => parseTags(p.tags).forEach((tg) => { freq[tg] = (freq[tg] || 0) + 1; }));
        setFacetTags(Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 6));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [locale]);

  const toggleTag = (tg: string) => setActiveTags((prev) => (prev.includes(tg) ? prev.filter((x) => x !== tg) : [...prev, tg]));
  const clearAll = () => { setSearch(""); setParkType("all"); setActiveTags([]); };

  const typeLabel = (tp: string) => pf(`type.${tp}`);
  const presentTypes = useMemo(() => {
    const set = new Set<string>();
    [...featured, ...items].forEach((p) => p.parkType && set.add(p.parkType));
    const order = ["NATIONAL_PARK", "GAME_RESERVE", "MARINE_PARK", "CONSERVATION_AREA", "WILDLIFE_RESERVE", "FOREST_RESERVE", "NATURE_RESERVE"];
    return order.filter((o) => set.has(o));
  }, [featured, items]);
  const typeDropOpts: Opt[] = [{ value: "all", label: pf("allTypes") }, ...presentTypes.map((tp) => ({ value: tp, label: typeLabel(tp) }))];
  const sortOpts: Opt[] = [
    { value: "visited", label: pf("sortVisited") },
    { value: "az", label: pf("sortAz") },
    { value: "za", label: pf("sortZa") },
  ];

  const chips: { label: string; remove: () => void }[] = [];
  if (parkType !== "all") chips.push({ label: typeLabel(parkType), remove: () => setParkType("all") });
  if (debouncedSearch) chips.push({ label: `“${debouncedSearch}”`, remove: () => setSearch("") });
  activeTags.forEach((tg) => chips.push({ label: tg, remove: () => toggleTag(tg) }));

  // tall card for the featured "most visited" carousel
  const renderParkCard = (p: ParkItem) => {
    const img = p.primaryImageUrl;
    const bg = img ? `50% 45%/cover no-repeat url('${img}')` : gradFor(p.slug);
    return (
      <article className="group relative" style={{ height: 300, borderRadius: 20, overflow: "hidden", background: bg }}>
        <Link href={`/parks/${p.slug}`} aria-label={p.name} className="absolute inset-0 z-[5]" />
        {!img && <Acacia w={200} o={0.14} />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 30%,rgba(20,12,4,.55) 62%,rgba(20,12,4,.92) 100%)" }} />
        {typeof p.safariCount === "number" && p.safariCount > 0 && (
          <div className="absolute" style={{ top: 14, right: 14, background: "#3d1402", color: "#f3e6c8", fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 20 }}>{pf("safariStat", { count: p.safariCount })}</div>
        )}
        <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between" style={{ padding: 24, gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            {p.region && <div style={{ color: "#f3e6c8", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6, ...ONE_LINE }}>{p.region}</div>}
            <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: 22, lineHeight: 1.14, margin: 0, textShadow: "0 1px 12px rgba(20,12,4,.5)", ...ONE_LINE }}>{p.name}</h3>
          </div>
          <span className="flex items-center justify-center bg-white text-[#2a2018] group-hover:bg-brand-green group-hover:text-white transition-colors" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%" }}><ArrowRight size={17} strokeWidth={2.4} /></span>
        </div>
      </article>
    );
  };

  const faqs = [1, 2, 3].map((n) => ({ q: pf(`faqQ${n}`), a: pf(`faqA${n}`) }));

  return (
    <>
      <PageHero heroPage="DESTINATIONS" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      {/* ===== Sticky finder bar (server-driven) ===== */}
      <div className="sticky top-20 z-30" style={{ background: "rgba(250,248,245,.9)", backdropFilter: "blur(12px)", borderTop: "1px solid #e4ddd1", borderBottom: "1px solid #e4ddd1", padding: "10px clamp(16px,5vw,56px)" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div className="flex items-stretch gap-2 flex-wrap">
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180, display: "flex", alignItems: "center" }}>
              <Search size={17} strokeWidth={2} style={{ position: "absolute", left: 14, color: "#7a6f61", pointerEvents: "none" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={pf("searchPlaceholder")}
                style={{ width: "100%", border: "1.5px solid #e4ddd1", background: "#fff", borderRadius: 9, padding: "12px 14px 12px 40px", fontSize: 14.5, color: "#2a2018", outline: "none" }} />
            </div>
            <Dropdown ariaLabel={pf("parkTypeAria")} label={parkType === "all" ? pf("allTypes") : typeLabel(parkType)} active={parkType !== "all"} open={openDD === "type"} onToggle={() => setOpenDD(openDD === "type" ? null : "type")} onClose={() => setOpenDD(null)} value={parkType} onPick={setParkType} options={typeDropOpts} />
            <Dropdown ariaLabel={pf("sortAria")} label={sortOpts.find((o) => o.value === sort)!.label} active={false} open={openDD === "sort"} onToggle={() => setOpenDD(openDD === "sort" ? null : "sort")} onClose={() => setOpenDD(null)} value={sort} onPick={setSort} options={sortOpts} />
          </div>
          <div className="flex items-center flex-wrap gap-2" style={{ marginTop: 10, minHeight: 24 }}>
            <span style={{ fontSize: 13, color: "#7a6f61", marginRight: 2 }}>{loading ? "…" : totalItems === 0 ? pf("noParks") : pf("resultCount", { count: totalItems })}</span>
            {chips.map((c) => (
              <button key={c.label} onClick={c.remove} className="inline-flex items-center cursor-pointer" style={{ gap: 6, background: "#e6ece2", color: "#274e22", border: "1px solid rgba(39,78,34,.18)", fontSize: 12.5, fontWeight: 600, padding: "5px 9px 5px 11px", borderRadius: 20 }}>
                {c.label}<X size={12} strokeWidth={2.6} />
              </button>
            ))}
            {anyFilter && <button onClick={clearAll} style={{ background: "none", border: "none", color: "#96631a", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>{pf("clear")}</button>}
            <div style={{ flex: 1 }} />
            {facetTags.length > 0 && (
              <div className="flex flex-wrap" style={{ gap: 6 }}>
                {facetTags.map((tg) => {
                  const on = activeTags.includes(tg);
                  return (
                    <button key={tg} onClick={() => toggleTag(tg)} aria-pressed={on} className="cursor-pointer" style={{ background: on ? "#f3e6c8" : "transparent", color: on ? "#96631a" : "#7a6f61", border: `1.5px solid ${on ? "#c48f2b" : "#e4ddd1"}`, fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 20 }}>{tg}</button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1220, margin: "0 auto", padding: "clamp(28px,4vw,44px) clamp(16px,5vw,56px) 0" }}>
        {/* ===== Most visited parks (carousel, unfiltered) ===== */}
        {!anyFilter && featured.length > 0 && (
          <div style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
            <FeaturedCarousel title={pf("mostVisited")} subtitle={pf("mostVisitedSub")} items={featured} renderCard={renderParkCard} prevLabel={pf("prev")} nextLabel={pf("next")} />
          </div>
        )}
        {/* ===== All parks heading (unfiltered) ===== */}
        {!anyFilter && !loading && items.length > 0 && (
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(20px,2.6vw,26px)", margin: "0 0 18px" }}>{pf("allParks")}</h2>
        )}

        {loading ? (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "clamp(18px,2.4vw,28px)" }}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} variant="park" />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "clamp(40px,7vw,72px) 20px", background: "#fff", border: "1px solid #e4ddd1", borderRadius: 18 }}>
            <div className="mx-auto flex items-center justify-center" style={{ width: 60, height: 60, borderRadius: 16, background: "#e6ece2", marginBottom: 20, color: "#274e22" }}><Search size={28} strokeWidth={1.7} /></div>
            <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 26, margin: "0 0 10px" }}>{pf("emptyTitle")}</h3>
            <p style={{ color: "#7a6f61", fontSize: 16, lineHeight: 1.55, maxWidth: 420, margin: "0 auto 24px" }}>{pf("emptyBody")}</p>
            <div className="flex flex-wrap gap-2.5 justify-center">
              <Link href="/plan" className="rounded-lg font-semibold" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 15, padding: "13px 26px" }}>{home("ctaCta")}</Link>
              <button onClick={clearAll} className="rounded-lg font-semibold cursor-pointer" style={{ background: "none", border: "1.5px solid #e4ddd1", color: "#5a1e03", fontSize: 15, padding: "12px 24px" }}>{pf("clearFilters")}</button>
            </div>
          </div>
        ) : (
          <section aria-label={pf("allParks")}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "clamp(18px,2.4vw,28px)" }}>
              {items.map((p) => {
                const img = p.primaryImageUrl;
                const bg = img ? `50% 45%/cover no-repeat url('${img}')` : gradFor(p.slug);
                return (
                  <article key={p.slug} className="pcard group relative flex flex-col" style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 16, overflow: "hidden" }}>
                    <Link href={`/parks/${p.slug}`} aria-label={p.name} className="absolute inset-0 z-[5]" />
                    <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 11", background: bg }}>
                      {!img && <Acacia w={170} o={0.15} />}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 46%,rgba(20,12,4,.8))" }} />
                      <div className="absolute left-0 bottom-0" style={{ right: 52, padding: 16 }}>
                        {p.region && <div className="flex items-center gap-1.5" style={{ color: "#f3e6c8", fontSize: 12, fontWeight: 600, marginBottom: 4 }}><MapPin size={12} strokeWidth={2} style={{ flexShrink: 0 }} /><span style={ONE_LINE}>{p.region}</span></div>}
                        <h3 style={{ fontFamily: SERIF, fontWeight: 600, color: "#fff", fontSize: 20, lineHeight: 1.14, margin: 0, textShadow: "0 1px 12px rgba(20,12,4,.5)", ...ONE_LINE }}>{p.name}</h3>
                      </div>
                      <span className="absolute flex items-center justify-center bg-white text-[#2a2018] group-hover:bg-brand-green group-hover:text-white transition-colors" style={{ bottom: 14, right: 14, width: 38, height: 38, borderRadius: "50%" }}><ArrowRight size={16} strokeWidth={2.4} /></span>
                    </div>
                  </article>
                );
              })}
            </div>
            {hasMore && (
              <div className="flex justify-center" style={{ marginTop: "clamp(30px,4vw,44px)" }}>
                <button onClick={loadMore} disabled={loadingMore} className="inline-flex items-center gap-2 cursor-pointer transition-colors hover:bg-brand-green hover:text-brand-cream disabled:opacity-60" style={{ background: "none", color: "#274e22", fontWeight: 600, fontSize: 15, border: "1.5px solid #274e22", borderRadius: 8, padding: "14px 30px" }}>{loadingMore ? "…" : pf("showMore")}<ArrowDown size={16} strokeWidth={2.2} /></button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ===== Conversion band + FAQ ===== */}
      <section style={{ position: "relative", background: "#3d1402", color: "#faf8f5", padding: "clamp(56px,8vw,96px) clamp(16px,5vw,56px)", overflow: "hidden", marginTop: "clamp(48px,7vw,80px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(28px,4.4vw,46px)", lineHeight: 1.07, margin: "0 0 14px" }}>{pf("bandTitle")}</h2>
          <p style={{ color: "rgba(242,236,224,.82)", fontSize: 17, lineHeight: 1.55, margin: "0 0 30px" }}>{pf("bandBody")}</p>
          <div className="flex flex-wrap gap-3 justify-center" style={{ marginBottom: 34 }}>
            <Link href="/plan" className="inline-flex items-center gap-2 font-semibold rounded-lg" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 16, padding: "16px 30px", boxShadow: "0 10px 28px rgba(196,143,43,.4)" }}>{home("ctaCta")}<ArrowRight size={17} strokeWidth={2.3} /></Link>
            <a href="https://wa.me/255786345408" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold rounded-lg" style={{ background: "rgba(242,236,224,.08)", color: "#fff", border: "1.5px solid rgba(242,236,224,.4)", fontSize: 16, padding: "15px 28px" }}><MessageCircle size={18} strokeWidth={2.2} />{nav("whatsapp")}</a>
          </div>
          <div className="flex flex-wrap justify-center" style={{ gap: "14px 26px", paddingTop: 26, borderTop: "1px solid rgba(242,236,224,.15)" }}>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><span style={{ color: "#00aa6c", fontWeight: 700, fontFamily: SERIF, fontSize: 16 }}>5.0</span><span style={{ color: "#c48f2b", letterSpacing: 1 }}>★★★★★</span>Tripadvisor</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><Check size={15} strokeWidth={2.4} style={{ color: "#c48f2b" }} />TATO / TALA</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "rgba(242,236,224,.85)" }}><Check size={15} strokeWidth={2.4} style={{ color: "#c48f2b" }} />{pf("trustReply")}</span>
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
