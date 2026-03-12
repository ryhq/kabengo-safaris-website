"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ArrowRight,
  Search,
  MapPin,
  Moon,
  DollarSign,
  Compass,
  SlidersHorizontal,
  X,
  TreePine,
} from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import LoadMoreFade from "@/components/ui/LoadMoreFade";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useDebounce } from "@/lib/useDebounce";
import { apiClient } from "@/lib/api";
import type { Itinerary } from "@/types";
const PAGE_SIZE = 6;

const TRIP_TYPES = [
  { value: "", label: "all" },
  { value: "PRIVATE", label: "private" },
  { value: "GROUP", label: "group" },
  { value: "CUSTOM", label: "custom" },
  { value: "HONEYMOON", label: "honeymoon" },
  { value: "FAMILY", label: "family" },
  { value: "PHOTOGRAPHY", label: "photography" },
  { value: "ADVENTURE", label: "adventure" },
];

const BUDGET_CATEGORIES = [
  { value: "", label: "all" },
  { value: "ULTRA_LUXURY", label: "ultraLuxury" },
  { value: "LUXURY", label: "luxury" },
  { value: "MID_RANGE", label: "midRange" },
  { value: "BUDGET", label: "budget" },
  { value: "BACKPACKER", label: "backpacker" },
];

export default function SafarisPage() {
  const t = useTranslations("safaris");
  const common = useTranslations("common");
  const locale = useLocale();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [tripType, setTripType] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = (tripType ? 1 : 0) + (budgetCategory ? 1 : 0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setCurrentPage(0);
      try {
        const params = new URLSearchParams();
        params.set("page", "0");
        params.set("size", String(PAGE_SIZE));
        if (debouncedSearch) params.set("keyword", debouncedSearch);
        if (tripType) params.set("tripType", tripType);
        if (budgetCategory) params.set("budgetCategory", budgetCategory);
        const res = await apiClient.get(`/public/safaris?${params}`, {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) {
          const data = res.data.data;
          setItineraries(data?.safaris || data || []);
          setTotalItems(data?.totalItems || 0);
        }
      } catch (err) {
        console.error("Failed to fetch safaris:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [debouncedSearch, tripType, budgetCategory]);

  const hasMore = itineraries.length < totalItems;

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("size", String(PAGE_SIZE));
      if (debouncedSearch) params.set("keyword", debouncedSearch);
      if (tripType) params.set("tripType", tripType);
      if (budgetCategory) params.set("budgetCategory", budgetCategory);
      const res = await apiClient.get(`/public/safaris?${params}`, {
        headers: { "Accept-Language": locale },
      });
      if (res.data.success) {
        const data = res.data.data;
        const newItems = data?.safaris || data || [];
        setItineraries((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const unique = newItems.filter((s: Itinerary) => !existingIds.has(s.id));
          return [...prev, ...unique];
        });
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more safaris:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatPrice = (item: Itinerary) => {
    if (!item.costSummary || item.costSummary.length === 0) return null;
    const cost = item.costSummary[0];
    if (!cost.grandTotalRack) return null;
    return `${cost.currency || "USD"} ${cost.grandTotalRack.toLocaleString()}`;
  };

  const clearFilters = () => {
    setTripType("");
    setBudgetCategory("");
  };

  return (
    <>
      <PageHero heroPage="SAFARIS" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      {/* Search & Filter Bar — floating over hero/content junction */}
      <div className="relative z-20 -mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-100 p-2">
            <div className="flex items-center gap-2">
              {/* Search input */}
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-stone-50 border-0 focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all text-sm"
                />
              </div>

              {/* Filter toggle button */}
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  filtersOpen || activeFilterCount > 0
                    ? "bg-brand-green text-white"
                    : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                }`}
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">{t("filters.tripType")}</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white/20 text-[11px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Expandable filter panel */}
            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 pb-2 px-2 space-y-4">
                    {/* Trip Type */}
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Compass size={13} className="text-brand-green" />
                        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                          {t("filters.tripType")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {TRIP_TYPES.map((tt) => (
                          <button
                            key={tt.value}
                            type="button"
                            onClick={() => setTripType(tt.value)}
                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                              tripType === tt.value
                                ? "bg-brand-green text-white shadow-sm"
                                : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100"
                            }`}
                          >
                            {t(`filters.tripTypes.${tt.label}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Budget */}
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <DollarSign size={13} className="text-brand-brown" />
                        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                          {t("filters.budget")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {BUDGET_CATEGORIES.map((bc) => (
                          <button
                            key={bc.value}
                            type="button"
                            onClick={() => setBudgetCategory(bc.value)}
                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                              budgetCategory === bc.value
                                ? "bg-brand-brown text-white shadow-sm"
                                : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100"
                            }`}
                          >
                            {t(`filters.budgetCategories.${bc.label}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear filters */}
                    {activeFilterCount > 0 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                        >
                          <X size={12} />
                          {t("filters.clear")}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Results section */}
      <section className="py-12 bg-brand-warm min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 font-serif">
              {t("sectionHeading")}
            </h2>
            <p className="text-sm text-stone-500 mt-2">{t("sectionSubheading")}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} variant="safari" />
              ))}
            </div>
          ) : itineraries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
                <TreePine size={32} className="text-stone-300" />
              </div>
              <p className="text-lg text-stone-500 font-serif">{common("noResults")}</p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-sm text-brand-green hover:underline cursor-pointer"
                >
                  {t("filters.clear")}
                </button>
              )}
            </motion.div>
          ) : (
            <>
              <div className={`grid gap-6 lg:gap-8 ${
                itineraries.length === 1 ? "grid-cols-1 max-w-lg mx-auto" :
                itineraries.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto" :
                "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              }`}>
                {itineraries.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % PAGE_SIZE) * 0.06, duration: 0.5 }}
                  >
                    <Link
                      href={`/safaris/${item.code || item.id}`}
                      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100/80"
                    >
                      {/* Image section */}
                      <div className="relative h-56 sm:h-60 overflow-hidden">
                        <img
                          src={item.primaryImageUrl || "/images/placeholders/safari.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

                        {/* Top badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                          {item.tripTypeDisplayName && (
                            <span className="text-[11px] font-semibold bg-white/95 backdrop-blur-sm text-brand-green px-3 py-1.5 rounded-lg shadow-sm">
                              {item.tripTypeDisplayName}
                            </span>
                          )}
                          {item.totalDays && (
                            <span className="text-[11px] font-bold bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                              <Calendar size={11} />
                              {t("duration", { days: item.totalDays })}
                            </span>
                          )}
                        </div>

                        {/* Bottom — price & budget on image */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          {item.budgetCategoryDisplayName && (
                            <span className="text-[10px] font-semibold bg-brand-brown/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg uppercase tracking-wider">
                              {item.budgetCategoryDisplayName}
                            </span>
                          )}
                          {formatPrice(item) && (
                            <span className="text-sm font-bold bg-brand-green/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg shadow-sm">
                              {formatPrice(item)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 pb-4">
                        <h3 className="text-lg font-bold text-stone-800 group-hover:text-brand-green transition-colors font-serif leading-snug line-clamp-2">
                          {item.name}
                        </h3>

                        {item.description && (
                          <p className="text-[13px] text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Meta chips */}
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          {item.totalNights != null && item.totalNights > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg">
                              <Moon size={11} className="text-stone-400" />
                              {t("nights", { nights: item.totalNights })}
                            </span>
                          )}
                          {(item.startLocation || item.endLocation) && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg">
                              <MapPin size={11} className="text-stone-400" />
                              {item.startLocation || item.endLocation}
                            </span>
                          )}
                        </div>

                        {/* CTA row */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-50">
                          <span className="text-[11px] text-stone-400 font-medium">
                            {t("detail.from")}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-green group-hover:gap-2.5 transition-all">
                            {common("viewDetails")}
                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-6">
                  <LoadMoreFade
                    loading={loadingMore}
                    loaded={itineraries.length}
                    total={totalItems}
                    label="Safaris"
                    onLoadMore={loadMore}
                    fadeColor="warm"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
