"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { PawPrint, Leaf, TreePine, History, Route } from "lucide-react";
import type { ElementType } from "react";

interface ParkDescriptionProps {
  shortDescription?: string;
  fullDescription?: string;
  wildlife?: string;
  vegetation?: string;
  ecosystem?: string;
  history?: string;
  accessInformation?: string;
  tags?: string;
  featuredImage?: string;
  parkName?: string;
}

export default function ParkDescription({
  shortDescription, fullDescription, wildlife, vegetation, ecosystem, history, accessInformation, tags, featuredImage, parkName,
}: ParkDescriptionProps) {
  const t = useTranslations("parks");
  const parsedTags = tags?.split(",").map((tag) => tag.trim()).filter(Boolean) || [];

  const hasContent = shortDescription || fullDescription || wildlife || vegetation || ecosystem || history || accessInformation;
  if (!hasContent && parsedTags.length === 0) return null;

  return (
    <div className="space-y-14">
      {/* Top section: short description + featured image side by side */}
      {(shortDescription || fullDescription || featuredImage) && (
        <div className={`grid gap-10 items-start ${featuredImage ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          <div>
            {shortDescription && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-xl text-stone-700 leading-relaxed mb-6 border-l-4 border-brand-green pl-5 font-serif italic"
              >
                {shortDescription}
              </motion.p>
            )}

            {fullDescription && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-stone-600 leading-relaxed whitespace-pre-line text-base"
              >
                {fullDescription}
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
                alt={parkName || "Park"}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>
          )}
        </div>
      )}

      {/* Detail sections — two-column grid on larger screens */}
      {(wildlife || vegetation || ecosystem || history || accessInformation) && (
        <div className="grid gap-8 sm:grid-cols-2">
          {wildlife && <DetailCard icon={PawPrint} title={t("detail.wildlife")} content={wildlife} />}
          {vegetation && <DetailCard icon={Leaf} title={t("detail.vegetation")} content={vegetation} />}
          {ecosystem && <DetailCard icon={TreePine} title={t("detail.ecosystem")} content={ecosystem} />}
          {history && <DetailCard icon={History} title={t("detail.history")} content={history} />}
          {accessInformation && <DetailCard icon={Route} title={t("detail.gettingThere")} content={accessInformation} />}
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

function DetailCard({ icon: Icon, title, content }: { icon: ElementType; title: string; content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-xl p-6 shadow-sm border border-stone-100"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-brand-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-brand-green" />
        </div>
        <h3 className="text-lg font-semibold text-stone-800 font-serif">{title}</h3>
      </div>
      <p className="text-stone-600 leading-relaxed whitespace-pre-line text-sm">{content}</p>
    </motion.div>
  );
}
