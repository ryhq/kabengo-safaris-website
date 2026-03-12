"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Search, TreePine } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import LoadMoreFade from "@/components/ui/LoadMoreFade";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useDebounce } from "@/lib/useDebounce";
import { apiClient } from "@/lib/api";

interface ParkItem {
  id: string;
  slug?: string;
  name: string;
  region?: string;
  shortDescription?: string;
  primaryImageUrl?: string;
}
const PAGE_SIZE = 6;

export default function ParksPage() {
  const t = useTranslations("parks");
  const common = useTranslations("common");
  const locale = useLocale();
  const [parks, setParks] = useState<ParkItem[]>([]);
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
        const res = await apiClient.get(`/public/parks?${params}`, {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) {
          const data = res.data.data;
          setParks(data?.parks || data || []);
          setTotalItems(data?.totalItems || 0);
        }
      } catch (err) {
        console.error("Failed to fetch parks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [debouncedSearch]);

  const hasMore = parks.length < totalItems;

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("size", String(PAGE_SIZE));
      if (debouncedSearch) params.set("keyword", debouncedSearch);
      const res = await apiClient.get(`/public/parks?${params}`, {
        headers: { "Accept-Language": locale },
      });
      if (res.data.success) {
        const data = res.data.data;
        const newParks = data?.parks || data || [];
        setParks((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const unique = newParks.filter((p: ParkItem) => !existingIds.has(p.id));
          return [...prev, ...unique];
        });
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more parks:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <PageHero heroPage="DESTINATIONS" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

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
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-stone-50 border-0 focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all text-sm"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} variant="park" />
              ))}
            </div>
          ) : parks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
                <TreePine size={32} className="text-stone-300" />
              </div>
              <p className="text-lg text-stone-500 font-serif">{common("noResults")}</p>
            </motion.div>
          ) : (
            <>
              <div className={`grid gap-6 lg:gap-8 ${
                parks.length === 1 ? "grid-cols-1 max-w-lg mx-auto" :
                parks.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto" :
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}>
                {parks.map((park, index) => (
                  <motion.div
                    key={park.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % PAGE_SIZE) * 0.06, duration: 0.5 }}
                  >
                    <Link
                      href={`/parks/${park.slug || park.id}`}
                      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100/80"
                    >
                      <div className="h-48 bg-gradient-to-br from-brand-green/20 to-brand-green/5 overflow-hidden">
                        <img
                          src={park.primaryImageUrl || "/images/placeholders/park.svg"}
                          alt={park.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-stone-800 group-hover:text-brand-green transition-colors font-serif">
                          {park.name}
                        </h3>
                        {park.region && (
                          <p className="text-sm text-stone-400 mt-1">{park.region}</p>
                        )}
                        {park.shortDescription && (
                          <p className="text-sm text-stone-500 mt-2 line-clamp-2">{park.shortDescription}</p>
                        )}
                        <span className="inline-flex items-center text-sm font-medium text-brand-green mt-3 group-hover:translate-x-1 transition-transform">
                          {common("learnMore")} <ArrowRight size={14} className="ml-1" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-6">
                  <LoadMoreFade
                    loading={loadingMore}
                    loaded={parks.length}
                    total={totalItems}
                    label="Parks"
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
