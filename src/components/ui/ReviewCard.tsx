"use client";

import { useTranslations, useLocale } from "next-intl";
import { Star, BadgeCheck, Quote, MapPin } from "lucide-react";

export interface ReviewItem {
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
const TA_GREEN = "#00aa6c";
const ONE_LINE: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const clamp = (n: number): React.CSSProperties => ({ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: n, overflow: "hidden" });
const AVATAR_TINTS = [["#e6ece2", "#274e22"], ["#f3e6c8", "#96631a"], ["#efe2d6", "#7a2f14"], ["#dfe8e4", "#1b3717"]];
const hashStr = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
const tintFor = (name: string) => AVATAR_TINTS[hashStr(name) % AVATAR_TINTS.length];
const isTripadvisor = (s?: string) => (s || "").toLowerCase().includes("tripadvisor");

function fmtDate(d?: string, locale?: string) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString(locale, { year: "numeric", month: "short" });
}

/** Shared review card (TripAdvisor bubbles vs gold stars, title, clamped body,
 *  tinted-initials author, source pill). Whole card links to the review when
 *  a sourceUrl is present. Used by /reviews and the itinerary detail page. */
export default function ReviewCard({ item, height = 380 }: { item: ReviewItem; height?: number }) {
  const t = useTranslations("testimonials");
  const locale = useLocale();
  const [bg, fg] = tintFor(item.authorName);
  const date = fmtDate(item.reviewDate, locale);
  const meta = [item.authorTitle, item.authorCountry].filter(Boolean);
  const ta = isTripadvisor(item.sourceDisplayName);

  return (
    <article className={`relative flex flex-col ${item.sourceUrl ? "transition-shadow hover:shadow-[0_12px_34px_rgba(62,21,2,.12)]" : ""}`} style={{ height, background: "#fff", border: "1px solid #e4ddd1", borderRadius: 18, padding: "26px 26px 22px" }}>
      {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={t("readOnSource", { source: item.sourceDisplayName || "" })} className="absolute inset-0 z-[5]" style={{ borderRadius: 18 }} />}
      <Quote size={30} style={{ position: "absolute", top: 22, right: 22, color: "rgba(196,143,43,.16)" }} fill="currentColor" stroke="none" />
      <div style={{ marginBottom: 14 }}>
        {ta
          ? <span className="inline-flex items-center" style={{ gap: 3 }} aria-label={`${item.rating} / 5`}>{Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < item.rating ? TA_GREEN : "#d6d3cd", display: "inline-block" }} />)}</span>
          : <span className="inline-flex" style={{ gap: 3 }} aria-label={`${item.rating} / 5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill={i < item.rating ? "#c48f2b" : "#e4ddd1"} stroke="none" />)}</span>}
      </div>
      {item.reviewTitle && (
        <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 17.5, lineHeight: 1.25, margin: "0 0 8px", paddingRight: 34, ...clamp(2) }}>{item.reviewTitle}</h3>
      )}
      <p style={{ color: "#4a3f34", fontSize: 14.5, lineHeight: 1.6, margin: 0, flex: 1, minHeight: 0, ...clamp(item.reviewTitle ? 6 : 8) }}>&ldquo;{item.message}&rdquo;</p>
      <div className="flex items-center justify-between" style={{ gap: 10, paddingTop: 16, marginTop: 14, borderTop: "1px solid #f1ece3" }}>
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
        {item.sourceDisplayName && (
          <span className="inline-flex items-center flex-shrink-0" style={{ gap: 6, fontSize: 11.5, fontWeight: 700, color: ta ? TA_GREEN : "#7a6f61", background: ta ? "rgba(0,170,108,.1)" : "#f1ece3", padding: "4px 10px", borderRadius: 20 }}>
            {ta && <span style={{ width: 8, height: 8, borderRadius: "50%", background: TA_GREEN, display: "inline-block" }} />}
            {item.sourceDisplayName}
          </span>
        )}
      </div>
    </article>
  );
}
