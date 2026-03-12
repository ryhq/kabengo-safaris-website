"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Star, BedDouble, Users, DollarSign, CalendarDays, Clock } from "lucide-react";
import type { ElementType } from "react";

interface AccommodationInfoCardsProps {
  starRating?: number;
  totalRooms?: number;
  maxGuests?: number;
  priceRange?: string;
  bestSeason?: string;
  checkInPolicy?: string;
  checkOutPolicy?: string;
  categoryDisplayName?: string;
}

export default function AccommodationInfoCards({
  starRating, totalRooms, maxGuests, priceRange, bestSeason, checkInPolicy, checkOutPolicy, categoryDisplayName,
}: AccommodationInfoCardsProps) {
  const t = useTranslations("accommodations");
  const items: { icon: ElementType; label: string; value: string }[] = [];

  if (starRating) {
    items.push({ icon: Star, label: t("detail.rating"), value: `${"★".repeat(starRating)}${"☆".repeat(5 - starRating)}` });
  } else if (categoryDisplayName) {
    items.push({ icon: Star, label: t("detail.category"), value: categoryDisplayName });
  }
  if (totalRooms) items.push({ icon: BedDouble, label: t("detail.rooms"), value: `${totalRooms} rooms` });
  if (maxGuests) items.push({ icon: Users, label: t("detail.maxGuests"), value: `${maxGuests} guests` });
  if (priceRange) items.push({ icon: DollarSign, label: t("detail.priceRange"), value: priceRange });
  if (bestSeason) items.push({ icon: CalendarDays, label: t("detail.bestSeason"), value: bestSeason });
  if (checkInPolicy) items.push({ icon: Clock, label: t("detail.checkIn"), value: checkInPolicy });
  if (checkOutPolicy) items.push({ icon: Clock, label: t("detail.checkOut"), value: checkOutPolicy });

  if (items.length === 0) return null;

  return (
    <div className={`grid gap-3 ${
      items.length <= 4 ? `grid-cols-2 sm:grid-cols-${items.length}` : "grid-cols-2 sm:grid-cols-4"
    }`}>
      {items.slice(0, 4).map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-brand-cream rounded-xl p-4"
        >
          <item.icon size={18} className="text-brand-brown mb-2" />
          <p className="text-xs text-stone-400 font-medium">{item.label}</p>
          <p className="text-sm text-stone-700 font-semibold mt-0.5 line-clamp-2">{item.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
