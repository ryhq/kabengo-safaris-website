"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import LoadMoreFade from "@/components/ui/LoadMoreFade";

interface ParkImage {
  id: string;
  imageUrl: string;
  altText?: string;
  caption?: string;
  imageType?: string;
}

interface ParkGalleryProps {
  images: ParkImage[];
  parkName: string;
  totalImages: number;
  loadingMore: boolean;
  onLoadMore: () => void;
}

export default function ParkGallery({ images, parkName, totalImages, loadingMore, onLoadMore }: ParkGalleryProps) {
  const t = useTranslations("parks");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const hasMore = images.length < totalImages;

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () => setLightboxIndex((prev) => (prev! + 1) % images.length);
  const prevImage = () => setLightboxIndex((prev) => (prev! - 1 + images.length) % images.length);

  return (
    <div>
      <h2 className="text-2xl font-bold text-stone-800 font-serif mb-6">{t("detail.gallery")}</h2>

      {/* Visual grid — first image large, rest in grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <motion.button
            key={img.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 6) * 0.05 }}
            onClick={() => openLightbox(i)}
            className={`relative group rounded-xl overflow-hidden cursor-pointer ${
              i === 0 ? "col-span-2 row-span-2 h-[300px] sm:h-[400px]" : "h-[180px] sm:h-[200px]"
            }`}
          >
            <img
              src={img.imageUrl}
              alt={img.altText || `${parkName}${img.imageType ? ` - ${img.imageType}` : ""}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Expand size={24} className="text-white" />
            </div>
            {img.imageType && (
              <span className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {img.imageType}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-6">
          <LoadMoreFade
            loading={loadingMore}
            loaded={images.length}
            total={totalImages}
            label="Images"
            onLoadMore={onLoadMore}
            fadeColor="white"
          />
        </div>
      )}

      {/* Lightbox overlay */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10 cursor-pointer"
            >
              <X size={20} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10 cursor-pointer"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10 cursor-pointer"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <motion.img
              key={images[lightboxIndex].id}
              src={images[lightboxIndex].imageUrl}
              alt={images[lightboxIndex].altText || parkName}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
