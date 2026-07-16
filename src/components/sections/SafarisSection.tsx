"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SafariCard, { type SafariCardData } from "@/components/safari/SafariCard";

interface SafarisSectionProps {
  initialSafaris: SafariCardData[];
  totalItems?: number; // accepted for compatibility; not displayed (no CMS-style counts)
}

const SERIF = "var(--font-source-serif), Georgia, serif";
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function SafarisSection({ initialSafaris }: SafarisSectionProps) {
  const t = useTranslations("home");
  const seen = new Set<string>();
  const safaris = initialSafaris.filter((s) => {
    if (seen.has(s.code)) return false;
    seen.add(s.code);
    return true;
  });

  if (safaris.length === 0) return null;

  return (
    <section aria-labelledby="exp-title" className="relative overflow-hidden" style={{ background: "linear-gradient(170deg,#faf8f5 0%,#f1ece3 100%)", padding: "clamp(56px,9vw,120px) clamp(18px,5vw,72px)" }}>
      {/* thin gold horizon line tying to the hero above */}
      <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(150,99,26,.35) 20%,rgba(150,99,26,.35) 80%,transparent)" }} />
      {/* faint contour-line texture */}
      <svg aria-hidden="true" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05, pointerEvents: "none", color: "#3e3117" }}>
        <g fill="none" stroke="currentColor" strokeWidth={1.4}>
          <path d="M-40 140C220 60 420 210 640 150 880 84 1020 200 1260 140" />
          <path d="M-40 240C220 160 420 310 640 250 880 184 1020 300 1260 240" />
          <path d="M-40 360C220 280 420 430 640 370 880 304 1020 420 1260 360" />
          <path d="M-40 480C220 400 420 550 640 490 880 424 1020 540 1260 480" />
          <path d="M-40 600C220 520 420 670 640 610 880 544 1020 660 1260 600" />
        </g>
      </svg>
      {/* faint grain */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: GRAIN, opacity: 0.05, mixBlendMode: "multiply", pointerEvents: "none" }} />
      {/* acacia silhouette bleeding from bottom-right */}
      <svg aria-hidden="true" viewBox="0 0 240 200" style={{ position: "absolute", right: -8, bottom: -6, width: "min(300px,32vw)", height: "auto", opacity: 0.07, pointerEvents: "none", color: "#1b3717" }}>
        <g fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
          <path d="M120 200v-92" />
          <path d="M120 112c-26-6-52-24-70-30 16 14 42 28 62 32M120 112c26-6 54-22 72-28-18 14-46 26-66 30M120 96c-18-6-34-20-44-28 12 14 30 26 44 32M120 96c18-6 36-18 48-26-14 14-34 24-48 30" />
          <path d="M44 82c22-16 44-16 76-14 30 2 52-2 76 10-20-16-46-18-76-18-32 0-56 6-76 22Z" />
        </g>
      </svg>

      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto" }}>
        {/* header — editorial, no counts. Text left / button right on desktop; centered stack on phones */}
        <header className="flex flex-col items-center text-center gap-7 md:flex-row md:items-end md:justify-between md:text-left md:gap-8" style={{ marginBottom: "clamp(38px,5vw,60px)" }}>
          <div style={{ maxWidth: 640 }}>
            <div className="flex items-center justify-center md:justify-start" style={{ gap: 11, color: "#96631a", fontSize: 12, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 18 }}>
              <span style={{ width: 26, height: 1, background: "#96631a" }} />{t("safarisEyebrow")}
            </div>
            <h2 id="exp-title" style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(32px,5vw,56px)", lineHeight: 1.03, letterSpacing: "-.015em", margin: "0 0 20px" }}>{t("safarisTitle")}</h2>

            {/* nature-motif divider */}
            <div aria-hidden="true" className="flex items-center justify-center md:justify-start" style={{ gap: 13, marginBottom: 20 }}>
              <span style={{ width: 40, height: 1, background: "#e4ddd1" }} />
              <svg width={28} height={22} viewBox="0 0 40 32" fill="none" stroke="#c48f2b" strokeWidth={1.6} strokeLinecap="round"><path d="M20 31V14" /><path d="M20 16c-6-2-12-6-15-7M20 16c6-2 12-5 15-6M20 11c-4-1.5-8-4-10-5M20 11c4-1.5 8-3.5 10-4.5" /></svg>
              <span className="flex items-center" style={{ gap: 5 }}>
                <span style={{ width: 5, height: 6, borderRadius: "50%", background: "#96631a", transform: "rotate(-18deg)" }} />
                <span style={{ width: 5, height: 6, borderRadius: "50%", background: "#96631a", transform: "rotate(14deg)" }} />
                <span style={{ width: 5, height: 6, borderRadius: "50%", background: "#96631a", transform: "rotate(-10deg)" }} />
              </span>
              <span style={{ width: 40, height: 1, background: "#e4ddd1" }} />
            </div>

            <p className="my-0 mx-auto md:mx-0" style={{ color: "#4a3f34", fontSize: "clamp(16px,1.9vw,18px)", lineHeight: 1.6, maxWidth: 520 }}>{t("safarisSubtitle")}</p>
          </div>

          {/* desktop-only CTA, aligned to the right of the heading block */}
          <Link
            href="/safaris"
            className="hidden md:inline-flex items-center gap-2 flex-shrink-0 font-semibold rounded-lg border-[1.5px] border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-cream transition-colors"
            style={{ padding: "13px 22px", fontSize: 15 }}
          >
            {t("exploreAll")}
            <ArrowRight size={16} strokeWidth={2.3} />
          </Link>
        </header>

        {/* card grid */}
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "clamp(18px,2.4vw,28px)" }}>
          {safaris.map((safari, index) => (
            <motion.div
              key={safari.code}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (index % 6) * 0.08 }}
            >
              <SafariCard safari={safari} />
            </motion.div>
          ))}
        </div>

        {/* phone-only CTA — drops below the cards, centered */}
        <div className="flex justify-center md:hidden" style={{ marginTop: "clamp(32px,8vw,44px)" }}>
          <Link
            href="/safaris"
            className="inline-flex items-center gap-2.5 bg-brand-green text-brand-cream hover:bg-brand-green-dark transition-colors font-semibold shadow-sm hover:shadow-md rounded-full"
            style={{ padding: "15px 32px", fontSize: 16 }}
          >
            {t("exploreAll")}
            <ArrowRight size={18} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
