"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Star, BadgeCheck, Quote, MapPin, ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import PageHero from "@/components/ui/PageHero";
import SkeletonCard from "@/components/ui/SkeletonCard";
import FeaturedCarousel from "@/components/ui/FeaturedCarousel";
import ReviewCard from "@/components/ui/ReviewCard";
import TestimonyForm from "@/components/testimonials/TestimonyForm";
import { TripAdvisorReviewCard } from "@/components/ui/TripAdvisorBadge";
import { apiClient } from "@/lib/api";

interface TestimonyItem {
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
  primaryImageUrl?: string;
}

const SERIF = "var(--font-source-serif), Georgia, serif";
const PAGE_SIZE = 24;
const CARD_H = 380;
const TA_GREEN = "#00aa6c";
const ONE_LINE: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const clamp = (n: number): React.CSSProperties => ({ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: n, overflow: "hidden" });

const AVATAR_TINTS = [
  ["#e6ece2", "#274e22"],
  ["#f3e6c8", "#96631a"],
  ["#efe2d6", "#7a2f14"],
  ["#dfe8e4", "#1b3717"],
];
const hashStr = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
const tintFor = (name: string) => AVATAR_TINTS[hashStr(name) % AVATAR_TINTS.length];
const isTripadvisor = (s?: string) => (s || "").toLowerCase().includes("tripadvisor");

/** Gold star row for a rating (out of 5). */
function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex" style={{ gap: 3 }} aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} fill={i < rating ? "#c48f2b" : "#e4ddd1"} stroke="none" />
      ))}
    </span>
  );
}

/** TripAdvisor-style green bubbles. */
function Bubbles({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center" style={{ gap: 3 }} aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ width: size, height: size, borderRadius: "50%", background: i < rating ? TA_GREEN : "#d6d3cd", display: "inline-block" }} />
      ))}
    </span>
  );
}

/** Small source pill (e.g. TripAdvisor / Google / Website) — plain chip. */
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

