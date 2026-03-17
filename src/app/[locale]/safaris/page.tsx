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
  Sun,
  Sunrise,
  Clock,
  SlidersHorizontal,
  X,
  TreePine,
  Compass,
  DollarSign,
} from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import LoadMoreFade from "@/components/ui/LoadMoreFade";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useDebounce } from "@/lib/useDebounce";
import { apiClient } from "@/lib/api";
import type { Itinerary } from "@/types";

const PAGE_SIZE = 9;

const DURATION_FILTERS = [
  { key: "all", minDays: undefined, maxDays: undefined, icon: Compass },
  { key: "dayTrip", minDays: 1, maxDays: 1, icon: Sun },
  { key: "short", minDays: 2, maxDays: 3, icon: Sunrise },
  { key: "medium", minDays: 4, maxDays: 6, icon: Calendar },
  { key: "week", minDays: 7, maxDays: 9, icon: Clock },
  { key: "extended", minDays: 10, maxDays: undefined, icon: Moon },
];

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
  const [durationKey, setDurationKey] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeDuration = DURATION_FILTERS.find((d) => d.key === durationKey)!;
  const activeFilterCount =
    (tripType ? 1 : 0) + (budgetCategory ? 1 : 0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setCurrentPage(0);
      try {
        const params = new URLSearchParams();
        params.set("page", "0");
        params.set("size", String(PAGE_SIZE));
        params.set("sortBy", "totalDays");
        params.set("sortDirection", "asc");
        if (debouncedSearch) params.set("keyword", debouncedSearch);
        if (tripType) params.set("tripType", tripType);
        if (budgetCategory) params.set("budgetCategory", budgetCategory);
        if (activeDuration.minDays !== undefined)
          params.set("minDays", String(activeDuration.minDays));
        if (activeDuration.maxDays !== undefined)
          params.set("maxDays", String(activeDuration.maxDays));
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
  }, [debouncedSearch, tripType, budgetCategory, durationKey]);

  const hasMore = itineraries.length < totalItems;

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("size", String(PAGE_SIZE));
      params.set("sortBy", "totalDays");
      params.set("sortDirection", "asc");
      if (debouncedSearch) params.set("keyword", debouncedSearch);
      if (tripType) params.set("tripType", tripType);
      if (budgetCategory) params.set("budgetCategory", budgetCategory);
      if (activeDuration.minDays !== undefined)
        params.set("minDays", String(activeDuration.minDays));
      if (activeDuration.maxDays !== undefined)
        params.set("maxDays", String(activeDuration.maxDays));
      const res = await apiClient.get(`/public/safaris?${params}`, {
        headers: { "Accept-Language": locale },
      });
      if (res.data.success) {
        const data = res.data.data;
        const newItems = data?.safaris || data || [];
        setItineraries((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const unique = newItems.filter(
            (s: Itinerary) => !existingIds.has(s.id)
          );
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
    setDurationKey("all");
    setSearch("");
  };

  const allFiltersCount =
    activeFilterCount + (durationKey !== "all" ? 1 : 0) + (search ? 1 : 0);

  return (
    <>
      <PageHero
        heroPage="SAFARIS"
        fallbackTitle={t("title")}
        fallbackSubtitle={t("subtitle")}
      />

      {/* Duration Quick-Filter Bar */}
      <div className="relative z-20 -mt-7">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-100 p-1.5 sm:p-2">
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide">
              {DURATION_FILTERS.map((dur) => {
                const Icon = dur.icon;
                const isActive = durationKey === dur.key;
                return (
                  <button
                    key={dur.key}
                    type="button"
                    onClick={() => setDurationKey(dur.key)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                      isActive
                        ? "bg-brand-green text-white shadow-md"
                        : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                    }`}
                  >
                    <Icon size={15} className={isActive ? "text-white" : "text-stone-400"} />
                    {t(`filters.durations.${dur.key}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Results section */}
      <section className="py-8 bg-brand-warm min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search + Filters Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 focus:border-brand-green/30 focus:ring-2 focus:ring-brand-green/10 outline-none transition-all text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                filtersOpen || activeFilterCount > 0
                  ? "bg-brand-green text-white border-brand-green"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
              }`}
            >
              <SlidersHorizontal size={15} />
              {t("filters.moreFilters")}
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white/20 text-[11px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Clear all */}
            {allFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X size={12} />
                {t("filters.clear")}
              </button>
            )}
          </div>

          {/* Expandable Trip Type + Budget panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden mb-8"
              >
                <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-5">
                  {/* Trip Type */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
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
                    <div className="flex items-center gap-2 mb-3">
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          {!loading && totalItems > 0 && (
            <p className="text-xs text-stone-400 mb-4">
              {t("resultCount", { count: totalItems })}
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <p className="text-lg text-stone-500 font-serif">
                {common("noResults")}
              </p>
              {allFiltersCount > 0 && (
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
              <div
                className={`grid gap-6 ${
                  itineraries.length === 1
                    ? "grid-cols-1 max-w-lg mx-auto"
                    : itineraries.length === 2
                    ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {itineraries.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: (index % PAGE_SIZE) * 0.05,
                      duration: 0.45,
                    }}
                  >
                    <Link
                      href={`/safaris/${item.code || item.id}`}
                      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100/80 h-full"
                    >
                      {/* Image */}
                      <div className="relative h-52 sm:h-56 overflow-hidden">
                        <img
                          src={
                            item.primaryImageUrl ||
                            "/images/placeholders/safari.svg"
                          }
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

                        {/* Top-left: Trip type */}
                        {item.tripTypeDisplayName && (
                          <span className="absolute top-3 left-3 text-[11px] font-semibold bg-white/95 backdrop-blur-sm text-brand-green px-3 py-1.5 rounded-lg shadow-sm">
                            {item.tripTypeDisplayName}
                          </span>
                        )}

                        {/* Top-right: Duration badge */}
                        <span className="absolute top-3 right-3 text-[11px] font-bold bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <Calendar size={11} />
                          {item.totalDays === 1 && item.totalNights === 0
                            ? t("dayTrip")
                            : t("daysNights", {
                                days: item.totalDays ?? 0,
                                nights: item.totalNights ?? 0,
                              })}
                        </span>

                        {/* Bottom-left: Budget tier */}
                        {item.budgetCategoryDisplayName && (
                          <span className="absolute bottom-3 left-3 text-[10px] font-semibold bg-brand-brown/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            {item.budgetCategoryDisplayName}
                          </span>
                        )}

                        {/* Bottom-right: Price */}
                        {formatPrice(item) && (
                          <span className="absolute bottom-3 right-3 text-sm font-bold bg-brand-green/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg shadow-sm">
                            {formatPrice(item)}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 pb-4 flex flex-col">
                        <h3 className="text-base font-bold text-stone-800 group-hover:text-brand-green transition-colors font-serif leading-snug line-clamp-2">
                          {item.name}
                        </h3>

                        {item.description && (
                          <p className="text-[13px] text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          {(item.startLocation || item.endLocation) && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg">
                              <MapPin size={11} className="text-stone-400" />
                              {item.startLocation || item.endLocation}
                            </span>
                          )}
                        </div>

                        {/* CTA */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-50">
                          {formatPrice(item) ? (
                            <span className="text-[11px] text-stone-400 font-medium">
                              {t("detail.from")}
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-green group-hover:gap-2.5 transition-all">
                            {common("viewDetails")}
                            <ArrowRight
                              size={14}
                              className="transition-transform group-hover:translate-x-0.5"
                            />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-8">
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
