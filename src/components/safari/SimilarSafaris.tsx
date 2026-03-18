"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Clock, MapPin, ArrowRight, Star } from "lucide-react";
import { fetchSafarisPaginated } from "@/lib/api";
import type { Itinerary } from "@/types";

interface SimilarSafarisProps {
  currentId: string;
  tripType?: string;
  budgetCategory?: string;
}

export default function SimilarSafaris({ currentId, tripType, budgetCategory }: SimilarSafarisProps) {
  const t = useTranslations("safaris");
  const locale = useLocale();
  const [safaris, setSafaris] = useState<Itinerary[]>([]);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        // Try matching by trip type first, then fallback to budget category
        const data = await fetchSafarisPaginated(0, 10, {
          tripType: tripType || undefined,
        });
        let list = (data?.safaris || []).filter((s) => s.id !== currentId && s.code !== currentId);

        // If not enough results, try budget category
        if (list.length < 3 && budgetCategory) {
          const data2 = await fetchSafarisPaginated(0, 10, {
            budgetCategory,
          });
          const extra = (data2?.safaris || []).filter(
            (s) => s.id !== currentId && s.code !== currentId && !list.some((l) => l.id === s.id)
          );
          list = [...list, ...extra];
        }

        // If still not enough, get any safaris
        if (list.length < 3) {
          const data3 = await fetchSafarisPaginated(0, 10, {});
          const extra = (data3?.safaris || []).filter(
            (s) => s.id !== currentId && s.code !== currentId && !list.some((l) => l.id === s.id)
          );
          list = [...list, ...extra];
        }

        setSafaris(list.slice(0, 4));
      } catch {
        // Silently fail
      }
    };
    fetchSimilar();
  }, [currentId, tripType, budgetCategory]);

  if (safaris.length === 0) return null;

  const getPriceInfo = (item: Itinerary) => {
    if (!item.costSummary || item.costSummary.length === 0) return null;
    const cost = item.costSummary[0];
    if (!cost.grandTotalRack) return null;
    const totalPax = item.totalPaxCount || 1;
    const perPerson = cost.grandTotalRack / totalPax;
    const currency = cost.currency || "USD";
    const wasPrice = Math.ceil(perPerson * 1.3);
    return { currency, perPerson: Math.ceil(perPerson), wasPrice };
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-brand-green font-semibold text-sm uppercase tracking-widest mb-2">
            {t("detail.similarSafaris")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-stone-800 font-serif">
            {t("detail.similarSafarisSubtitle")}
          </h2>
        </div>

        {/* Cards grid */}
        <div className={`grid gap-6 ${
          safaris.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
          safaris.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto" :
          safaris.length === 3 ? "grid-cols-1 md:grid-cols-3" :
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }`}>
          {safaris.map((safari, index) => {
            const priceInfo = getPriceInfo(safari);
            const identifier = safari.code || safari.id;
            const duration = safari.isDayTrip
              ? t("dayTrip")
              : safari.totalDays
                ? t("daysNights", { days: safari.totalDays, nights: safari.totalNights || safari.totalDays - 1 })
                : null;

            return (
              <motion.div
                key={safari.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={`/safaris/${identifier}`}
                  className="group block bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    {safari.primaryImageUrl ? (
                      <img
                        src={safari.primaryImageUrl}
                        alt={safari.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-green/20 to-brand-brown/20 flex items-center justify-center">
                        <Star className="w-10 h-10 text-brand-green/30" />
                      </div>
                    )}

                    {/* Duration badge */}
                    {duration && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {duration}
                      </div>
                    )}

                    {/* Trip type badge */}
                    {safari.tripTypeDisplayName && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-brand-green/90 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                        {safari.tripTypeDisplayName}
                      </div>
                    )}

                    {/* Price overlay */}
                    {priceInfo && (
                      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
                        <div className="flex items-baseline gap-1">
                          <span className="text-stone-400 line-through text-xs">
                            {priceInfo.currency} {priceInfo.wasPrice.toLocaleString()}
                          </span>
                          <span className="text-brand-green font-bold text-sm">
                            {priceInfo.currency} {priceInfo.perPerson.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400">{t("detail.perPerson")}</p>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-stone-800 font-serif text-base leading-snug group-hover:text-brand-green transition-colors line-clamp-2 mb-2">
                      {safari.name}
                    </h3>

                    {safari.startLocation && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-3">
                        <MapPin className="w-3 h-3" />
                        <span>{safari.startLocation}</span>
                        {safari.endLocation && safari.endLocation !== safari.startLocation && (
                          <>
                            <ArrowRight className="w-3 h-3" />
                            <span>{safari.endLocation}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Budget badge */}
                    {safari.budgetCategoryDisplayName && (
                      <span className="inline-block px-2.5 py-0.5 bg-stone-50 text-stone-500 text-xs rounded-full font-medium">
                        {safari.budgetCategoryDisplayName}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View all link */}
        <div className="flex justify-center mt-10">
          <Link
            href="/safaris"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-brand-green/10 hover:bg-brand-green text-brand-green hover:text-white font-semibold rounded-xl transition-all duration-300 text-sm"
          >
            {t("detail.viewAllSafaris")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