export default function ReviewsPage() {
  const t = useTranslations("testimonials");
  const home = useTranslations("home");
  const nav = useTranslations("footer");
  const locale = useLocale();
  const [testimonies, setTestimonies] = useState<TestimonyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{ ratingValue: number; reviewCount: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/public/testimonies/summary`, { headers: { "Accept-Language": locale } });
        const d = res.data?.data;
        if (res.data?.success && d?.reviewCount > 0 && d?.averageRating) {
          setSummary({ ratingValue: d.averageRating, reviewCount: d.reviewCount });
        }
      } catch { /* aggregate optional */ }
    })();
  }, [locale]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiClient
      .get(`/public/testimonies?page=0&size=${PAGE_SIZE}`, { headers: { "Accept-Language": locale } })
      .then((res) => {
        if (!alive) return;
        const d = res.data?.data;
        setTestimonies(d?.testimonies || d || []);
      })
      .catch(() => alive && setTestimonies([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [locale]);

  /** Author line (avatar + name + verified + country/date). */
  const AuthorRow = ({ item }: { item: TestimonyItem }) => {
    const [bg, fg] = tintFor(item.authorName);
    const date = fmtDate(item.reviewDate, locale);
    const meta = [item.authorTitle, item.authorCountry].filter(Boolean);
    return (
      <div className="flex items-center" style={{ gap: 12 }}>
        <span className="flex items-center justify-center flex-shrink-0" style={{ width: 42, height: 42, borderRadius: "50%", background: bg, color: fg, fontFamily: SERIF, fontWeight: 700, fontSize: 15 }}>{initials(item.authorName)}</span>
        <div style={{ minWidth: 0 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontWeight: 700, color: "#2a2018", fontSize: 14.5, ...ONE_LINE }}>{item.authorName}</span>
            {item.isVerifiedBooking && (
              <span className="inline-flex items-center flex-shrink-0" style={{ gap: 3, fontSize: 11, fontWeight: 600, color: "#3a7a2a" }}><BadgeCheck size={13} strokeWidth={2.4} />{t("verified")}</span>
            )}
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

  /** Tall, truncating, clickable review card for the carousel. */
  const renderReviewCard = (item: TestimonyItem) => <ReviewCard item={item} height={CARD_H} />;

  return (
    <>
      <PageHero heroPage="TESTIMONIALS" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      {/* ===== Aggregate trust band ===== */}
      {summary && summary.reviewCount > 0 && (
        <section style={{ background: "#fff", borderBottom: "1px solid #e4ddd1", padding: "clamp(28px,4vw,40px) clamp(16px,5vw,56px)" }}>
          <div className="flex flex-col sm:flex-row items-center justify-center" style={{ maxWidth: 1100, margin: "0 auto", gap: "clamp(18px,4vw,48px)" }}>
            <div className="flex items-center" style={{ gap: 16 }}>
              <span style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(44px,7vw,60px)", lineHeight: 1 }}>{summary.ratingValue.toFixed(1)}</span>
              <div>
                <Stars rating={Math.round(summary.ratingValue)} size={20} />
                <p style={{ color: "#7a6f61", fontSize: 13.5, margin: "6px 0 0" }}>{t("basedOn", { count: summary.reviewCount })}</p>
              </div>
            </div>
            <div className="hidden sm:block" style={{ width: 1, height: 52, background: "#e4ddd1" }} />
            <div className="flex flex-wrap items-center justify-center" style={{ gap: "10px 22px" }}>
              <span className="inline-flex items-center" style={{ gap: 8, fontSize: 13.5, color: "#4a3f34" }}><Bubbles rating={5} /><span style={{ fontWeight: 700, color: TA_GREEN }}>Tripadvisor</span></span>
              <span className="inline-flex items-center" style={{ gap: 7, fontSize: 13.5, color: "#4a3f34", fontWeight: 600 }}><BadgeCheck size={16} strokeWidth={2.2} style={{ color: "#c48f2b" }} />TATO / TALA</span>
            </div>
          </div>
        </section>
      )}

      {/* ===== Reviews carousel ===== */}
      <section style={{ padding: "clamp(44px,6vw,80px) clamp(16px,5vw,56px)" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          {loading ? (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "clamp(18px,2.4vw,26px)" }}>
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} variant="testimony" />)}
            </div>
          ) : testimonies.length === 0 ? (
            <div style={{ textAlign: "center", maxWidth: 440, margin: "0 auto", padding: "clamp(30px,6vw,56px) 0" }}>
              <div className="mx-auto flex items-center justify-center" style={{ width: 76, height: 76, borderRadius: "50%", background: "linear-gradient(150deg,#e6ece2,#f3e6c8)", marginBottom: 22, color: "#274e22" }}><Quote size={30} strokeWidth={1.6} /></div>
              <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(22px,3vw,28px)", margin: "0 0 10px" }}>{t("emptyTitle")}</h3>
              <p style={{ color: "#7a6f61", fontSize: 15.5, lineHeight: 1.6, margin: "0 0 26px" }}>{t("emptyBody")}</p>
              <button type="button" onClick={() => document.getElementById("share-story")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 font-semibold rounded-lg cursor-pointer transition-colors hover:bg-brand-green" style={{ background: "#274e22", color: "#faf8f5", fontSize: 15, padding: "13px 26px" }}>
                <Quote size={15} style={{ transform: "rotate(180deg)" }} />{t("emptyCta")}
              </button>
            </div>
          ) : (
            <FeaturedCarousel
              title={t("reviewsHeading")}
              subtitle={t("reviewsSub")}
              items={testimonies}
              renderCard={renderReviewCard}
              prevLabel={t("prev")}
              nextLabel={t("next")}
            />
          )}
        </div>
      </section>

      {/* ===== Plan your safari CTA (converts the warmed lead) ===== */}
      <section style={{ background: "#3d1402", color: "#faf8f5", padding: "clamp(52px,7vw,88px) clamp(16px,5vw,56px)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(26px,4vw,42px)", lineHeight: 1.08, margin: "0 0 14px" }}>{t("ctaTitle")}</h2>
          <p style={{ color: "rgba(242,236,224,.82)", fontSize: 17, lineHeight: 1.55, margin: "0 0 30px" }}>{t("ctaBody")}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/plan" className="inline-flex items-center gap-2 font-semibold rounded-lg" style={{ background: "#c48f2b", color: "#3d1402", fontSize: 16, padding: "16px 30px", boxShadow: "0 10px 28px rgba(196,143,43,.4)" }}>{home("ctaCta")}<ArrowRight size={17} strokeWidth={2.3} /></Link>
            <a href="https://wa.me/255786345408" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold rounded-lg" style={{ background: "rgba(242,236,224,.08)", color: "#fff", border: "1.5px solid rgba(242,236,224,.4)", fontSize: 16, padding: "15px 28px" }}><MessageCircle size={18} strokeWidth={2.2} />{nav("whatsapp")}</a>
          </div>
        </div>
      </section>

      {/* ===== Leave a review — Tripadvisor + share-your-story (one row on large screens) ===== */}
      <section id="share-story" style={{ background: "#faf8f5", borderTop: "1px solid #e4ddd1", padding: "clamp(44px,6vw,80px) clamp(16px,5vw,56px)", scrollMarginTop: 96 }}>
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.5fr] items-stretch" style={{ maxWidth: 1220, margin: "0 auto", gap: "clamp(20px,2.5vw,32px)" }}>
          <TripAdvisorReviewCard />
          <TestimonyForm />
        </div>
      </section>
    </>
  );
}
