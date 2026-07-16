"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, MapPin } from "lucide-react";

const SERIF = "var(--font-source-serif), Georgia, serif";

/* Organic brushed/torn-circle mask for the photo — fractal-noise-displaced circle, stretched to the frame. */
const PHOTO_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cdefs%3E%3Cfilter id='r' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3' seed='14' result='n'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='n' scale='52' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3C/defs%3E%3Cellipse cx='400' cy='300' rx='352' ry='262' fill='white' filter='url(%23r)'/%3E%3C/svg%3E\") center/100% 100% no-repeat";

/* A larger, softer torn shape for the decorative background patch. */
const BG_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cdefs%3E%3Cfilter id='b' x='-25%25' y='-25%25' width='150%25' height='150%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.008' numOctaves='3' seed='29' result='n'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='n' scale='72' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3C/defs%3E%3Ccircle cx='300' cy='300' r='250' fill='white' filter='url(%23b)'/%3E%3C/svg%3E\") center/contain no-repeat";

const TRUST_KEYS = ["trust1", "trust2", "trust3"] as const;

export default function BookVacationSection() {
  const t = useTranslations("bookSection");
  return (
    <section aria-labelledby="book-title" className="bookv relative overflow-hidden" style={{ background: "linear-gradient(180deg,#faf8f5 0%,#f1ece3 100%)" }}>
      <style>{`
        .bookv-inner { display: flex; flex-direction: column; align-items: center; gap: clamp(40px,6vw,72px);
                       width: 92%; max-width: 1720px; margin: 0 auto; position: relative; z-index: 1;
                       padding: clamp(48px,8vw,96px) 0; }
        .bookv-text  { width: 100%; max-width: 600px; }
        .bookv-media { position: relative; flex: 0 0 auto; width: min(94vw,560px); aspect-ratio: 4 / 3; }
        .bookv-frame, .bookv-photo { position: absolute; inset: 0; -webkit-mask: ${PHOTO_MASK}; mask: ${PHOTO_MASK}; }
        .bookv-frame { background: #faf8f5; transform: scale(1.03); filter: drop-shadow(0 22px 40px rgba(62,21,2,.24)); }
        .bookv-photo { background: 50% 50%/cover no-repeat url('/images/kabengo-guide-ngorongoro.jpg'); }
        .bookv-bg    { position: absolute; z-index: -1; top: 50%; left: -7%; transform: translateY(-50%);
                       width: clamp(420px,40vw,720px); aspect-ratio: 1 / 1; background: #ece4d4; opacity: .75;
                       -webkit-mask: ${BG_MASK}; mask: ${BG_MASK}; pointer-events: none; }
        @media (min-width: 900px) {
          .bookv-inner { flex-direction: row; justify-content: space-between; align-items: center;
                         padding: clamp(40px,4.5vw,60px) 0; }
          .bookv-text  { flex: 0 1 560px; }
          .bookv-media { flex: 0 0 auto; width: clamp(560px,54vw,1000px); aspect-ratio: 4 / 3; }
        }
      `}</style>

      <div className="bookv-inner">
        {/* big brushed shape in the background, anchored to the content container */}
        <div className="bookv-bg" aria-hidden="true" />

        {/* ── text column ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="bookv-text">
          <div className="flex items-center" style={{ gap: 8, color: "#96631a", fontSize: 12, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 18 }}>
            <MapPin size={14} strokeWidth={2.4} />{t("eyebrow")}
          </div>

          <h2 id="book-title" style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(30px,4.4vw,52px)", lineHeight: 1.05, letterSpacing: "-.015em", margin: "0 0 22px" }}>{t("title")}</h2>

          <p style={{ color: "#4a3f34", fontSize: "clamp(16px,1.8vw,18px)", lineHeight: 1.65, margin: "0 0 18px" }}>{t("intro")}</p>

          <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(20px,2.4vw,26px)", lineHeight: 1.2, margin: "26px 0 14px" }}>{t("bestWayTitle")}</h3>
          <p style={{ color: "#4a3f34", fontSize: "clamp(15px,1.7vw,17px)", lineHeight: 1.65, margin: "0 0 22px" }}>{t("bestWayBody")}</p>

          {/* trust list */}
          <ul style={{ listStyle: "none", margin: "0 0 30px", padding: 0, display: "grid", gap: 12 }}>
            {TRUST_KEYS.map((key) => (
              <li key={key} className="flex items-start" style={{ gap: 11, color: "#2a2018", fontSize: "clamp(14.5px,1.6vw,16px)", lineHeight: 1.45 }}>
                <span className="flex-shrink-0 flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: "50%", background: "#e6ece2", color: "#274e22", marginTop: 1 }}><Check size={13} strokeWidth={3} /></span>
                {t(key)}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="flex flex-wrap items-center" style={{ gap: 14 }}>
            <Link href="/plan" className="inline-flex items-center gap-2 font-semibold rounded-full transition-colors" style={{ background: "#c48f2b", color: "#3d1402", padding: "15px 28px", fontSize: 16 }}>
              {t("planCta")}
              <ArrowRight size={18} strokeWidth={2.3} />
            </Link>
            <Link href="/safaris" className="inline-flex items-center gap-2 font-semibold rounded-full border-[1.5px] border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-cream transition-colors" style={{ padding: "13px 26px", fontSize: 15 }}>
              {t("browseCta")}
            </Link>
          </div>
        </motion.div>

        {/* ── media: single photo in an organic brushed shape (landscape → door logos visible) ── */}
        <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bookv-media">
          <div className="bookv-frame" aria-hidden="true" />
          <div role="img" aria-label="A Kabengo Safaris guide with the branded Land Cruiser in the Ngorongoro highlands" className="bookv-photo" />
        </motion.div>
      </div>
    </section>
  );
}
