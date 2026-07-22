"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  TreePine,
  Compass,
  Tent,
  Map,
  MessageSquareQuote,
  ArrowRight,
  Loader2,
  ChevronDown,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { getAllPosts } from "@/content/blog";
import { FAQ_ITEMS } from "@/content/faq";

interface SearchResult {
  slug?: string;
  code?: string;
  name?: string;
  authorName?: string;
  message?: string;
  region?: string;
  shortDescription?: string;
  description?: string;
  primaryImageUrl?: string;
}

interface SearchData {
  parks: SearchResult[];
  parksTotalItems: number;
  activities: SearchResult[];
  activitiesTotalItems: number;
  accommodations: SearchResult[];
  accommodationsTotalItems: number;
  safaris: SearchResult[];
  safarisTotalItems: number;
  testimonies: SearchResult[];
  testimoniesTotalItems: number;
  totalResults: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { key: "safaris", icon: Map, href: "/safaris", labelKey: "safaris", identifierField: "code" },
  { key: "parks", icon: TreePine, href: "/parks", labelKey: "parks", identifierField: "slug" },
  { key: "activities", icon: Compass, href: "/activities", labelKey: "activities", identifierField: "slug" },
  { key: "accommodations", icon: Tent, href: "/accommodations", labelKey: "accommodations", identifierField: "slug" },
  { key: "testimonies", icon: MessageSquareQuote, href: "/reviews", labelKey: "testimonials", identifierField: null },
] as const;

// Curated keyword suggestions shown in the empty state (click = run that search).
// Proper nouns / evergreen themes so they reliably return results in any locale.
const SUGGESTIONS = ["Serengeti", "Great Migration", "Ngorongoro", "Zanzibar", "Tarangire", "Big Five"];
// Categories previewed (popular items) before the user types.
const PREVIEW_CATEGORIES = ["safaris", "parks", "activities", "accommodations"] as const;

