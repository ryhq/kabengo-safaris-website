"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import PageHero from "@/components/ui/PageHero";
import { apiClient } from "@/lib/api";

interface ActivityItem {
  id: string;
  name: string;
  primaryImageUrl?: string;
}

export default function GalleryPage() {
  const t = useTranslations("gallery");
  const common = useTranslations("common");
  const locale = useLocale();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get("/public/activities", {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) setActivities(res.data.data?.activities || res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch activities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <PageHero heroPage="GALLERY" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-stone-100 rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-center text-stone-500 py-12">{common("noResults")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded-lg overflow-hidden cursor-pointer"
                >
                  <div className="h-64 bg-gradient-to-br from-brand-green/10 to-brand-brown/10">
                    {activity.primaryImageUrl ? (
                      <img
                        src={activity.primaryImageUrl}
                        alt={activity.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
                        {activity.name}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                    <div className="p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-white font-medium text-sm">{activity.name}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
