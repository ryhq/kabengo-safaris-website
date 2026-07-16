"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import LoadMoreFade from "@/components/ui/LoadMoreFade";
import SafariCard, { type SafariCardData } from "@/components/safari/SafariCard";
import { fetchSafarisPaginated } from "@/lib/api";

interface SafarisSectionProps {
  initialSafaris: SafariCardData[];
  totalItems: number;
}

const PAGE_SIZE = 6;

export default function SafarisSection({ initialSafaris, totalItems }: SafarisSectionProps) {
  const t = useTranslations("home");
  const common = useTranslations("common");
  const [safaris, setSafaris] = useState<SafariCardData[]>(() => {
    const seen = new Set<string>();
    return initialSafaris.filter((s) => {
      if (seen.has(s.code)) return false;
      seen.add(s.code);
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
        const existingCodes = new Set(prev.map((s) => s.code));
        const newItems = data.safaris.filter((s) => !existingCodes.has(s.code));
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
              key={safari.code}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <SafariCard safari={safari} />
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
