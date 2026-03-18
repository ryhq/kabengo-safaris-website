"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import LoadMoreFade from "@/components/ui/LoadMoreFade";
import { fetchParksPaginated } from "@/lib/api";

interface ParkItem {
  id: string;
  slug?: string;
  name: string;
  region?: string;
  shortDescription?: string;
  primaryImageUrl?: string;
}

interface ParksSectionProps {
  initialParks: ParkItem[];
  totalItems: number;
}

const PAGE_SIZE = 6;

export default function ParksSection({ initialParks, totalItems }: ParksSectionProps) {
  const t = useTranslations("home");
  const common = useTranslations("common");
  const [parks, setParks] = useState<ParkItem[]>(() => {
    const seen = new Set<string>();
    return initialParks.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const hasMore = parks.length < totalItems;

  const loadMore = async () => {
    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      const data = await fetchParksPaginated(nextPage, PAGE_SIZE);
      setParks((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = data.parks.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newItems];
      });
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Failed to load more parks:", err);
    } finally {
      setLoading(false);
    }
  };

  if (parks.length === 0) return null;

  return (
    <section className="py-20 bg-brand-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t("parksTitle")} subtitle={t("parksSubtitle")} />

        <div className={`grid gap-6 mt-12 ${
          parks.length === 1 ? "grid-cols-1 max-w-md mx-auto" :
          parks.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto" :
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}>
          {parks.map((park, index) => (
            <motion.div
              key={park.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/parks/${park.slug || park.id}`}
                className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-stone-100"
              >
                <div className="relative h-48 bg-gradient-to-br from-brand-green/20 to-brand-green/5 overflow-hidden">
                  <Image
                    src={park.primaryImageUrl || "/images/placeholders/park.svg"}
                    alt={park.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
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
          <div className="mt-4">
            <LoadMoreFade
              loading={loading}
              loaded={parks.length}
              total={totalItems}
              label="Parks"
              onLoadMore={loadMore}
              fadeColor="warm"
              viewAllHref="/parks"
            />
          </div>
        )}

        {!hasMore && (
          <div className="flex justify-center mt-6">
            <Link
              href="/parks"
              className="group w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center shadow-sm hover:shadow-md hover:border-brand-green transition-all duration-200"
              title={common("viewAll")}
            >
              <ArrowRight size={16} className="text-stone-500 group-hover:text-brand-green transition-colors" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
