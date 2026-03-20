"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Star, Quote, BadgeCheck, ArrowRight, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import SectionHeading from "@/components/ui/SectionHeading";
import LoadMoreFade from "@/components/ui/LoadMoreFade";
import { fetchTestimoniesPaginated } from "@/lib/api";

interface TestimonyItem {
  authorName: string;
  authorTitle?: string;
  authorCountry?: string;
  message: string;
  rating: number;
  isVerifiedBooking?: boolean;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface TestimonialsSectionProps {
  initialTestimonies: TestimonyItem[];
  totalItems: number;
}

const PAGE_SIZE = 3;

export default function TestimonialsSection({ initialTestimonies, totalItems }: TestimonialsSectionProps) {
  const t = useTranslations("home");
  const test = useTranslations("testimonials");
  const [testimonies, setTestimonies] = useState<TestimonyItem[]>(() => {
    const seen = new Set<string>();
    return initialTestimonies.filter((t) => {
      const key = t.authorName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const hasMore = testimonies.length < totalItems;

  const loadMore = async () => {
    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      const data = await fetchTestimoniesPaginated(nextPage, PAGE_SIZE);
      setTestimonies((prev) => {
        const existingKeys = new Set(prev.map((t) => t.authorName));
        const newItems = data.testimonies.filter((t) => !existingKeys.has(t.authorName));
        return [...prev, ...newItems];
      });
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Failed to load more testimonies:", err);
    } finally {
      setLoading(false);
    }
  };

  if (testimonies.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t("testimonialsTitle")} subtitle={t("testimonialsSubtitle")} />

        <div className={`grid gap-8 mt-12 ${
          testimonies.length === 1 ? "grid-cols-1 max-w-md mx-auto" :
          testimonies.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto" :
          "grid-cols-1 md:grid-cols-3"
        }`}>
          {testimonies.map((item, index) => (
            <motion.div
              key={`review-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
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

              <p className="text-stone-600 text-base leading-relaxed line-clamp-5 mb-6 font-serif italic">
                &ldquo;{item.message}&rdquo;
              </p>

              <div className="pt-5 border-t border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-brand-brown/10 text-brand-brown flex items-center justify-center text-sm font-semibold font-serif flex-shrink-0">
                    {getInitials(item.authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                      <p className="font-semibold text-stone-800">{item.authorName}</p>
                      {item.isVerifiedBooking && (
                        <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                          <BadgeCheck size={12} className="mr-0.5" />
                          {test("verified")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
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
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-4">
            <LoadMoreFade
              loading={loading}
              loaded={testimonies.length}
              total={totalItems}
              label="Testimonials"
              onLoadMore={loadMore}
              fadeColor="white"
              viewAllHref="/reviews"
            />
          </div>
        )}

        {!hasMore && (
          <div className="flex justify-center mt-6">
            <Link
              href="/reviews"
              className="group w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center shadow-sm hover:shadow-md hover:border-brand-green transition-all duration-200"
              title={test("title")}
            >
              <ArrowRight size={16} className="text-stone-500 group-hover:text-brand-green transition-colors" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
