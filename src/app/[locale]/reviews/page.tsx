"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Star, BadgeCheck, Quote, MapPin } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import LoadMoreFade from "@/components/ui/LoadMoreFade";
import SkeletonCard from "@/components/ui/SkeletonCard";
import TestimonyForm from "@/components/testimonials/TestimonyForm";
import { apiClient } from "@/lib/api";

interface TestimonyItem {
  authorName: string;
  authorTitle?: string;
  authorCountry?: string;
  message: string;
  rating: number;
  isVerifiedBooking?: boolean;
  reviewDate?: string;
  primaryImageUrl?: string;
}

const PAGE_SIZE = 3;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TestimonialsPage() {
  const t = useTranslations("testimonials");
  const common = useTranslations("common");
  const locale = useLocale();
  const [testimonies, setTestimonies] = useState<TestimonyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/public/testimonies?page=0&size=${PAGE_SIZE}`, {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) {
          const data = res.data.data;
          setTestimonies(data?.testimonies || data || []);
          setTotalItems(data?.totalItems || 0);
        }
      } catch (err) {
        console.error("Failed to fetch testimonies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasMore = testimonies.length < totalItems;

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res = await apiClient.get(`/public/testimonies?page=${nextPage}&size=${PAGE_SIZE}`, {
        headers: { "Accept-Language": locale },
      });
      if (res.data.success) {
        const data = res.data.data;
        const newItems = data?.testimonies || data || [];
        setTestimonies((prev) => {
          const existingKeys = new Set(prev.map((t) => `${t.authorName}-${t.reviewDate}`));
          const unique = newItems.filter((t: TestimonyItem) => !existingKeys.has(`${t.authorName}-${t.reviewDate}`));
          return [...prev, ...unique];
        });
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more testimonies:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const featured = testimonies.length > 0 ? testimonies[0] : null;
  const rest = testimonies.slice(1);

  return (
    <>
      <PageHero heroPage="TESTIMONIALS" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      {/* Featured Testimonial */}
      {!loading && featured && (
        <section className="py-20 bg-brand-cream">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative text-center"
            >
              <Quote size={56} className="text-brand-brown/10 mx-auto mb-6" />

              <div className="flex justify-center mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={22}
                    className={i < featured.rating ? "text-amber-400 fill-amber-400" : "text-stone-200"}
                  />
                ))}
              </div>

              <blockquote className="text-xl md:text-2xl text-stone-700 leading-relaxed font-serif italic max-w-3xl mx-auto mb-8">
                &ldquo;{featured.message}&rdquo;
              </blockquote>

              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-brand-brown text-white flex items-center justify-center text-lg font-semibold font-serif">
                  {getInitials(featured.authorName)}
                </div>
                <div>
                  <p className="font-semibold text-stone-800 text-lg">{featured.authorName}</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
                    {featured.authorTitle && <span>{featured.authorTitle}</span>}
                    {featured.authorTitle && featured.authorCountry && <span className="text-stone-300">|</span>}
                    {featured.authorCountry && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {featured.authorCountry}
                      </span>
                    )}
                  </div>
                </div>
                {featured.isVerifiedBooking && (
                  <span className="inline-flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full mt-1">
                    <BadgeCheck size={13} className="mr-1" />
                    {t("verified")}
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Remaining Testimonials */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} variant="testimony" />
              ))}
            </div>
          ) : rest.length === 0 && !featured ? (
            <p className="text-center text-stone-500 py-12">{common("noResults")}</p>
          ) : rest.length > 0 ? (
            <>
              <div className={`grid gap-10 ${
                rest.length === 1 ? "grid-cols-1 max-w-xl mx-auto" :
                "grid-cols-1 md:grid-cols-2"
              }`}>
                {rest.map((item, index) => (
                  <motion.div
                    key={`review-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % PAGE_SIZE) * 0.08 }}
                    className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 relative group hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="absolute top-6 right-6">
                      <Quote size={36} className="text-brand-brown/8 group-hover:text-brand-brown/15 transition-colors" />
                    </div>

                    <div className="flex items-center space-x-1 mb-5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className={i < item.rating ? "text-amber-400 fill-amber-400" : "text-stone-200"}
                        />
                      ))}
                    </div>

                    <p className="text-stone-600 text-base leading-relaxed mb-6 font-serif italic">
                      &ldquo;{item.message}&rdquo;
                    </p>

                    <div className="flex items-center gap-4 pt-5 border-t border-stone-100">
                      <div className="w-11 h-11 rounded-full bg-brand-brown/10 text-brand-brown flex items-center justify-center text-sm font-semibold font-serif flex-shrink-0">
                        {getInitials(item.authorName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800">{item.authorName}</p>
                        <div className="flex items-center gap-2 text-xs text-stone-400">
                          {item.authorTitle && <span>{item.authorTitle}</span>}
                          {item.authorTitle && item.authorCountry && <span className="text-stone-300">|</span>}
                          {item.authorCountry && (
                            <span className="flex items-center gap-0.5">
                              <MapPin size={10} />
                              {item.authorCountry}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.isVerifiedBooking && (
                        <span className="flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full flex-shrink-0">
                          <BadgeCheck size={13} className="mr-1" />
                          {t("verified")}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-6">
                  <LoadMoreFade
                    loading={loadingMore}
                    loaded={testimonies.length}
                    total={totalItems}
                    label="Testimonials"
                    onLoadMore={loadMore}
                    fadeColor="white"
                  />
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>

      {/* Submit Testimony Form */}
      <section className="py-20 bg-brand-warm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TestimonyForm />
        </div>
      </section>
    </>
  );
}
