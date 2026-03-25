"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, ArrowRight, Star } from "lucide-react";
import { apiClient } from "@/lib/api";

interface NearbyAccommodation {
  slug: string;
  name: string;
  region?: string;
  accommodationTypeDisplayName?: string;
  starRating?: number;
  priceRange?: string;
  primaryImageUrl?: string;
}

interface NearbyAccommodationsProps {
  currentSlug: string;
  region?: string;
}

export default function NearbyAccommodations({ currentSlug, region }: NearbyAccommodationsProps) {
  const t = useTranslations("accommodations");
  const locale = useLocale();
  const [accommodations, setAccommodations] = useState<NearbyAccommodation[]>([]);

  useEffect(() => {
    const fetchNearby = async () => {
      try {
        const params = new URLSearchParams({ page: "0", size: "8" });
        if (region) params.set("keyword", region);
        const res = await apiClient.get(`/public/accommodations?${params}`, {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) {
          let list = (res.data.data?.accommodations || []).filter(
            (a: NearbyAccommodation) => a.slug !== currentSlug
          );

          // If not enough from region, fetch any
          if (list.length < 2) {
            const res2 = await apiClient.get("/public/accommodations?page=0&size=8", {
              headers: { "Accept-Language": locale },
            });
            if (res2.data.success) {
              const extra = (res2.data.data?.accommodations || []).filter(
                (a: NearbyAccommodation) => a.slug !== currentSlug && !list.some((l: NearbyAccommodation) => l.slug === a.slug)
              );
              list = [...list, ...extra];
            }
          }

          setAccommodations(list.slice(0, 4));
        }
      } catch {
        // Silently fail
      }
    };
    fetchNearby();
  }, [currentSlug, region, locale]);

  if (accommodations.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-brand-green font-semibold text-sm uppercase tracking-widest mb-2">
            {t("detail.nearbyAccommodations")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-stone-800 font-serif">
            {t("detail.nearbyAccommodationsSubtitle")}
          </h2>
        </div>

        <div className={`grid gap-6 ${
          accommodations.length <= 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto" :
          accommodations.length === 3 ? "grid-cols-1 md:grid-cols-3" :
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }`}>
          {accommodations.map((acc, index) => (
            <motion.div
              key={acc.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/accommodations/${acc.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-52 overflow-hidden">
                  {acc.primaryImageUrl ? (
                    <Image
                      src={acc.primaryImageUrl}
                      alt={acc.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-green/20 to-brand-brown/20 flex items-center justify-center">
                      <Star className="w-10 h-10 text-brand-green/30" />
                    </div>
                  )}

                  {acc.accommodationTypeDisplayName && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-brand-green/90 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                      {acc.accommodationTypeDisplayName}
                    </div>
                  )}

                  {acc.priceRange && (
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
                      <span className="text-brand-green font-bold text-sm">{acc.priceRange}</span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-stone-800 font-serif text-base leading-snug group-hover:text-brand-green transition-colors line-clamp-2 mb-2">
                    {acc.name}
                  </h3>
                  {acc.region && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-3">
                      <MapPin className="w-3 h-3" />
                      <span>{acc.region}</span>
                    </div>
                  )}
                  {acc.starRating && acc.starRating > 0 && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: acc.starRating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link
            href="/accommodations"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-brand-green/10 hover:bg-brand-green text-brand-green hover:text-white font-semibold rounded-xl transition-all duration-300 text-sm"
          >
            {t("detail.viewAllAccommodations")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
