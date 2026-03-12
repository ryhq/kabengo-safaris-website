"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Clock, Calendar, Ruler, Mountain } from "lucide-react";
import type { ElementType } from "react";

interface ParkInfoCardsProps {
  size?: string;
  elevation?: string;
  openingHours?: string;
  bestTimeToVisit?: string;
}

export default function ParkInfoCards({ size, elevation, openingHours, bestTimeToVisit }: ParkInfoCardsProps) {
  const t = useTranslations("parks");
  const items: { icon: ElementType; label: string; value: string }[] = [
    { icon: Ruler, label: t("detail.size"), value: size! },
    { icon: Mountain, label: t("detail.elevation"), value: elevation! },
    { icon: Clock, label: t("detail.hours"), value: openingHours! },
    { icon: Calendar, label: t("detail.bestTime"), value: bestTimeToVisit! },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
