"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar, ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import LoadMoreFade from "@/components/ui/LoadMoreFade";
import { fetchSafarisPaginated } from "@/lib/api";

interface SafariItem {
  id: string;
  code?: string;
  name: string;
  description?: string;
  totalDays?: number;
  primaryImageUrl?: string;
}

interface SafarisSectionProps {
  initialSafaris: SafariItem[];
  totalItems: number;
}

const PAGE_SIZE = 6;

export default function SafarisSection({ initialSafaris, totalItems }: SafarisSectionProps) {
  const t = useTranslations("home");
  const common = useTranslations("common");
  const [safaris, setSafaris] = useState<SafariItem[]>(() => {
    const seen = new Set<string>();
    return initialSafaris.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const hasMore = safaris.length < totalItems;

  const loadMore = async () => {
    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      const data = await fetchSafarisPaginated(nextPage, PAGE_SIZE);
      setSafaris((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const newItems = data.safaris.filter((s) => !existingIds.has(s.id));
        return [...prev, ...newItems];
      });
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Failed to load more safaris:", err);
    } finally {
      setLoading(false);
    }
  };

  if (safaris.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t("safarisTitle")} subtitle={t("safarisSubtitle")} />

        <div className={`grid gap-8 mt-12 ${
          safaris.length === 1 ? "grid-cols-1 max-w-md mx-auto" :
          safaris.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto" :
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}>
          {safaris.map((safari, index) => (
            <motion.div
              key={safari.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/safaris/${safari.code || safari.id}`}
                className="group block bg-brand-cream rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={safari.primaryImageUrl || "/images/placeholders/safari.svg"}
                    alt={safari.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-stone-800 group-hover:text-brand-brown transition-colors font-serif">
                    {safari.name}
                  </h3>
                  {safari.description && (
                    <p className="text-sm text-stone-500 mt-2 line-clamp-2">
                      {safari.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    {safari.totalDays && (
                      <span className="flex items-center text-xs text-stone-400">
                        <Calendar size={14} className="mr-1" />
                        {safari.totalDays} {common("days")}
                      </span>
                    )}
                    <span className="flex items-center text-sm font-medium text-brand-brown group-hover:translate-x-1 transition-transform">
                      {common("viewDetails")}
                      <ArrowRight size={14} className="ml-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-4">
            <LoadMoreFade
              loading={loading}
              loaded={safaris.length}
              total={totalItems}
              label="Safaris"
              onLoadMore={loadMore}
              fadeColor="white"
              viewAllHref="/safaris"
            />
          </div>
        )}

        {!hasMore && (
          <div className="flex justify-center mt-6">
            <Link
              href="/safaris"
              className="group w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center shadow-sm hover:shadow-md hover:border-brand-brown transition-all duration-200"
              title={common("viewAll")}
            >
              <ArrowRight size={16} className="text-stone-500 group-hover:text-brand-brown transition-colors" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
