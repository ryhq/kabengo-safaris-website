"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Calendar, Users, MapPin, Route, DollarSign } from "lucide-react";
import type { ElementType } from "react";

interface SafariInfoCardsProps {
  totalDays?: number;
  totalNights?: number;
  totalPaxCount?: number;
  startLocation?: string;
  endLocation?: string;
  price?: string | null;
}

export default function SafariInfoCards({
  totalDays,
  totalNights,
  totalPaxCount,
  startLocation,
  endLocation,
  price,
}: SafariInfoCardsProps) {
  const t = useTranslations("safaris");
  const items: { icon: ElementType; label: string; value: string }[] = [
    totalDays ? { icon: Calendar, label: t("detail.duration"), value: `${totalDays} Days${totalNights ? ` / ${totalNights} Nights` : ""}` } : null,
    totalPaxCount ? { icon: Users, label: t("detail.groupSize"), value: `${totalPaxCount} Travelers` } : null,
    startLocation ? { icon: MapPin, label: t("detail.start"), value: startLocation } : null,
    endLocation ? { icon: Route, label: t("detail.end"), value: endLocation } : null,
    price ? { icon: DollarSign, label: t("detail.from"), value: price } : null,
  ].filter(Boolean) as { icon: ElementType; label: string; value: string }[];

  if (items.length === 0) return null;

  return (
    <div className={`grid grid-cols-2 ${items.length >= 5 ? "sm:grid-cols-3 lg:grid-cols-5" : items.length >= 4 ? "sm:grid-cols-4" : items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}>
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-brand-cream rounded-xl p-4"
        >
          <item.icon size={18} className="text-brand-green mb-2" />
          <p className="text-xs text-stone-400 font-medium">{item.label}</p>
          <p className="text-sm text-stone-700 font-semibold mt-0.5">{item.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
