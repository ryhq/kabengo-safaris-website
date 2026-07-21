"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Star, BadgeCheck, Quote, MapPin, ArrowRight } from "lucide-react";
import FeaturedCarousel from "@/components/ui/FeaturedCarousel";
import { apiClient } from "@/lib/api";

interface ReviewItem {
  authorName: string;
  authorTitle?: string;
  authorCountry?: string;
  reviewTitle?: string;
  message: string;
  rating: number;
  isVerifiedBooking?: boolean;
  reviewDate?: string;
  sourceDisplayName?: string;
  sourceUrl?: string;
}

const SERIF = "var(--font-source-serif), Georgia, serif";
const CARD_H = 380;
const TA_GREEN = "#00aa6c";
const ONE_LINE: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const clamp = (n: number): React.CSSProperties => ({ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: n, overflow: "hidden" });

const AVATAR_TINTS = [["#e6ece2", "#274e22"], ["#f3e6c8", "#96631a"], ["#efe2d6", "#7a2f14"], ["#dfe8e4", "#1b3717"]];
const hashStr = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
const tintFor = (name: string) => AVATAR_TINTS[hashStr(name) % AVATAR_TINTS.length];
const isTripadvisor = (s?: string) => (s || "").toLowerCase().includes("tripadvisor");

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex" style={{ gap: 3 }} aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={size} fill={i < rating ? "#c48f2b" : "#e4ddd1"} stroke="none" />)}
    </span>
  );
}
function Bubbles({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center" style={{ gap: 3 }} aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ width: size, height: size, borderRadius: "50%", background: i < rating ? TA_GREEN : "#d6d3cd", display: "inline-block" }} />)}
    </span>
  );
}
function SourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const ta = isTripadvisor(source);
  return (
    <span className="inline-flex items-center" style={{ gap: 6, fontSize: 11.5, fontWeight: 700, color: ta ? TA_GREEN : "#7a6f61", background: ta ? "rgba(0,170,108,.1)" : "#f1ece3", padding: "4px 10px", borderRadius: 20, letterSpacing: ".01em" }}>
      {ta && <span style={{ width: 8, height: 8, borderRadius: "50%", background: TA_GREEN, display: "inline-block" }} />}
      {source}
    </span>
  );
}
function fmtDate(d?: string, locale?: string) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString(locale, { year: "numeric", month: "short" });
}

export default function GuestReviewsSection() {
  const t = useTranslations("testimonials");
  const locale = useLocale();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    let alive = true;
    apiClient
      .get(`/public/testimonies?page=0&size=12`, { headers: { "Accept-Language": locale } })
      .then((res) => { if (alive) { const d = res.data?.data; setReviews(d?.testimonies || d || []); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [locale]);

  if (reviews.length === 0) return null;

  const AuthorRow = ({ item }: { item: ReviewItem }) => {
    const [bg, fg] = tintFor(item.authorName);
    const date = fmtDate(item.reviewDate, locale);
    const meta = [item.authorTitle, item.authorCountry].filter(Boolean);
    return (
      <div className="flex items-center" style={{ gap: 12 }}>
        <span className="flex items-center justify-center flex-shrink-0" style={{ width: 42, height: 42, borderRadius: "50%", background: bg, color: fg, fontFamily: SERIF, fontWeight: 700, fontSize: 15 }}>{initials(item.authorName)}</span>
        <div style={{ minWidth: 0 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontWeight: 700, color: "#2a2018", fontSize: 14.5, ...ONE_LINE }}>{item.authorName}</span>
            {item.isVerifiedBooking && <span className="inline-flex items-center flex-shrink-0" style={{ gap: 3, fontSize: 11, fontWeight: 600, color: "#3a7a2a" }}><BadgeCheck size={13} strokeWidth={2.4} />{t("verified")}</span>}
          </div>
          <div style={{ color: "#7a6f61", fontSize: 12.5, ...ONE_LINE }}>
            {meta.length > 0 && <span className="inline-flex items-center" style={{ gap: 4 }}>{item.authorCountry && <MapPin size={11} />}{meta.join(" · ")}</span>}
            {meta.length > 0 && date && <span> · </span>}
            {date}
          </div>
        </div>
      </div>
    );
  };

  const renderReviewCard = (item: ReviewItem) => (
    <article className={`relative flex flex-col ${item.sourceUrl ? "transition-shadow hover:shadow-[0_12px_34px_rgba(62,21,2,.12)]" : ""}`} style={{ height: CARD_H, background: "#fff", border: "1px solid #e4ddd1", borderRadius: 18, padding: "26px 26px 22px" }}>
      {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={t("readOnSource", { source: item.sourceDisplayName || "" })} className="absolute inset-0 z-[5]" style={{ borderRadius: 18 }} />}
      <Quote size={30} style={{ position: "absolute", top: 22, right: 22, color: "rgba(196,143,43,.16)" }} fill="currentColor" stroke="none" />
      <div style={{ marginBottom: 14 }}>{isTripadvisor(item.sourceDisplayName) ? <Bubbles rating={item.rating} /> : <Stars rating={item.rating} />}</div>
      {item.reviewTitle && <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 17.5, lineHeight: 1.25, margin: "0 0 8px", paddingRight: 34, ...clamp(2) }}>{item.reviewTitle}</h3>}
      <p style={{ color: "#4a3f34", fontSize: 14.5, lineHeight: 1.6, margin: 0, flex: 1, minHeight: 0, ...clamp(item.reviewTitle ? 6 : 8) }}>&ldquo;{item.message}&rdquo;</p>
      <div className="flex items-center justify-between" style={{ gap: 10, paddingTop: 16, marginTop: 14, borderTop: "1px solid #f1ece3" }}>
        <AuthorRow item={item} />
        {item.sourceDisplayName && <div className="flex-shrink-0"><SourceBadge source={item.sourceDisplayName} /></div>}
      </div>
    </article>
  );

  return (
    <section style={{ background: "#faf8f5", padding: "clamp(52px,7vw,88px) clamp(16px,5vw,56px)" }}>
      <div style={{ maxWidth: 1220, margin: "0 auto" }}>
        <FeaturedCarousel
          title={t("reviewsHeading")}
          subtitle={t("reviewsSub")}
          items={reviews}
          renderCard={renderReviewCard}
          prevLabel={t("prev")}
          nextLabel={t("next")}
        />
        <div className="flex justify-center" style={{ marginTop: "clamp(24px,3vw,36px)" }}>
          <Link href="/reviews" className="inline-flex items-center gap-2 font-semibold transition-colors hover:bg-brand-green hover:text-brand-cream" style={{ background: "none", color: "#274e22", fontSize: 15, border: "1.5px solid #274e22", borderRadius: 8, padding: "13px 28px" }}>
            {t("viewAll")}<ArrowRight size={16} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
