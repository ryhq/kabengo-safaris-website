"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import LoadMoreFade from "@/components/ui/LoadMoreFade";
import { fetchActivitiesPaginated } from "@/lib/api";

interface ActivityItem {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  primaryImageUrl?: string;
}

interface ActivitiesSectionProps {
  initialActivities: ActivityItem[];
  totalItems: number;
}

const PAGE_SIZE = 6;

export default function ActivitiesSection({ initialActivities, totalItems }: ActivitiesSectionProps) {
  const t = useTranslations("home");
  const common = useTranslations("common");
  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    const seen = new Set<string>();
    return initialActivities.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const hasMore = activities.length < totalItems;

  const loadMore = async () => {
    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      const data = await fetchActivitiesPaginated(nextPage, PAGE_SIZE);
      setActivities((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const newItems = data.activities.filter((a) => !existingIds.has(a.id));
        return [...prev, ...newItems];
      });
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Failed to load more activities:", err);
    } finally {
      setLoading(false);
    }
  };

  if (activities.length === 0) return null;

  return (
    <section className="py-20 bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t("activitiesTitle")} subtitle={t("activitiesSubtitle")} />

        <div className={`grid gap-6 mt-12 ${
          activities.length === 1 ? "grid-cols-1 max-w-md mx-auto" :
          activities.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto" :
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}>
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/activities/${activity.slug || activity.id}`}
                className="group block bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="h-44 bg-gradient-to-br from-brand-green/20 to-brand-brown/10 overflow-hidden relative">
                  <img
                    src={activity.primaryImageUrl || "/images/placeholders/activity.svg"}
                    alt={activity.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-stone-800 group-hover:text-brand-green transition-colors font-serif">
                    {activity.name}
                  </h3>
                  {activity.description && (
                    <p className="text-sm text-stone-500 mt-1 line-clamp-2">{activity.description}</p>
                  )}
                  <span className="inline-flex items-center text-sm font-medium text-brand-green mt-3 group-hover:translate-x-1 transition-transform">
                    {common("learnMore")}
                    <ArrowRight size={14} className="ml-1" />
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
              loaded={activities.length}
              total={totalItems}
              label="Activities"
              onLoadMore={loadMore}
              fadeColor="cream"
              viewAllHref="/activities"
            />
          </div>
        )}

        {!hasMore && (
          <div className="flex justify-center mt-6">
            <Link
              href="/activities"
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