const RECENT_KEY = "kbg_recent_searches";
const RECENT_MAX = 6;
const INITIAL_LIMIT = 3;
const LOAD_MORE_STEP = 6;

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const t = useTranslations("nav");
  const s = useTranslations("search");
  const common = useTranslations("common");
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [currentLimit, setCurrentLimit] = useState(INITIAL_LIMIT);
  const [recent, setRecent] = useState<string[]>([]);
  const [preview, setPreview] = useState<Partial<SearchData> | null>(null);
  const previewLocaleRef = useRef<string | null>(null);

  // Preload popular items per category on first open (per locale) for the empty state.
  useEffect(() => {
    if (!isOpen || previewLocaleRef.current === locale) return;
    let alive = true;
    const h = { headers: { "Accept-Language": locale } };
    Promise.allSettled([
      apiClient.get("/public/safaris/popular", { params: { size: 4 }, ...h }),
      apiClient.get("/public/parks", { params: { page: 0, size: 4, sortBy: "visited" }, ...h }),
      apiClient.get("/public/activities", { params: { page: 0, size: 4, sortBy: "visited", sortDirection: "desc" }, ...h }),
      apiClient.get("/public/accommodations", { params: { page: 0, size: 4, sortBy: "visited", sortDirection: "desc" }, ...h }),
    ]).then((rs) => {
      if (!alive) return;
      const pick = (r: PromiseSettledResult<unknown>, key: string): SearchResult[] => {
        if (r.status !== "fulfilled") return [];
        const body = (r.value as { data?: { success?: boolean; data?: Record<string, unknown> } })?.data;
        if (!body?.success) return [];
        const d = body.data;
        return ((d?.[key] as SearchResult[]) || (Array.isArray(d) ? (d as SearchResult[]) : [])) ?? [];
      };
      setPreview({
        safaris: pick(rs[0], "safaris"),
        parks: pick(rs[1], "parks"),
        activities: pick(rs[2], "activities"),
        accommodations: pick(rs[3], "accommodations"),
      });
      previewLocaleRef.current = locale;
    });
    return () => { alive = false; };
  }, [isOpen, locale]);

  // Load recent searches (localStorage) whenever the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(raw)) setRecent(raw.filter((x) => typeof x === "string").slice(0, RECENT_MAX));
    } catch { /* ignore */ }
  }, [isOpen]);

  const saveRecent = useCallback((q: string) => {
    const term = q.trim();
    if (term.length < 2) return;
    setRecent((prev) => {
      const next = [term, ...prev.filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, RECENT_MAX);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setData(null);
      setCurrentLimit(INITIAL_LIMIT);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [isOpen, onClose]);

  // Close on click outside (lose focus)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Debounced search
  const fetchSearch = useCallback(async (keyword: string, limit: number) => {
    try {
      const res = await apiClient.get("/public/search", {
        params: { keyword, limit },
        headers: { "Accept-Language": locale },
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  }, [locale]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setCurrentLimit(INITIAL_LIMIT);
    debounceRef.current = setTimeout(async () => {
      await fetchSearch(query.trim(), INITIAL_LIMIT);
      setLoading(false);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSearch]);

  const handleLoadMore = useCallback(async () => {
    if (!query.trim()) return;
    const newLimit = currentLimit + LOAD_MORE_STEP;
    setLoadingMore("all");
    await fetchSearch(query.trim(), newLimit);
    setCurrentLimit(newLimit);
    setLoadingMore(null);
  }, [query, currentLimit, fetchSearch]);

  const handleNavigate = useCallback(() => {
    saveRecent(query);
    onClose();
  }, [onClose, saveRecent, query]);

  // Shared result/preview row.
  const renderItem = (cat: (typeof CATEGORIES)[number], item: SearchResult) => {
    const identifier = cat.identifierField
      ? (item as unknown as Record<string, string | undefined>)[cat.identifierField] || item.name
      : item.name;
    const isTestimony = cat.key === "testimonies";
    const title = isTestimony ? item.authorName : item.name;
    const subtitle = isTestimony
      ? (item.message?.slice(0, 80) || "") + (item.message && item.message.length > 80 ? "..." : "")
      : item.shortDescription || item.description || item.region;
    return (
      <Link
        key={`${cat.key}-${identifier}`}
        href={isTestimony ? cat.href : `${cat.href}/${identifier}`}
        onClick={handleNavigate}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors group"
      >
        {item.primaryImageUrl && !isTestimony ? (
          <Image src={item.primaryImageUrl} alt={title || ""} width={40} height={40} sizes="40px" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <cat.icon size={18} className="text-brand-green" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white group-hover:text-brand-green transition-colors truncate">{title}</p>
          {subtitle && <p className="text-xs text-white/40 truncate">{subtitle}</p>}
        </div>
        <ArrowRight size={14} className="text-white/30 group-hover:text-brand-green flex-shrink-0 transition-colors" />
      </Link>
    );
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Local (frontend-only) content: blog posts + FAQs, searched client-side.
  const q = query.trim().toLowerCase();
  const localActive = q.length >= 2;
  const blogMatches = localActive
    ? getAllPosts().filter((p) => {
        const body = p.body.map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : "")).join(" ");
        return `${p.title} ${p.excerpt} ${p.tags.join(" ")} ${body}`.toLowerCase().includes(q);
      }).slice(0, 5)
    : [];
  const faqMatches = localActive
    ? FAQ_ITEMS.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q)).slice(0, 5)
    : [];
  const localCount = blogMatches.length + faqMatches.length;

  const hasResults = data && data.totalResults > 0;
  const anyResults = !!hasResults || localCount > 0;
  const noResults = localActive && !loading && !hasResults && localCount === 0;

  // Check if any category has more items than currently shown (max backend limit is 20)
  const hasMoreToLoad = currentLimit < 20 && data ? CATEGORIES.some((cat) => {
    const items = data[cat.key as keyof SearchData] as SearchResult[];
    const total = data[`${cat.key}TotalItems` as keyof SearchData] as number;
    return items && items.length < total;
  }) : false;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] glass-overlay"
            style={{ backdropFilter: "blur(12px) saturate(180%)" }}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30, opacity: { duration: 0.2 } }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[61] px-4"
          >
            <div
              className="glass-card rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden max-h-[75vh] flex flex-col"
              style={{ backdropFilter: "blur(12px) saturate(150%)" }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/15">
                <Search size={20} className="text-white/50 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveRecent(query); }}
                  placeholder={s("placeholder")}
                  className="flex-1 text-base outline-none bg-transparent text-white placeholder:text-white/40 caret-white"
                />
                {loading && <Loader2 size={18} className="text-white/50 animate-spin flex-shrink-0" />}
                <button
                  onClick={onClose}
                  className="p-1 rounded-md hover:bg-white/10 transition-colors text-white/50 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Results */}
              <div className="overflow-y-auto flex-1">
                {/* Empty state — suggestions + recent + plan CTA + preloaded previews */}
                {!data && !loading && query.length < 2 && (
                  <div>
                    {/* keyword suggestion chips */}
                    <div className="px-5 pt-4 pb-3 flex flex-wrap gap-2">
                      {SUGGESTIONS.map((term) => (
                        <button
                          key={term}
                          onClick={() => { setQuery(term); inputRef.current?.focus(); }}
                          className="px-3 py-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 hover:border-white/30 text-sm text-white/80 hover:text-white transition-colors cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>

                    {/* recent searches */}
                    {recent.length > 0 && (
                      <div className="px-5 pb-3">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{s("recent")}</span>
                          <button onClick={clearRecent} className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer">{s("clear")}</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recent.map((term) => (
                            <button
                              key={term}
                              onClick={() => { setQuery(term); inputRef.current?.focus(); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-sm text-white/80 hover:text-white transition-colors cursor-pointer"
                            >
                              <Search size={13} className="text-white/40" />{term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* plan CTA */}
                    <div className="px-5 pb-1">
                      <Link
                        href="/plan"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-green/20 hover:bg-brand-green/30 border border-brand-green/30 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-brand-green/30 flex items-center justify-center flex-shrink-0">
                          <Compass size={18} className="text-brand-green" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{s("planYourSafari")}</p>
                          <p className="text-xs text-white/50">{s("planYourSafariSub")}</p>
                        </div>
                        <ArrowRight size={15} className="text-white/40 group-hover:text-brand-green flex-shrink-0 transition-colors" />
                      </Link>
                    </div>

                    {/* preloaded category previews */}
                    {PREVIEW_CATEGORIES.map((key) => {
                      const cat = CATEGORIES.find((c) => c.key === key)!;
                      const items = (preview?.[key] as SearchResult[] | undefined) || [];
                      if (items.length === 0) return null;
                      return (
                        <div key={key} className="border-t border-white/10 mt-3">
                          <div className="px-5 pt-3 pb-1 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <cat.icon size={15} className="text-brand-green" />
                              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{t(cat.labelKey)}</span>
                            </div>
                            <Link href={cat.href} onClick={onClose} className="text-xs font-medium text-brand-green hover:text-white flex items-center gap-0.5 transition-colors">
                              {common("viewAll")} <ArrowRight size={12} />
                            </Link>
                          </div>
                          <div className="px-3 pb-2">
                            {items.slice(0, 4).map((item) => renderItem(cat, item))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No results */}
                {noResults && (
                  <div className="px-5 py-8 text-center text-sm text-white/50">
                    {common("noResults")}
                  </div>
                )}

                {/* Results grouped by category */}
                {hasResults && CATEGORIES.map((cat) => {
                  const items = data[cat.key as keyof SearchData] as SearchResult[];
                  const total = data[`${cat.key}TotalItems` as keyof SearchData] as number;
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={cat.key} className="border-b border-white/10 last:border-b-0">
                      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <cat.icon size={15} className="text-brand-green" />
                          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                            {t(cat.labelKey)}
                          </span>
                          <span className="text-xs text-white/40">({total})</span>
                        </div>
                        {total > items.length && (
                          <Link
                            href={`${cat.href}?keyword=${encodeURIComponent(query)}`}
                            onClick={handleNavigate}
                            className="text-xs font-medium text-brand-green hover:text-white flex items-center gap-0.5 transition-colors"
                          >
                            {common("viewAll")} <ArrowRight size={12} />
                          </Link>
                        )}
                      </div>

                      <div className="px-3 pb-3">
                        {items.map((item) => renderItem(cat, item))}
                      </div>
                    </div>
                  );
                })}

                {/* Journal (blog) — frontend content */}
                {blogMatches.length > 0 && (
                  <div className="border-b border-white/10 last:border-b-0">
                    <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                      <BookOpen size={15} className="text-brand-green" />
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{t("blog")}</span>
                      <span className="text-xs text-white/40">({blogMatches.length})</span>
                    </div>
                    <div className="px-3 pb-3">
                      {blogMatches.map((p) => (
                        <Link key={p.slug} href={`/blog/${p.slug}`} onClick={handleNavigate} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors group">
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0"><BookOpen size={18} className="text-brand-green" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white group-hover:text-brand-green transition-colors truncate">{p.title}</p>
                            <p className="text-xs text-white/40 truncate">{p.excerpt}</p>
                          </div>
                          <ArrowRight size={14} className="text-white/30 group-hover:text-brand-green flex-shrink-0 transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ — frontend content */}
                {faqMatches.length > 0 && (
                  <div className="border-b border-white/10 last:border-b-0">
                    <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                      <HelpCircle size={15} className="text-brand-green" />
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{t("faq")}</span>
                      <span className="text-xs text-white/40">({faqMatches.length})</span>
                    </div>
                    <div className="px-3 pb-3">
                      {faqMatches.map((f, i) => (
                        <Link key={i} href="/faq" onClick={handleNavigate} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors group">
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0"><HelpCircle size={18} className="text-brand-green" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white group-hover:text-brand-green transition-colors truncate">{f.q}</p>
                            <p className="text-xs text-white/40 truncate">{f.a}</p>
                          </div>
                          <ArrowRight size={14} className="text-white/30 group-hover:text-brand-green flex-shrink-0 transition-colors mt-1" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show More button */}
                {hasResults && hasMoreToLoad && (
                  <div className="px-5 py-3">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore !== null}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-white/70 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <ChevronDown size={15} />
                      )}
                      {s("showMore")}
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              {anyResults && (
                <div className="px-5 py-3 border-t border-white/10">
                  <p className="text-xs text-white/40 text-center">
                    {s("resultsFound", { count: (data?.totalResults ?? 0) + localCount })}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
