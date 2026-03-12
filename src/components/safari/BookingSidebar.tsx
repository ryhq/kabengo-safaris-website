"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  MapPin,
  Route,
  Phone,
  Shield,
  Clock,
  Star,
  ArrowRight,
} from "lucide-react";

interface BookingSidebarProps {
  safariCode: string;
  safariName: string;
  totalDays?: number;
  totalNights?: number;
  totalPaxCount?: number;
  startLocation?: string;
  endLocation?: string;
  price?: string | null;
}

export default function BookingSidebar({
  safariCode,
  safariName,
  totalDays,
  totalNights,
  startLocation,
  price,
}: BookingSidebarProps) {
  const t = useTranslations("safaris");
  const common = useTranslations("common");

  return (
    <div className="sticky top-28 h-full flex flex-col">
      {/* Price header */}
      {price && (
        <div className="bg-brand-green px-6 py-5">
          <p className="text-white/70 text-xs font-medium">{t("detail.from")}</p>
          <p className="text-white text-2xl font-bold font-serif">{price}</p>
          {totalDays && (
            <p className="text-white/60 text-xs mt-0.5">
              {totalDays} {t("detail.days")} {totalNights ? `/ ${totalNights} ${t("detail.nights")}` : ""}
            </p>
          )}
        </div>
      )}

      <div className="p-6 space-y-5 flex-1 flex flex-col">
        {/* Quick facts */}
        <div className="space-y-3">
          {totalDays && !price && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-brand-green flex-shrink-0" />
              <span className="text-stone-600">
                {totalDays} {t("detail.days")} {totalNights ? `/ ${totalNights} ${t("detail.nights")}` : ""}
              </span>
            </div>
          )}
          {startLocation && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={16} className="text-brand-green flex-shrink-0" />
              <span className="text-stone-600">{startLocation}</span>
            </div>
          )}
        </div>

        {/* Book Now — primary CTA */}
        <Link
          href={`/book?safari=${safariCode}`}
          className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green/90 transition-all shadow-md shadow-brand-green/15 text-sm"
        >
          <Calendar size={16} />
          {common("bookNow")}
          <ArrowRight size={16} />
        </Link>

        {/* Inquire — secondary CTA */}
        <Link
          href="/contact"
          className="flex items-center justify-center gap-2 w-full px-6 py-3 text-stone-600 font-medium border border-stone-200 rounded-xl hover:bg-stone-50 transition-all text-sm"
        >
          <Phone size={16} />
          {t("detail.inquire")}
        </Link>

        {/* Trust signals */}
        <div className="pt-4 mt-auto border-t border-stone-100 space-y-2.5">
          {[
            { icon: Shield, text: t("detail.trustSafe") },
            { icon: Clock, text: t("detail.trustResponse") },
            { icon: Star, text: t("detail.trustExpert") },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <item.icon size={13} className="text-brand-green/60 flex-shrink-0" />
              <span className="text-xs text-stone-400">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Mobile-only sticky bottom bar */
export function MobileBookingBar({
  safariCode,
  safariName,
  price,
}: {
  safariCode: string;
  safariName: string;
  price?: string | null;
}) {
  const common = useTranslations("common");
  const t = useTranslations("safaris");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-stone-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              {price ? (
                <>
                  <p className="text-xs text-stone-400">{t("detail.from")}</p>
                  <p className="text-base font-bold text-stone-800">{price}</p>
                </>
              ) : (
                <p className="text-sm font-semibold text-stone-800 truncate">{safariName}</p>
              )}
            </div>
            <Link
              href={`/book?safari=${safariCode}`}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-green text-white text-sm font-semibold rounded-xl hover:bg-brand-green/90 transition-all shadow-md shadow-brand-green/20 flex-shrink-0"
            >
              {common("bookNow")}
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
