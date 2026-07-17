"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const TRIPADVISOR_URL =
  "https://www.tripadvisor.com/Attraction_Review-g297913-d34283345-Reviews-Kabengo_Safaris-Arusha_Arusha_Region.html";
/* Deep-link that opens TripAdvisor's "write a review" editor for this listing. */
const TRIPADVISOR_WRITE_REVIEW_URL = "https://www.tripadvisor.com/UserReviewEdit-d34283345";

/* Live figures from the TripAdvisor listing — bump these as reviews grow
   (or later wire the TripAdvisor Content API to fetch them automatically). */
const TRIPADVISOR_RATING = 5.0;
const TRIPADVISOR_REVIEW_COUNT: number = 2;
const TA_GREEN = "#00aa6c";

function TripAdvisorLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <path d="M16 6C9.4 6 4 9.4 4 13.5c0 2.2 1.5 4.2 3.8 5.6L6 24l4.2-2.3c1.7.6 3.7 1 5.8 1s4.1-.4 5.8-1L26 24l-1.8-4.9C26.5 17.7 28 15.7 28 13.5 28 9.4 22.6 6 16 6z" fill="currentColor" opacity="0.15" />
      <circle cx="11" cy="14" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="11" cy="14" r="1.8" fill="currentColor" />
      <circle cx="21" cy="14" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="21" cy="14" r="1.8" fill="currentColor" />
      <path d="M14.5 17L16 19.5L17.5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 5.5L16 3L19 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** TripAdvisor-style rating bubbles (green circles). */
function RatingBubbles({ rating, size = 15 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center" style={{ gap: 3 }} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((n) => (
        <span key={n} style={{ width: size, height: size, borderRadius: "50%", background: n < rounded ? TA_GREEN : "#d6d3cd", display: "inline-block" }} />
      ))}
    </span>
  );
}

/**
 * Compact icon for the footer social row.
 */
export function TripAdvisorIcon() {
  return (
    <a
      href={TRIPADVISOR_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00aa6c] transition-colors"
      aria-label="TripAdvisor"
    >
      <TripAdvisorLogo className="w-6 h-6" />
    </a>
  );
}

/**
 * Self-rendered TripAdvisor rating badge (footer). No third-party script —
 * always renders and links to the live listing.
 */
export function TripAdvisorWidget() {
  return (
    <a
      href={TRIPADVISOR_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 no-underline"
      aria-label={`Kabengo Safaris on Tripadvisor — rated ${TRIPADVISOR_RATING.toFixed(1)} from ${TRIPADVISOR_REVIEW_COUNT} review${TRIPADVISOR_REVIEW_COUNT === 1 ? "" : "s"}`}
    >
      <span className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 44, height: 44, background: "rgba(0,170,108,.12)", color: TA_GREEN }}>
        <TripAdvisorLogo className="w-7 h-7" />
      </span>
      <span className="min-w-0">
        <span className="block font-bold leading-none" style={{ color: TA_GREEN, fontSize: 15 }}>Tripadvisor</span>
        <span className="flex items-center gap-2" style={{ marginTop: 5 }}>
          <RatingBubbles rating={TRIPADVISOR_RATING} />
          <span className="font-semibold" style={{ color: "#2a2018", fontSize: 14 }}>{TRIPADVISOR_RATING.toFixed(1)}</span>
        </span>
        <span className="block" style={{ color: "#7a6f61", fontSize: 12, marginTop: 3 }}>
          {TRIPADVISOR_REVIEW_COUNT} review{TRIPADVISOR_REVIEW_COUNT === 1 ? "" : "s"}
        </span>
      </span>
    </a>
  );
}

/**
 * Well-styled "Find us on Tripadvisor" section — for the about page.
 */
export function TripAdvisorAboutSection() {
  const t = useTranslations("common");

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mt-20 mb-4"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00aa6c] to-[#008a57] p-8 sm:p-12 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <TripAdvisorLogo className="w-full h-full" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <TripAdvisorLogo className="w-12 h-12 text-[#00aa6c]" />
          </div>

          <div className="text-center sm:text-left flex-1">
            <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">
              {t("findUsOn")}
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif mb-2">
              {t("tripadvisor")}
            </h3>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <RatingBubbles rating={TRIPADVISOR_RATING} size={16} />
              <span className="text-white font-semibold">{TRIPADVISOR_RATING.toFixed(1)}</span>
              <span className="text-white/70 text-sm">· {TRIPADVISOR_REVIEW_COUNT} review{TRIPADVISOR_REVIEW_COUNT === 1 ? "" : "s"}</span>
            </div>
            <p className="text-white/80 text-sm max-w-md">
              {t("tripadvisorAboutDesc")}
            </p>
          </div>

          <a
            href={TRIPADVISOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#00aa6c] font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-lg flex-shrink-0"
          >
            {t("viewOnTripadvisor")}
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </motion.section>
  );
}

/**
 * TripAdvisor "Write a Review" section — for the reviews page.
 * Self-rendered (no jscache widget) so it always displays.
 */
export function TripAdvisorReviewSection() {
  const t = useTranslations("common");

  return (
    <section className="py-16 bg-gradient-to-b from-white to-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00aa6c]/10 rounded-2xl mb-4">
            <TripAdvisorLogo className="w-10 h-10 text-[#00aa6c]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 font-serif mb-3">
            {t("reviewOnTripadvisor")}
          </h2>
          <p className="text-stone-500 max-w-lg mx-auto">
            {t("reviewOnTripadvisorDesc")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 sm:p-10 flex flex-col items-center gap-6"
        >
          <div className="flex items-center gap-3">
            <RatingBubbles rating={TRIPADVISOR_RATING} size={18} />
            <span className="font-semibold text-stone-800 text-lg">{TRIPADVISOR_RATING.toFixed(1)}</span>
            <span className="text-stone-500 text-sm">· {TRIPADVISOR_REVIEW_COUNT} review{TRIPADVISOR_REVIEW_COUNT === 1 ? "" : "s"}</span>
          </div>

          {/* Scan-to-review QR */}
          <a href={TRIPADVISOR_WRITE_REVIEW_URL} target="_blank" rel="noopener noreferrer" aria-label="Write a review on Tripadvisor" className="block">
            <img src="/images/tripadvisor-qr.png" alt="Scan to write a review on Tripadvisor" width={190} height={285} style={{ width: 190, height: "auto", borderRadius: 14 }} />
          </a>
          <p className="text-stone-500 text-sm -mt-1">{t("scanToReview")}</p>

          <a
            href={TRIPADVISOR_WRITE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#00aa6c] text-white font-semibold rounded-xl hover:bg-[#008a57] transition-colors shadow-sm"
          >
            <TripAdvisorLogo className="w-5 h-5" />
            {t("reviewOnTripadvisor")}
            <ExternalLink size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
