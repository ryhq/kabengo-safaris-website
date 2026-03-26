"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const TRIPADVISOR_URL =
  "https://www.tripadvisor.com/Attraction_Review-g297913-d34283345-Reviews-Kabengo_Safaris-Arusha_Arusha_Region.html";

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

/**
 * Compact icon for footer social row.
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
 * Official TripAdvisor rating widget (narrow) — for footer.
 */
export function TripAdvisorWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const script = document.createElement("script");
    script.src =
      "https://www.jscache.com/wejs?wtype=cdsratingsonlynarrow&uniq=410&locationId=34283345&lang=en_US&border=true&display_version=2";
    script.async = true;
    containerRef.current.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return (
    <div ref={containerRef}>
      <div id="TA_cdsratingsonlynarrow410" className="TA_cdsratingsonlynarrow">
        <ul id="Dd0pwD" className="TA_links w2jo6gn0">
          <li id="2zgtgeVI0E" className="AcVyugmURHj">
            <a target="_blank" rel="noopener noreferrer" href={TRIPADVISOR_URL}>
              <img
                src="https://www.tripadvisor.com/img/cdsi/img2/branding/v2/Tripadvisor_lockup_horizontal_secondary_registered-18034-2.svg"
                alt="TripAdvisor"
              />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Well-styled "Find us on Tripadvisor" section — for about page.
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
 * TripAdvisor "Write a Review" section — for reviews page.
 * Loads the official review starter widget in a styled container.
 */
export function TripAdvisorReviewSection() {
  const t = useTranslations("common");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const script = document.createElement("script");
    script.src =
      "https://www.jscache.com/wejs?wtype=cdswritereviewlg&uniq=691&locationId=34283345&lang=en_US&lang=en_US&display_version=2";
    script.async = true;
    containerRef.current.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

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
          className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 sm:p-10 flex flex-col items-center"
          ref={containerRef}
        >
          <div id="TA_cdswritereviewlg691" className="TA_cdswritereviewlg">
            <ul id="rqB6PwRVhxFi" className="TA_links 33GNHwf8">
              <li id="MJa6WqjUe" className="EHaNWBD">
                <a target="_blank" rel="noopener noreferrer" href={TRIPADVISOR_URL}>
                  <img
                    src="https://static.tacdn.com/img2/brand_refresh/Tripadvisor_lockup_horizontal_secondary_registered.svg"
                    alt="TripAdvisor"
                  />
                </a>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
