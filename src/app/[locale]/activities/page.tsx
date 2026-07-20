"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Search, ChevronDown, ArrowRight, ArrowDown, X, Check, Compass, MessageCircle } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SkeletonCard from "@/components/ui/SkeletonCard";
import FeaturedCarousel from "@/components/ui/FeaturedCarousel";
import { useDebounce } from "@/lib/useDebounce";
import { apiClient } from "@/lib/api";

interface ActivityItem {
  slug: string;
  name: string;
  description?: string;
  primaryImageUrl?: string;
  seasonAvailability?: string;
  safariCount?: number;
}

const SERIF = "var(--font-source-serif), Georgia, serif";
const PAGE_SIZE = 9;
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

/** Hot-air-balloon motif (iconic Serengeti balloon safari) for branded placeholders. */
const Balloon = ({ w = 190, o = 0.14 }: { w?: number; o?: number }) => (
  <svg aria-hidden="true" viewBox="0 0 200 220" style={{ position: "absolute", right: "-14px", bottom: "8%", width: w, opacity: o, color: "#fff" }}>
    <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M100 20c-33 0-60 26-60 60 0 32 30 58 46 74h28c16-16 46-42 46-74 0-34-27-60-60-60Z" />
      <path d="M100 20v134M70 30c-8 22-8 80 12 124M130 30c8 22 8 80-12 124" />
      <path d="M84 158h32l-4 20a6 6 0 0 1-6 5h-6a6 6 0 0 1-6-5Z" />
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

export default function ActivitiesPage() {
  const t = useTranslations("activities");
  const af = useTranslations("activitiesFinder");
  const home = useTranslations("home");
  const nav = useTranslations("footer");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const debouncedSearch = useDebounce(search, 400);
  const [sort, setSort] = useState(() => { const v = searchParams.get("sort"); return v && VALID_SORTS.includes(v) ? v : "popular"; });
  const [openDD, setOpenDD] = useState<string | null>(null);

  const [items, setItems] = useState<ActivityItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [all, setAll] = useState<ActivityItem[]>([]); // static: popular carousel source

  const anyFilter = !!debouncedSearch;

  // reflect filters into the URL (shareable, back-button friendly)
  useEffect(() => {
    const q: Record<string, string> = {};
    if (debouncedSearch) q.q = debouncedSearch;
    if (sort !== "popular") q.sort = sort;
    router.replace({ pathname, query: q }, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sort]);

  const buildParams = useCallback((pg: number) => {
    const p = new URLSearchParams();
    p.set("page", String(pg));
    p.set("size", String(PAGE_SIZE));
    if (sort === "az") { p.set("sortBy", "name"); p.set("sortDirection", "asc"); }
    else if (sort === "za") { p.set("sortBy", "name"); p.set("sortDirection", "desc"); }
    else { p.set("sortBy", "visited"); p.set("sortDirection", "desc"); } // popularity from itinerary-day-activity
    if (debouncedSearch) p.set("keyword", debouncedSearch);
    return p;
  }, [sort, debouncedSearch]);

  // main grid (server-driven)
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPage(0);
    apiClient
      .get(`/public/activities?${buildParams(0)}`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (!alive) return; const d = res.data?.data; setItems(d?.activities || d || []); setTotalItems(d?.totalItems || 0); })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [buildParams, locale]);

  const hasMore = items.length < totalItems;
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await apiClient.get(`/public/activities?${buildParams(next)}`, { headers: { "Accept-Language": locale } });
      const d = res.data?.data;
      const more: ActivityItem[] = d?.activities || d || [];
      setItems((prev) => { const seen = new Set(prev.map((a) => a.slug)); return [...prev, ...more.filter((a) => !seen.has(a.slug))]; });
      setPage(next);
    } catch { /* ignore */ } finally { setLoadingMore(false); }
  };

  // popular carousel source (once) — ranked by popularity (safariCount)
  useEffect(() => {
    let alive = true;
    apiClient
      .get(`/public/activities?page=0&size=60&sortBy=visited&sortDirection=desc`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive) { const d = res.data?.data; setAll(d?.activities || d || []); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [locale]);

  // most-added experiences for the featured strip (only those that actually appear in itineraries)
  const popular = useMemo(
    () => all.filter((a) => (a.safariCount ?? 0) > 0).slice(0, 8),
    [all]
  );

  const sortOpts: Opt[] = [
    { value: "popular", label: af("sortPopular") },
    { value: "az", label: af("sortAz") },
    { value: "za", label: af("sortZa") },
  ];

  const clearAll = () => setSearch("");

  // tall card for the "most popular" carousel
  const renderPopularCard = (a: ActivityItem) => {
    const img = a.primaryImageUrl;
    const bg = img ? `50% 45%/cover no-repeat url('${img}')` : gradFor(a.slug);
    const n = a.safariCount ?? 0;
    return (
      <article className="group relative" style={{ height: 300, borderRadius: 20, overflow: "hidden", background: bg }}>
        <Link href={`/activities/${a.slug}`} aria-label={a.name} className="absolute inset-0 z-[5]" />
        {!img && <Balloon w={180} o={0.13} />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 30%,rgba(20,12,4,.55) 62%,rgba(20,12,4,.92) 100%)" }} />
        {n > 0 && (
          <div className="absolute inline-flex items-center" style={{ top: 14, right: 14, gap: 5, background: "#3d1402", color: "#f3e6c8", fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 20 }}><Compass size={11} strokeWidth={2.4} />{af("safariStat", { count: n })}</div>
        )}
        <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between" style={{ padding: 22, gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            {a.seasonAvailability && <div style={{ color: "#f3e6c8", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6, ...ONE_LINE }}>{a.seasonAvailability}</div>}
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
      <PageHero heroPage="ACTIVITIES" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      {/* ===== Sticky finder bar (server-driven) ===== */}
      <div className="sticky top-20 z-30" style={{ background: "rgba(250,248,245,.9)", backdropFilter: "blur(12px)", borderTop: "1px solid #e4ddd1", borderBottom: "1px solid #e4ddd1", padding: "10px clamp(16px,5vw,56px)" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div className="flex items-stretch gap-2 flex-wrap">
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180, display: "flex", alignItems: "center" }}>
              <Search size={17} strokeWidth={2} style={{ position: "absolute", left: 14, color: "#7a6f61", pointerEvents: "none" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={af("searchPlaceholder")}
                style={{ width: "100%", border: "1.5px solid #e4ddd1", background: "#fff", borderRadius: 9, padding: "12px 14px 12px 40px", fontSize: 14.5, color: "#2a2018", outline: "none" }} />
            </div>
            <Dropdown ariaLabel={af("sortAria")} label={sortOpts.find((o) => o.value === sort)!.label} active={false} open={openDD === "sort"} onToggle={() => setOpenDD(openDD === "sort" ? null : "sort")} onClose={() => setOpenDD(null)} value={sort} onPick={setSort} options={sortOpts} />
          </div>
          <div className="flex items-center flex-wrap gap-2" style={{ marginTop: 10, minHeight: 24 }}>
            <span style={{ fontSize: 13, color: "#7a6f61", marginRight: 2 }}>{loading ? "…" : totalItems === 0 ? af("noActivities") : af("resultCount", { count: totalItems })}</span>
            {debouncedSearch && (
              <button onClick={clearAll} className="inline-flex items-center cursor-pointer" style={{ gap: 6, background: "#e6ece2", color: "#274e22", border: "1px solid rgba(39,78,34,.18)", fontSize: 12.5, fontWeight: 600, padding: "5px 9px 5px 11px", borderRadius: 20 }}>
                {`“${debouncedSearch}”`}<X size={12} strokeWidth={2.6} />
              </button>
            )}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1220, margin: "0 auto", padding: "clamp(28px,4vw,44px) clamp(16px,5vw,56px) 0" }}>
        {/* ===== Most popular experiences (carousel, unfiltered) ===== */}
        {!anyFilter && popular.length > 0 && (
          <div style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
            <FeaturedCarousel title={af("popularTitle")} subtitle={af("popularSub")} items={popular} renderCard={renderPopularCard} prevLabel={af("prev")} nextLabel={af("next")} />
          </div>
        )}
        {/* ===== All experiences heading (unfiltered) ===== */}
        {!anyFilter && !loading && items.length > 0 && (
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(20px,2.6vw,26px)", margin: "0 0 18px" }}>{af("allActivities")}</h2>
        )}

        {loading ? (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "clamp(18px,2.4vw,28px)" }}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} variant="park" />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "clamp(40px,7vw,72px) 20px", background: "#fff", border: "1px solid #e4ddd1", borderRadius: 18 }}>
            <div className="mx-auto flex items-center justify-center" style={{ width: 60, height: 60, borderRadius: 16, background: "#e6ece2", marginBottom: 20, color: "#274e22" }}><Compass size={28} strokeWidth={1.7} /></div>
            <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 26, margin: "0 0 10px" }}>{af("emptyTitle")}</h3>
            <p style={{ color: "#7a6f61", fontSize: 16, lineHeight: 1.55, maxWidth: 420, margin: "0 auto 24px" }}>{af("emptyBody")}</p>
            <div className="flex flex-wrap gap-2.5 justify-center">
              <Link href="/plan" className="rounded-lg font-semibold" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 15, padding: "13px 26px" }}>{home("ctaCta")}</Link>
              <button onClick={clearAll} className="rounded-lg font-semibold cursor-pointer" style={{ background: "none", border: "1.5px solid #e4ddd1", color: "#5a1e03", fontSize: 15, padding: "12px 24px" }}>{af("clearFilters")}</button>
            </div>
          </div>
        ) : (
          <section aria-label={af("allActivities")}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "clamp(18px,2.4vw,28px)" }}>
              {items.map((a) => {
                const img = a.primaryImageUrl;
                const bg = img ? `50% 45%/cover no-repeat url('${img}')` : gradFor(a.slug);
                return (
                  <article key={a.slug} className="group relative" style={{ height: 300, borderRadius: 20, overflow: "hidden", background: bg }}>
                    <Link href={`/activities/${a.slug}`} aria-label={a.name} className="absolute inset-0 z-[5]" />
                    {!img && <Balloon w={170} o={0.13} />}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 28%,rgba(20,12,4,.55) 58%,rgba(20,12,4,.92) 100%)" }} />
                    <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between" style={{ padding: 22, gap: 14 }}>
                      <div style={{ minWidth: 0 }}>
                        {a.seasonAvailability && <div style={{ color: "#f3e6c8", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6, ...ONE_LINE }}>{a.seasonAvailability}</div>}
                        <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: 21, lineHeight: 1.14, margin: 0, textShadow: "0 1px 12px rgba(20,12,4,.5)", ...ONE_LINE }}>{a.name}</h3>
                        {a.description && <p style={{ color: "rgba(242,236,224,.82)", fontSize: 13, lineHeight: 1.4, margin: "7px 0 0", ...ONE_LINE }}>{a.description}</p>}
                      </div>
                      <span className="flex items-center justify-center bg-white text-[#2a2018] group-hover:bg-brand-green group-hover:text-white transition-colors" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%" }}><ArrowRight size={17} strokeWidth={2.4} /></span>
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
