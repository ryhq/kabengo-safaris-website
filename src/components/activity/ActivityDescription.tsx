"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

interface ActivityDescriptionProps {
  description?: string;
  detailedDescription?: string;
  safetyInformation?: string;
  tags?: string;
  featuredImage?: string;
  activityName?: string;
}

export default function ActivityDescription({
  description, detailedDescription, safetyInformation, tags, featuredImage, activityName,
}: ActivityDescriptionProps) {
  const t = useTranslations("activities");
  let parsedTags: string[] = [];
  if (tags) {
    try {
      const parsed = JSON.parse(tags);
      parsedTags = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }

  const hasContent = description || detailedDescription || safetyInformation;
  if (!hasContent && parsedTags.length === 0) return null;

  return (
    <div className="space-y-14">
      {(description || detailedDescription || featuredImage) && (
        <div className={`grid gap-10 items-start ${featuredImage ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          <div>
            {description && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-xl text-stone-700 leading-relaxed mb-6 border-l-4 border-brand-green pl-5 font-serif italic"
              >
                {description}
              </motion.p>
            )}

            {detailedDescription && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-stone-600 leading-relaxed whitespace-pre-line text-base"
              >
                {detailedDescription}
              </motion.p>
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
                alt={activityName || "Activity"}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>
          )}
        </div>
      )}

      {safetyInformation && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl p-6 shadow-sm border border-stone-100"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={20} className="text-brand-green" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800 font-serif">{t("detail.safetyInfo")}</h3>
          </div>
          <p className="text-stone-600 leading-relaxed whitespace-pre-line text-sm">{safetyInformation}</p>
        </motion.div>
      )}

      {parsedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {parsedTags.map((tag: string) => (
            <span key={tag} className="text-xs bg-white/80 text-stone-600 px-3 py-1.5 rounded-full border border-stone-200">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
