"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const SERIF = "var(--font-source-serif), Georgia, serif";

const CATS = [
  { key: "dest", href: "/parks", img: "/images/explore-destinations.jpg", grad: "linear-gradient(150deg,#4a6b39,#12280f)", titleKey: "destTitle", descKey: "destDesc" },
  { key: "act", href: "/activities", img: "/images/explore-activities.jpg", grad: "linear-gradient(150deg,#9a6a2a,#2a1204)", titleKey: "actTitle", descKey: "actDesc" },
  { key: "stay", href: "/accommodations", img: "/images/explore-stays.jpg", grad: "linear-gradient(150deg,#6b6535,#241c0c)", titleKey: "stayTitle", descKey: "stayDesc" },
] as const;

export default function ExploreSection() {
  const t = useTranslations("explore");

  return (
    <section aria-labelledby="explore-title" className="relative overflow-hidden" style={{ background: "linear-gradient(180deg,#faf8f5 0%,#f1ece3 100%)", padding: "clamp(56px,9vw,110px) clamp(18px,5vw,72px)" }}>
      <style>{`
        .expl-grid { display: grid; grid-template-columns: 1fr; gap: clamp(16px,2.4vw,24px); }
        .expl-card { position: relative; display: block; border-radius: 16px; overflow: hidden; aspect-ratio: 16/11; box-shadow: 0 10px 30px rgba(62,21,2,.12); }
        .expl-img { position: absolute; inset: 0; background-size: cover; background-position: center; transition: transform .65s cubic-bezier(.2,.7,.2,1); }
        .expl-card:hover .expl-img { transform: scale(1.06); }
        .expl-arrow { transition: transform .3s ease; }
        .expl-card:hover .expl-arrow { transform: translateX(5px); }
        @media (min-width: 800px) {
          .expl-grid { grid-template-columns: repeat(3, 1fr); }
          .expl-card { aspect-ratio: 3/4; }
        }
      `}</style>

      <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto" }}>
        {/* header */}
        <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto clamp(36px,5vw,56px)" }}>
          <div className="flex items-center justify-center" style={{ gap: 11, color: "#96631a", fontSize: 12, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 14 }}>
            <span style={{ width: 22, height: 1, background: "#96631a" }} />{t("eyebrow")}<span style={{ width: 22, height: 1, background: "#96631a" }} />
          </div>
          <h2 id="explore-title" style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(30px,4.4vw,50px)", lineHeight: 1.05, letterSpacing: "-.015em", margin: 0 }}>{t("title")}</h2>
        </div>

        {/* three linked category cards */}
        <div className="expl-grid">
          {CATS.map((c, i) => (
            <motion.div key={c.key} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: i * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}>
              <Link href={c.href} className="expl-card group" style={{ background: c.grad }} aria-label={t(c.titleKey)}>
                <div className="expl-img" style={{ backgroundImage: `url('${c.img}')` }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,12,4,0) 34%, rgba(20,12,4,.45) 62%, rgba(20,12,4,.9) 100%)" }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "clamp(20px,2.4vw,28px)" }}>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(22px,2.4vw,28px)", lineHeight: 1.12, margin: 0, textShadow: "0 1px 14px rgba(20,12,4,.5)" }}>{t(c.titleKey)}</h3>
                  <p style={{ color: "rgba(250,248,245,.85)", fontSize: 14, lineHeight: 1.45, margin: "6px 0 14px", textShadow: "0 1px 10px rgba(20,12,4,.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t(c.descKey)}</p>
                  <span className="inline-flex items-center" style={{ gap: 8, color: "#f3e6c8", fontWeight: 600, fontSize: 14 }}>
                    {t("cta")}
                    <span className="expl-arrow inline-flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: "50%", background: "#c48f2b", color: "#3d1402" }}><ArrowRight size={15} strokeWidth={2.5} /></span>
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
