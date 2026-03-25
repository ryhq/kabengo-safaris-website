"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const STORAGE_KEY = "privacy-notice-dismissed";

export default function PrivacyBanner() {
  const t = useTranslations("privacy");
  const [visible, setVisible] = useState(false);
  const [bookingBarVisible, setBookingBarVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setBookingBarVisible(detail?.visible ?? false);
    };
    window.addEventListener("mobile-booking-bar", handler);
    return () => window.removeEventListener("mobile-booking-bar", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-x-0 z-40 bg-brand-secondary text-white px-4 py-3 shadow-2xl"
          style={{ bottom: bookingBarVisible ? 60 : 0 }}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-stone-300 text-center sm:text-left">
              {t("bannerMessage")}{" "}
              <Link href="/privacy-policy" className="underline text-white hover:text-brand-accent transition-colors">
                {t("learnMore")}
              </Link>
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={dismiss}
                className="px-4 py-2 bg-brand-accent hover:bg-brand-accent/90 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {t("dismiss")}
              </button>
              <button
                onClick={dismiss}
                className="p-1 text-stone-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
