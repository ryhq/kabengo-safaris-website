"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import { apiClient } from "@/lib/api";

interface GalleryImage {
  imageUrl: string;
  altText?: string;
  caption?: string;
  imageType?: string;
  entityType: "PARK" | "ACTIVITY" | "ACCOMMODATION";
  entityName: string;
  entitySlug: string;
}

interface GalleryCounts {
  parks: number;
  activities: number;
  accommodations: number;
  total: number;
}

type FilterType = "ALL" | "PARK" | "ACTIVITY" | "ACCOMMODATION";

const ENTITY_ROUTE_MAP: Record<string, string> = {
  PARK: "parks",
  ACTIVITY: "activities",
  ACCOMMODATION: "accommodations",
};

const ENTITY_LABEL_MAP: Record<string, string> = {
  PARK: "Park",
  ACTIVITY: "Activity",
  ACCOMMODATION: "Accommodation",
};

export default function GalleryPage() {
  const t = useTranslations("gallery");
  const common = useTranslations("common");
  const locale = useLocale();

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [counts, setCounts] = useState<GalleryCounts>({ parks: 0, activities: 0, accommodations: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fetchGallery = useCallback(async (filter: FilterType, pageNum: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: pageNum, size: 24 };
      if (filter !== "ALL") params.entityType = filter;

      const res = await apiClient.get("/public/gallery", {
        params,
        headers: { "Accept-Language": locale },
      });

      if (res.data.success) {
        const data = res.data.data;
        setImages(data.images || []);
        setTotalPages(data.totalPages || 0);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchGallery(activeFilter, page);
  }, [activeFilter, page, fetchGallery]);

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setPage(0);
  };

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "ALL", label: t("all"), count: counts.total },
    { key: "PARK", label: t("parks"), count: counts.parks },
    { key: "ACTIVITY", label: t("activities"), count: counts.activities },
    { key: "ACCOMMODATION", label: t("accommodations"), count: counts.accommodations },
  ];

  return (
    <>
      <PageHero heroPage="GALLERY" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => handleFilterChange(filter.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeFilter === filter.key
                    ? "bg-brand-brown text-white shadow-lg shadow-brand-brown/25"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span className={`ml-2 text-xs ${
                    activeFilter === filter.key ? "text-white/70" : "text-stone-400"
                  }`}>
                    ({filter.count})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`bg-stone-100 rounded-lg animate-pulse ${
                  i % 5 === 0 ? "h-80" : i % 3 === 0 ? "h-72" : "h-64"
                }`} />
              ))}
            </div>
          ) : images.length === 0 ? (
            <p className="text-center text-stone-500 py-16 text-lg">{common("noResults")}</p>
          ) : (
            <>
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                <AnimatePresence mode="popLayout">
                  {images.map((image, index) => (
                    <motion.div
                      key={image.imageUrl}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      className="group relative rounded-lg overflow-hidden break-inside-avoid cursor-pointer"
                      onClick={() => setLightboxIndex(index)}
                    >
                      <Image
                        src={image.imageUrl}
                        alt={image.altText || image.entityName}
                        width={600}
                        height={400}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                            image.entityType === "PARK"
                              ? "bg-emerald-500/90 text-white"
                              : image.entityType === "ACTIVITY"
                              ? "bg-amber-500/90 text-white"
                              : "bg-sky-500/90 text-white"
                          }`}>
                            {ENTITY_LABEL_MAP[image.entityType]}
                          </span>
                          <p className="text-white font-medium text-sm leading-tight">{image.entityName}</p>
                          {image.caption && (
                            <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{image.caption}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {common("previous")}
                  </button>
                  <span className="text-sm text-stone-500">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {common("next")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && images[lightboxIndex] && (() => {
          const img = images[lightboxIndex];
          const hasPrev = lightboxIndex > 0;
          const hasNext = lightboxIndex < images.length - 1;

          const goNext = (e?: React.MouseEvent) => {
            e?.stopPropagation();
            if (hasNext) setLightboxIndex(lightboxIndex + 1);
          };
          const goPrev = (e?: React.MouseEvent) => {
            e?.stopPropagation();
            if (hasPrev) setLightboxIndex(lightboxIndex - 1);
          };
          const close = () => setLightboxIndex(null);

          return (
            <motion.div
              key="lightbox-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95"
              onClick={close}
              onKeyDown={(e) => {
                if (e.key === "Escape") close();
                if (e.key === "ArrowRight") goNext();
                if (e.key === "ArrowLeft") goPrev();
              }}
              tabIndex={0}
              role="dialog"
              ref={(el) => el?.focus()}
            >
              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                    img.entityType === "PARK"
                      ? "bg-emerald-500/90 text-white"
                      : img.entityType === "ACTIVITY"
                      ? "bg-amber-500/90 text-white"
                      : "bg-sky-500/90 text-white"
                  }`}>
                    {ENTITY_LABEL_MAP[img.entityType]}
                  </span>
                  <span className="text-white font-medium text-sm sm:text-base">{img.entityName}</span>
                  {img.imageType && (
                    <span className="text-white/40 text-xs hidden sm:inline">— {img.imageType}</span>
                  )}
                </div>
                <button
                  onClick={close}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Image area */}
              <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-16 py-20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={img.imageUrl}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full h-full flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      src={img.imageUrl}
                      alt={img.altText || img.entityName}
                      width={1400}
                      height={900}
                      sizes="95vw"
                      className="max-w-full max-h-full object-contain rounded-lg select-none"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation arrows */}
              {hasPrev && (
                <button
                  onClick={goPrev}
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              {hasNext && (
                <button
                  onClick={goNext}
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              )}

              {/* Bottom bar */}
              <div className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-6 py-4 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                {/* Counter */}
                <span className="text-white/50 text-sm font-medium tabular-nums">
                  {lightboxIndex + 1} / {images.length}
                </span>

                {/* View entity link */}
                <Link
                  href={`/${locale}/${ENTITY_ROUTE_MAP[img.entityType]}/${img.entitySlug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium transition-all"
                  onClick={close}
                >
                  {t("viewEntity", { entity: ENTITY_LABEL_MAP[img.entityType] })}
                  <ExternalLink size={14} />
                </Link>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}
