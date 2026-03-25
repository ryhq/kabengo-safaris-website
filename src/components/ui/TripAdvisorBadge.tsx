"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const TRIPADVISOR_URL =
  "https://www.tripadvisor.com/Attraction_Review-g297913-d34283345-Reviews-Kabengo_Safaris-Arusha_Arusha_Region.html";

function TripAdvisorLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 4.48 2 7.5c0 1.41.84 2.69 2.21 3.69L2 16l3.79-2.05C7.32 14.63 9.57 15 12 15s4.68-.37 6.21-1.05L22 16l-2.21-4.81C21.16 10.19 22 8.91 22 7.5 22 4.48 17.52 2 12 2zm-4.5 9a2.5 2.5 0 110-5 2.5 2.5 0 010 5zm9 0a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </svg>
  );
}

/**
 * Compact badge for footer — just an icon link.
 */
export function TripAdvisorIcon() {
  return (
    <a
      href={TRIPADVISOR_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-accent transition-colors"
      aria-label="TripAdvisor"
    >
      <TripAdvisorLogo className="w-[18px] h-[18px]" />
    </a>
  );
}

/**
 * Inline badge for homepage/about — shows logo, name, and CTA.
 */
export function TripAdvisorBadge({ variant = "light" }: { variant?: "light" | "dark" }) {
  const t = useTranslations("common");
  const isLight = variant === "light";

  return (
    <motion.a
      href={TRIPADVISOR_URL}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl border transition-all hover:shadow-md ${
        isLight
          ? "bg-white border-stone-200 hover:border-[#00aa6c]"
          : "bg-white/10 border-white/20 hover:border-[#00aa6c]"
      }`}
    >
      <div className="w-10 h-10 bg-[#00aa6c] rounded-full flex items-center justify-center flex-shrink-0">
        <TripAdvisorLogo className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className={`text-xs font-medium ${isLight ? "text-stone-400" : "text-white/60"}`}>
          {t("findUsOn")}
        </p>
        <p className={`text-sm font-bold ${isLight ? "text-stone-800" : "text-white"}`}>
          {t("tripadvisor")}
        </p>
      </div>
    </motion.a>
  );
}

/**
 * Full section with TripAdvisor badge — for homepage between sections.
 */
export function TripAdvisorSection() {
  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
        <TripAdvisorBadge variant="light" />
      </div>
    </section>
  );
}
