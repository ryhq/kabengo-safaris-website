"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Search, Star, MapPin, Building2 } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import LoadMoreFade from "@/components/ui/LoadMoreFade";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useDebounce } from "@/lib/useDebounce";
import { apiClient } from "@/lib/api";

interface AccommodationItem {
  slug: string;
  name: string;
  accommodationTypeDisplayName?: string;
  categoryDisplayName?: string;
  region?: string;
  shortDescription?: string;
  starRating?: number;
  priceRange?: string;
  primaryImageUrl?: string;
}
const PAGE_SIZE = 6;

export default function AccommodationsPage() {
  const t = useTranslations("accommodations");
  const common = useTranslations("common");
  const locale = useLocale();
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setCurrentPage(0);
      try {
        const params = new URLSearchParams();
        params.set("page", "0");
        params.set("size", String(PAGE_SIZE));
        if (debouncedSearch) params.set("keyword", debouncedSearch);
        const res = await apiClient.get(`/public/accommodations?${params}`, {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) {
          const data = res.data.data;
          setAccommodations(data?.accommodations || data || []);
          setTotalItems(data?.totalItems || 0);
        }
      } catch (err) {
        console.error("Failed to fetch accommodations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [debouncedSearch]);

  const hasMore = accommodations.length < totalItems;

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("size", String(PAGE_SIZE));
      if (debouncedSearch) params.set("keyword", debouncedSearch);
      const res = await apiClient.get(`/public/accommodations?${params}`, {
        headers: { "Accept-Language": locale },
      });
      if (res.data.success) {
        const data = res.data.data;
        const newItems = data?.accommodations || data || [];
        setAccommodations((prev) => {
          const existingSlugs = new Set(prev.map((a) => a.slug));
          const unique = newItems.filter((a: AccommodationItem) => !existingSlugs.has(a.slug));
          return [...prev, ...unique];
        });
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more accommodations:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <PageHero heroPage="ACCOMMODATIONS" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      {/* Floating search bar */}
      <div className="relative z-20 -mt-8">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-100 p-2">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-stone-50 border-0 focus:bg-white focus:ring-2 focus:ring-brand-brown/20 outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} variant="park" />
              ))}
            </div>
          ) : accommodations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
                <Building2 size={32} className="text-stone-300" />
              </div>
              <p className="text-lg text-stone-500 font-serif">{common("noResults")}</p>
            </motion.div>
          ) : (
            <>
              <div className={`grid gap-6 lg:gap-8 ${
                accommodations.length === 1 ? "grid-cols-1 max-w-lg mx-auto" :
                accommodations.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto" :
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}>
                {accommodations.map((acc, index) => (
                  <motion.div
                    key={acc.slug}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % PAGE_SIZE) * 0.06, duration: 0.5 }}
                  >
                    <Link
                      href={`/accommodations/${acc.slug}`}
                      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100/80"
                    >
                      {/* Image */}
                      <div className="relative h-56 sm:h-60 overflow-hidden">
                        <Image
                          src={acc.primaryImageUrl || "/images/placeholders/accommodation.svg"}
                          alt={acc.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

                        {/* Top badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                          {acc.accommodationTypeDisplayName && (
                            <span className="text-[11px] font-semibold bg-white/95 backdrop-blur-sm text-brand-brown px-3 py-1.5 rounded-lg shadow-sm">
                              {acc.accommodationTypeDisplayName}
                            </span>
                          )}
                          {acc.starRating && acc.starRating > 0 && (
                            <span className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-lg">
                              {Array.from({ length: acc.starRating }).map((_, i) => (
                                <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                              ))}
                            </span>
                          )}
                        </div>

                        {/* Bottom badges */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          {acc.categoryDisplayName && (
                            <span className="text-[10px] font-semibold bg-brand-brown/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg uppercase tracking-wider">
                              {acc.categoryDisplayName}
                            </span>
                          )}
                          {acc.priceRange && (
                            <span className="text-sm font-bold bg-brand-green/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg shadow-sm">
                              {acc.priceRange}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 pb-4">
                        <h3 className="text-lg font-bold text-stone-800 group-hover:text-brand-brown transition-colors font-serif leading-snug line-clamp-2">
                          {acc.name}
                        </h3>

                        {acc.region && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 mt-1.5">
                            <MapPin size={11} />
                            {acc.region}
                          </span>
                        )}

                        {acc.shortDescription && (
                          <p className="text-[13px] text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                            {acc.shortDescription}
                          </p>
                        )}

                        <div className="flex items-center justify-end mt-4 pt-3 border-t border-stone-50">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-brown group-hover:gap-2.5 transition-all">
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
                    loaded={accommodations.length}
                    total={totalItems}
                    label="Accommodations"
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
