"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Users, UserCheck, CalendarDays, Wrench } from "lucide-react";
import type { ElementType } from "react";

interface ActivityInfoCardsProps {
  seasonAvailability?: string;
  minimumAge?: number;
  maximumParticipants?: number;
  equipmentRequired?: string;
}

export default function ActivityInfoCards({ seasonAvailability, minimumAge, maximumParticipants, equipmentRequired }: ActivityInfoCardsProps) {
  const t = useTranslations("activities");
  const items: { icon: ElementType; label: string; value: string }[] = [
    { icon: CalendarDays, label: t("detail.season"), value: seasonAvailability! },
    { icon: UserCheck, label: t("detail.minAge"), value: minimumAge != null ? `${minimumAge}+` : "" },
    { icon: Users, label: t("detail.maxGroup"), value: maximumParticipants != null ? `${maximumParticipants} people` : "" },
    { icon: Wrench, label: t("detail.equipment"), value: equipmentRequired! },
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
          <p className="text-sm text-stone-700 font-semibold mt-0.5 line-clamp-2">{item.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
