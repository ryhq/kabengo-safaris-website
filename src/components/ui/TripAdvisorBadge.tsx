"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const TRIPADVISOR_URL =
  "https://www.tripadvisor.com/Attraction_Review-g297913-d34283345-Reviews-Kabengo_Safaris-Arusha_Arusha_Region.html";

function TripAdvisorLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      {/* Owl body */}
      <path d="M16 6C9.4 6 4 9.4 4 13.5c0 2.2 1.5 4.2 3.8 5.6L6 24l4.2-2.3c1.7.6 3.7 1 5.8 1s4.1-.4 5.8-1L26 24l-1.8-4.9C26.5 17.7 28 15.7 28 13.5 28 9.4 22.6 6 16 6z" fill="currentColor" opacity="0.15" />
      {/* Left eye */}
      <circle cx="11" cy="14" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="11" cy="14" r="1.8" fill="currentColor" />
      {/* Right eye */}
      <circle cx="21" cy="14" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="21" cy="14" r="1.8" fill="currentColor" />
      {/* Beak */}
      <path d="M14.5 17L16 19.5L17.5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Head feathers */}
      <path d="M13 5.5L16 3L19 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
      className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00aa6c] transition-colors"
      aria-label="TripAdvisor"
    >
      <TripAdvisorLogo className="w-6 h-6" />
    </a>
  );
}

/**
 * Inline badge for about page — shows logo, name, and CTA.
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
 * Official TripAdvisor rating widget — loads their embed script.
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
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={TRIPADVISOR_URL}
            >
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
