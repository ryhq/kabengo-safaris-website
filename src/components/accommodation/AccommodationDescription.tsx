"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Sparkles, ConciergeBell, MapPinned } from "lucide-react";

interface AccommodationDescriptionProps {
  shortDescription?: string;
  details?: string;
  amenities?: string;
  services?: string;
  nearbyAttractions?: string;
  tags?: string;
  featuredImage?: string;
  accommodationName?: string;
}

export default function AccommodationDescription({
  shortDescription, details, amenities, services, nearbyAttractions, tags, featuredImage, accommodationName,
}: AccommodationDescriptionProps) {
  const t = useTranslations("accommodations");
  const parsedTags = tags ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [];

  const hasContent = shortDescription || details || amenities || services || nearbyAttractions;
  if (!hasContent && parsedTags.length === 0) return null;

  const detailSections = [
    { icon: Sparkles, title: t("detail.amenities"), content: amenities },
    { icon: ConciergeBell, title: t("detail.services"), content: services },
    { icon: MapPinned, title: t("detail.nearbyAttractions"), content: nearbyAttractions },
  ].filter((s) => s.content);

  return (
    <div className="space-y-14">
      {(shortDescription || details || featuredImage) && (
        <div className={`grid gap-10 items-start ${featuredImage ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          <div>
            {shortDescription && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-xl text-stone-700 leading-relaxed mb-6 border-l-4 border-brand-brown pl-5 font-serif italic"
              >
                {shortDescription}
              </motion.p>
            )}

            {details && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-stone-600 leading-relaxed whitespace-pre-line text-base"
                dangerouslySetInnerHTML={{ __html: details }}
              />
            )}
          </div>

          {featuredImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="relative rounded-2xl overflow-hidden shadow-xl h-[300px] lg:h-[400px]"
            >
              <Image
                src={featuredImage}
                alt={accommodationName || "Accommodation"}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>
          )}
        </div>
      )}

      {detailSections.length > 0 && (
        <div className={`grid gap-6 ${
          detailSections.length === 1 ? "grid-cols-1 max-w-2xl" :
          detailSections.length === 2 ? "grid-cols-1 md:grid-cols-2" :
          "grid-cols-1 md:grid-cols-3"
        }`}>
          {detailSections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-stone-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-brand-brown/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <section.icon size={20} className="text-brand-brown" />
                </div>
                <h3 className="text-lg font-semibold text-stone-800 font-serif">{section.title}</h3>
              </div>
              <p className="text-stone-600 leading-relaxed whitespace-pre-line text-sm">{section.content}</p>
            </motion.div>
          ))}
        </div>
      )}

      {parsedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {parsedTags.map((tag) => (
            <span key={tag} className="text-xs bg-white/80 text-stone-600 px-3 py-1.5 rounded-full border border-stone-200">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
