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
} from "lucide-react";
import { apiClient } from "@/lib/api";

interface SearchResult {
  id: string;
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
    onClose();
  }, [onClose]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasResults = data && data.totalResults > 0;
  const noResults = data && data.totalResults === 0 && query.trim().length >= 2;

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
                {/* Empty state */}
                {!data && !loading && query.length < 2 && (
                  <div className="px-5 py-8 text-center text-sm text-white/40">
                    {s("minChars")}
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
                        {items.map((item) => {
                          const identifier = cat.identifierField
                            ? (item as unknown as Record<string, string | undefined>)[cat.identifierField] || item.id
                            : item.id;
                          const isTestimony = cat.key === "testimonies";
                          const title = isTestimony ? item.authorName : item.name;
                          const subtitle = isTestimony
                            ? item.message?.slice(0, 80) + (item.message && item.message.length > 80 ? "..." : "")
                            : item.shortDescription || item.description || item.region;

                          return (
                            <Link
                              key={item.id}
                              href={isTestimony ? cat.href : `${cat.href}/${identifier}`}
                              onClick={handleNavigate}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                            >
                              {item.primaryImageUrl && !isTestimony ? (
                                <Image
                                  src={item.primaryImageUrl}
                                  alt={title || ""}
                                  width={40}
                                  height={40}
                                  sizes="40px"
                                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                  <cat.icon size={18} className="text-brand-green" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white group-hover:text-brand-green transition-colors truncate">
                                  {title}
                                </p>
                                {subtitle && (
                                  <p className="text-xs text-white/40 truncate">{subtitle}</p>
                                )}
                              </div>
                              <ArrowRight size={14} className="text-white/30 group-hover:text-brand-green flex-shrink-0 transition-colors" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

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
              {hasResults && (
                <div className="px-5 py-3 border-t border-white/10">
                  <p className="text-xs text-white/40 text-center">
                    {s("resultsFound", { count: data.totalResults })}
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
