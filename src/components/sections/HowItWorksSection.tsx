"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Binoculars, Map, MessagesSquare, Compass, PawPrint, ArrowRight, Check } from "lucide-react";

const SERIF = "var(--font-source-serif), Georgia, serif";
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const POP: [number, number, number, number] = [0.34, 1.56, 0.64, 1];
const DRAW = 1.7; // seconds — the trail draw / marker glide

const STEPS = [
  { key: "s1", Icon: Binoculars },
  { key: "s2", Icon: Map },
  { key: "s3", Icon: MessagesSquare },
  { key: "s4", Icon: Compass },
] as const;

// Each node lights up as the marker passes it (fractions of the DRAW duration).
const NODE_AT = [0.06, 0.36, 0.66, 0.94];

export default function HowItWorksSection() {
  const t = useTranslations("howItWorks");
  const trust = t.raw("trust") as string[];
  const viewport = { once: true, amount: 0.4 } as const;

  return (
    <section aria-labelledby="hiw-title" className="hiw relative overflow-hidden" style={{ background: "linear-gradient(180deg,#f1ece3 0%,#faf8f5 100%)", padding: "clamp(56px,9vw,120px) clamp(18px,5vw,72px)" }}>
      <style>{`
        .hiw-grid { display: grid; grid-template-columns: 1fr; gap: clamp(32px,5vw,40px); position: relative; }
        .hiw-step { display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; z-index: 1; }
        .hiw-conn { display: none; }
        @media (min-width: 820px) {
          .hiw-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; }
          .hiw-conn { display: block; position: absolute; left: 12.5%; right: 12.5%; top: 40px; height: 3px; transform: translateY(-50%); z-index: 0; }
        }
      `}</style>

      {/* top gold horizon line */}
      <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(150,99,26,.3) 20%,rgba(150,99,26,.3) 80%,transparent)" }} />

      {/* faint line-art journey doodles in the background */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {/* dashed flight path arcing across the top, with a little plane at its tip */}
        <svg viewBox="0 0 1000 220" preserveAspectRatio="none" style={{ position: "absolute", top: "3%", left: "2%", width: "78%", height: "auto", opacity: 0.09, color: "#96631a" }}>
          <path d="M10 200 C260 150 420 40 980 24" fill="none" stroke="currentColor" strokeWidth={2} strokeDasharray="3 9" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="#96631a" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", top: "5%", right: "7%", width: "clamp(30px,4vw,52px)", opacity: 0.13, transform: "rotate(8deg)" }}>
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
        {/* compass — top left */}
        <svg viewBox="0 0 24 24" fill="none" stroke="#3e3117" strokeWidth={1.1} style={{ position: "absolute", top: "9%", left: "4%", width: "clamp(44px,6vw,88px)", opacity: 0.08 }}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
        {/* acacia tree — bottom left */}
        <svg viewBox="0 0 240 200" fill="none" stroke="#274e22" strokeWidth={2.2} strokeLinecap="round" style={{ position: "absolute", bottom: "-4%", left: "1%", width: "clamp(120px,15vw,220px)", opacity: 0.08 }}>
          <path d="M120 200v-92" />
          <path d="M120 112c-26-6-52-24-70-30 16 14 42 28 62 32M120 112c26-6 54-22 72-28-18 14-46 26-66 30M120 96c-18-6-34-20-44-28 12 14 30 26 44 32M120 96c18-6 36-18 48-26-14 14-34 24-48 30" />
          <path d="M44 82c22-16 44-16 76-14 30 2 52-2 76 10-20-16-46-18-76-18-32 0-56 6-76 22Z" />
        </svg>
        {/* sun — bottom right */}
        <svg viewBox="0 0 60 60" fill="none" stroke="#96631a" strokeWidth={1.6} strokeLinecap="round" style={{ position: "absolute", bottom: "6%", right: "4%", width: "clamp(50px,7vw,96px)", opacity: 0.1 }}>
          <circle cx="30" cy="30" r="11" />
          <path d="M30 6v8M30 46v8M6 30h8M46 30h8M13 13l6 6M41 41l6 6M47 13l-6 6M19 41l-6 6" />
        </svg>
        {/* paw tracks — scattered lower centre */}
        <svg viewBox="0 0 40 48" fill="#5a1e03" style={{ position: "absolute", bottom: "16%", right: "26%", width: "clamp(20px,2.4vw,34px)", opacity: 0.07, transform: "rotate(22deg)" }}>
          <ellipse cx="20" cy="34" rx="11" ry="9" /><circle cx="8" cy="16" r="4" /><circle cx="18" cy="9" r="4.3" /><circle cx="29" cy="13" r="4" />
        </svg>
        <svg viewBox="0 0 40 48" fill="#5a1e03" style={{ position: "absolute", bottom: "9%", left: "30%", width: "clamp(16px,2vw,28px)", opacity: 0.06, transform: "rotate(-14deg)" }}>
          <ellipse cx="20" cy="34" rx="11" ry="9" /><circle cx="8" cy="16" r="4" /><circle cx="18" cy="9" r="4.3" /><circle cx="29" cy="13" r="4" />
        </svg>
      </div>

      <div style={{ position: "relative", maxWidth: 1120, margin: "0 auto" }}>
        {/* header */}
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto clamp(44px,6vw,64px)" }}>
          <div className="flex items-center justify-center" style={{ gap: 11, color: "#96631a", fontSize: 12, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 16 }}>
            <span style={{ width: 22, height: 1, background: "#96631a" }} />{t("eyebrow")}<span style={{ width: 22, height: 1, background: "#96631a" }} />
          </div>
          <h2 id="hiw-title" style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(30px,4.4vw,50px)", lineHeight: 1.05, letterSpacing: "-.015em", margin: "0 0 16px" }}>{t("title")}</h2>
          <p style={{ color: "#4a3f34", fontSize: "clamp(16px,1.8vw,18px)", lineHeight: 1.6, margin: 0 }}>{t("intro")}</p>
        </div>

        {/* steps */}
        <div className="hiw-grid">
          {/* desktop connector: the trail draws, a paw-print marker glides along it */}
          <div className="hiw-conn" aria-hidden="true">
            <div style={{ position: "absolute", inset: 0, borderRadius: 3, background: "rgba(150,99,26,.16)" }} />
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={viewport}
              transition={{ duration: DRAW, ease: EASE }}
              style={{ position: "absolute", inset: 0, borderRadius: 3, transformOrigin: "left", background: "linear-gradient(90deg,#c48f2b,#96631a)" }}
            />
            <motion.div
              initial={{ left: "0%", opacity: 0 }}
              whileInView={{ left: "100%", opacity: [0, 1, 1, 0] }}
              viewport={viewport}
              transition={{ left: { duration: DRAW, ease: EASE }, opacity: { duration: DRAW, times: [0, 0.08, 0.86, 1] } }}
              style={{ position: "absolute", top: "50%", left: 0, transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: "50%", background: "#faf8f5", border: "2px solid #c48f2b", boxShadow: "0 4px 14px rgba(150,99,26,.45)", display: "flex", alignItems: "center", justifyContent: "center", color: "#96631a" }}
            >
              <PawPrint size={17} strokeWidth={2.2} />
            </motion.div>
          </div>

          {STEPS.map(({ key, Icon }, i) => (
            <div key={key} className="hiw-step">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={viewport}
                transition={{ delay: NODE_AT[i] * DRAW, duration: 0.5, ease: POP }}
                style={{ position: "relative", width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(150deg,#356b2e,#1b3717)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 12px 28px rgba(27,55,23,.32)", marginBottom: 22 }}
              >
                <Icon size={30} strokeWidth={1.7} />
                <span style={{ position: "absolute", top: -5, right: -5, width: 28, height: 28, borderRadius: "50%", background: "#c48f2b", color: "#3d1402", fontFamily: SERIF, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #faf8f5" }}>{i + 1}</span>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ delay: NODE_AT[i] * DRAW + 0.14, duration: 0.5, ease: EASE }}
                style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(18px,2vw,21px)", lineHeight: 1.2, margin: "0 0 8px" }}
              >
                {t(`${key}t`)}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ delay: NODE_AT[i] * DRAW + 0.24, duration: 0.5, ease: EASE }}
                style={{ color: "#4a3f34", fontSize: 14.5, lineHeight: 1.55, margin: 0, maxWidth: 240 }}
              >
                {t(`${key}b`)}
              </motion.p>
            </div>
          ))}
        </div>

        {/* footer: trust chips + CTA to the planner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ delay: DRAW * 0.9, duration: 0.5, ease: EASE }}
          className="flex flex-col items-center"
          style={{ marginTop: "clamp(44px,6vw,64px)", gap: 22 }}
        >
          <div className="flex flex-wrap items-center justify-center" style={{ gap: "10px 22px", color: "#7a6f61", fontSize: 13.5 }}>
            {trust.map((item) => (
              <span key={item} className="inline-flex items-center" style={{ gap: 7 }}><Check size={15} color="#96631a" strokeWidth={2.4} />{item}</span>
            ))}
          </div>
          <Link href="/plan" className="inline-flex items-center gap-2.5 bg-brand-green text-brand-cream hover:bg-brand-green-dark transition-colors font-semibold shadow-sm hover:shadow-md rounded-full" style={{ padding: "16px 34px", fontSize: 16 }}>
            {t("cta")}
            <ArrowRight size={18} strokeWidth={2.2} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
