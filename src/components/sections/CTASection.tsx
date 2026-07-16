"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";

const SERIF = "var(--font-source-serif), Georgia, serif";

export default function CTASection() {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");

  return (
    <section className="relative overflow-hidden" style={{ padding: "clamp(84px,13vw,168px) clamp(20px,5vw,72px)" }}>
      {/* real zebra panorama */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "center/cover no-repeat url('/images/cta-adventure.jpg')" }} />
      {/* brand scrim for legibility + warmth */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(165deg, rgba(27,55,23,.72) 0%, rgba(18,40,15,.6) 45%, rgba(61,20,2,.82) 100%)" }} />
      {/* top gold hairline to tie into the sections above */}
      <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(196,143,43,.6) 20%,rgba(196,143,43,.6) 80%,transparent)" }} />

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", textAlign: "center" }}
      >
        <div style={{ color: "#f3e6c8", fontSize: 12, fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase", marginBottom: 18 }}>Kabengo Safaris · Arusha, Tanzania</div>
        <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(32px,5.2vw,58px)", lineHeight: 1.04, letterSpacing: "-.015em", margin: "0 0 18px", textShadow: "0 2px 24px rgba(20,12,4,.4)" }}>{t("ctaTitle")}</h2>
        <p style={{ color: "rgba(250,248,245,.9)", fontSize: "clamp(16px,2vw,19px)", lineHeight: 1.6, margin: "0 auto 34px", maxWidth: 560, textShadow: "0 1px 14px rgba(20,12,4,.45)" }}>{t("ctaSubtitle")}</p>

        <div className="flex flex-wrap items-center justify-center" style={{ gap: 14 }}>
          <Link href="/plan" className="inline-flex items-center gap-2.5 font-semibold rounded-full transition-colors shadow-lg" style={{ background: "#c48f2b", color: "#3d1402", padding: "16px 34px", fontSize: 16 }}>
            {t("ctaCta")}
            <ArrowRight size={18} strokeWidth={2.3} />
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-2.5 font-semibold rounded-full transition-colors" style={{ background: "rgba(250,248,245,.1)", color: "#faf8f5", border: "1.5px solid rgba(250,248,245,.55)", padding: "14px 28px", fontSize: 15, backdropFilter: "blur(2px)" }}>
            <MessageCircle size={17} strokeWidth={2.2} />
            {tNav("contact")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
