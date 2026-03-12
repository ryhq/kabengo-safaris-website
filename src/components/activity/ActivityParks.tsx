"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { TreePine, ArrowRight } from "lucide-react";
import LoadMoreFade from "@/components/ui/LoadMoreFade";

interface ParkItem {
  id: string;
  slug?: string;
  name: string;
  shortDescription?: string;
  region?: string;
  primaryImageUrl?: string;
}

interface ActivityParksProps {
  parks: ParkItem[];
  totalParks: number;
  loadingMore: boolean;
  onLoadMore: () => void;
  pageSize: number;
}

export default function ActivityParks({ parks, totalParks, loadingMore, onLoadMore, pageSize }: ActivityParksProps) {
  const common = useTranslations("common");
  const t = useTranslations("activities");

  if (parks.length === 0) return null;

  const hasMore = parks.length < totalParks;

  return (
    <div>
      <h2 className="text-2xl font-bold text-stone-800 font-serif mb-6">{t("parksOffering")}</h2>

      <div className={`grid gap-5 ${
        parks.length === 1 ? "grid-cols-1 max-w-md" :
        parks.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-3xl" :
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      }`}>
        {parks.map((park, index) => (
          <motion.div
            key={park.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (index % pageSize) * 0.05 }}
          >
            <Link
              href={`/parks/${park.slug || park.id}`}
              className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100"
            >
              <div className="h-48 bg-gradient-to-br from-brand-green/20 to-brand-brown/10 overflow-hidden relative">
                {park.primaryImageUrl ? (
                  <img src={park.primaryImageUrl} alt={park.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TreePine size={48} className="text-brand-green/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-stone-800 group-hover:text-brand-green transition-colors font-serif">
                  {park.name}
                </h3>
                {park.region && (
                  <p className="text-xs text-stone-400 mt-1">{park.region}</p>
                )}
                {park.shortDescription && (
                  <p className="text-sm text-stone-500 mt-2 line-clamp-2 leading-relaxed">{park.shortDescription}</p>
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
            total={totalParks}
            label="Parks"
            onLoadMore={onLoadMore}
            fadeColor="white"
          />
        </div>
      )}
    </div>
  );
}
