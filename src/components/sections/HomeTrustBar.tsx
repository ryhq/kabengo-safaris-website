"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BadgeCheck, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api";

const SERIF = "var(--font-source-serif), Georgia, serif";
const TA_GREEN = "#00aa6c";

/** Slim credibility band directly under the hero: live aggregate rating +
 *  Tripadvisor + accreditations, linking to the full reviews page. */
export default function HomeTrustBar() {
  const t = useTranslations("testimonials");
  const locale = useLocale();
  const [summary, setSummary] = useState<{ rating: number; count: number } | null>(null);

  useEffect(() => {
    let alive = true;
    apiClient
      .get(`/public/testimonies/summary`, { headers: { "Accept-Language": locale } })
      .then((res) => {
        const d = res.data?.data;
        if (alive && res.data?.success && d?.reviewCount > 0 && d?.averageRating) {
          setSummary({ rating: d.averageRating, count: d.reviewCount });
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [locale]);

  if (!summary) return null;

  return (
    <section className="sticky top-20 z-30" style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(12px)", borderTop: "1px solid #e4ddd1", borderBottom: "1px solid #e4ddd1", padding: "12px clamp(16px,5vw,56px)" }}>
      <Link href="/reviews" className="group flex flex-wrap items-center justify-center no-underline" style={{ maxWidth: 1100, margin: "0 auto", gap: "8px 20px" }}>
        <span className="inline-flex items-center" style={{ gap: 8 }}>
          <span style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 18, lineHeight: 1 }}>{summary.rating.toFixed(1)}</span>
          <span className="inline-flex" style={{ gap: 2, color: "#c48f2b", letterSpacing: 1, fontSize: 15 }}>★★★★★</span>
        </span>
        <span aria-hidden="true" className="hidden sm:block" style={{ width: 1, height: 18, background: "#e4ddd1" }} />
        <span className="inline-flex items-center" style={{ gap: 7 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: TA_GREEN, display: "inline-block" }} />
          <span style={{ fontWeight: 700, color: TA_GREEN, fontSize: 13.5 }}>Tripadvisor</span>
          <span style={{ color: "#7a6f61", fontSize: 13 }}>· {t("reviewsShort", { count: summary.count })}</span>
        </span>
        <span aria-hidden="true" className="hidden sm:block" style={{ width: 1, height: 18, background: "#e4ddd1" }} />
        <span className="inline-flex items-center" style={{ gap: 7, color: "#4a3f34", fontSize: 13.5, fontWeight: 600 }}>
          <BadgeCheck size={15} strokeWidth={2.2} style={{ color: "#c48f2b" }} />TATO / TALA
        </span>
        <span className="inline-flex items-center" style={{ gap: 4, color: "#96631a", fontSize: 13, fontWeight: 600 }}>
          {t("viewAll")}<ArrowRight size={13} strokeWidth={2.4} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </section>
  );
}
