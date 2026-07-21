"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Star, BadgeCheck, Quote, MapPin, ArrowDown, ExternalLink } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SkeletonCard from "@/components/ui/SkeletonCard";
import TestimonyForm from "@/components/testimonials/TestimonyForm";
import { TripAdvisorReviewSection } from "@/components/ui/TripAdvisorBadge";
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
const PAGE_SIZE = 6;
const TA_GREEN = "#00aa6c";
const ONE_LINE: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

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

/** Small source pill (e.g. TripAdvisor / Google / Website). Becomes a
 *  new-tab link to the original review when a sourceUrl is provided. */
function SourceBadge({ source, href, ariaLabel }: { source?: string; href?: string; ariaLabel?: string }) {
  if (!source) return null;
  const ta = isTripadvisor(source);
  const style: React.CSSProperties = { gap: 6, fontSize: 11.5, fontWeight: 700, color: ta ? TA_GREEN : "#7a6f61", background: ta ? "rgba(0,170,108,.1)" : "#f1ece3", padding: "4px 10px", borderRadius: 20, letterSpacing: ".01em", textDecoration: "none" };
  const dot = ta && <span style={{ width: 8, height: 8, borderRadius: "50%", background: TA_GREEN, display: "inline-block" }} />;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel || source} className="inline-flex items-center relative z-[6] transition-opacity hover:opacity-80" style={style}>
        {dot}{source}<ExternalLink size={11} strokeWidth={2.4} />
      </a>
    );
  }
  return (
    <span className="inline-flex items-center" style={style}>
      {dot}{source}
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
  const locale = useLocale();
  const [testimonies, setTestimonies] = useState<TestimonyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
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
        setTotalItems(d?.totalItems || 0);
        setCurrentPage(0);
      })
      .catch(() => alive && setTestimonies([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [locale]);

  const hasMore = testimonies.length < totalItems;
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = currentPage + 1;
      const res = await apiClient.get(`/public/testimonies?page=${next}&size=${PAGE_SIZE}`, { headers: { "Accept-Language": locale } });
      const d = res.data?.data;
      const more: TestimonyItem[] = d?.testimonies || d || [];
      setTestimonies((prev) => {
        const seen = new Set(prev.map((x) => `${x.authorName}-${x.reviewDate}-${x.message.slice(0, 20)}`));
        return [...prev, ...more.filter((x) => !seen.has(`${x.authorName}-${x.reviewDate}-${x.message.slice(0, 20)}`))];
      });
      setCurrentPage(next);
    } catch { /* ignore */ } finally { setLoadingMore(false); }
  };

  const featured = testimonies[0] ?? null;
  const rest = testimonies.slice(1);

  const AuthorRow = ({ item, dark = false }: { item: TestimonyItem; dark?: boolean }) => {
    const [bg, fg] = tintFor(item.authorName);
    const date = fmtDate(item.reviewDate, locale);
    const meta = [item.authorTitle, item.authorCountry].filter(Boolean);
    return (
      <div className="flex items-center" style={{ gap: 12 }}>
        <span className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: "50%", background: bg, color: fg, fontFamily: SERIF, fontWeight: 700, fontSize: 15 }}>{initials(item.authorName)}</span>
        <div style={{ minWidth: 0 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontWeight: 700, color: dark ? "#fff" : "#2a2018", fontSize: 15, ...ONE_LINE }}>{item.authorName}</span>
            {item.isVerifiedBooking && (
              <span className="inline-flex items-center flex-shrink-0" style={{ gap: 3, fontSize: 11, fontWeight: 600, color: "#3a7a2a" }}><BadgeCheck size={13} strokeWidth={2.4} />{t("verified")}</span>
            )}
          </div>
          <div style={{ color: dark ? "rgba(242,236,224,.7)" : "#7a6f61", fontSize: 12.5, ...ONE_LINE }}>
            {meta.length > 0 && <span className="inline-flex items-center" style={{ gap: 4 }}>{item.authorCountry && <MapPin size={11} />}{meta.join(" · ")}</span>}
            {meta.length > 0 && date && <span> · </span>}
            {date}
          </div>
        </div>
      </div>
    );
  };

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

      {/* ===== Featured review ===== */}
      {!loading && featured && (
        <section style={{ background: "#f1ece3", padding: "clamp(48px,7vw,84px) clamp(16px,5vw,56px)" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <Quote size={54} style={{ color: "rgba(196,143,43,.28)", margin: "0 auto 18px", display: "block" }} fill="currentColor" stroke="none" />
            <div className="flex justify-center" style={{ marginBottom: 18 }}>
              {isTripadvisor(featured.sourceDisplayName) ? <Bubbles rating={featured.rating} size={18} /> : <Stars rating={featured.rating} size={20} />}
            </div>
            {featured.reviewTitle && (
              <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(19px,2.4vw,26px)", lineHeight: 1.2, margin: "0 0 14px", textWrap: "balance" }}>{featured.reviewTitle}</h2>
            )}
            <blockquote style={{ fontFamily: SERIF, fontStyle: "italic", color: "#3a3129", fontSize: "clamp(18px,2.5vw,26px)", lineHeight: 1.45, margin: "0 0 26px", maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
              &ldquo;{featured.message}&rdquo;
            </blockquote>
            <div className="flex flex-col items-center" style={{ gap: 10 }}>
              <AuthorRow item={featured} />
              {featured.sourceDisplayName && <SourceBadge source={featured.sourceDisplayName} href={featured.sourceUrl} ariaLabel={t("readOnSource", { source: featured.sourceDisplayName })} />}
            </div>
          </div>
        </section>
      )}

      {/* ===== Reviews grid ===== */}
      <section style={{ padding: "clamp(44px,6vw,80px) clamp(16px,5vw,56px)" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          {!loading && (rest.length > 0 || featured) && (
            <div style={{ textAlign: "center", marginBottom: "clamp(30px,4vw,44px)" }}>
              <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(24px,3.4vw,36px)", margin: "0 0 8px" }}>{t("reviewsHeading")}</h2>
              <p style={{ color: "#7a6f61", fontSize: 16, margin: 0 }}>{t("reviewsSub")}</p>
            </div>
          )}

          {loading ? (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "clamp(18px,2.4vw,26px)" }}>
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} variant="testimony" />)}
            </div>
          ) : rest.length === 0 && !featured ? (
            <div style={{ textAlign: "center", maxWidth: 440, margin: "0 auto", padding: "clamp(30px,6vw,56px) 0" }}>
              <div className="mx-auto flex items-center justify-center" style={{ width: 76, height: 76, borderRadius: "50%", background: "linear-gradient(150deg,#e6ece2,#f3e6c8)", marginBottom: 22, color: "#274e22" }}><Quote size={30} strokeWidth={1.6} /></div>
              <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(22px,3vw,28px)", margin: "0 0 10px" }}>{t("emptyTitle")}</h3>
              <p style={{ color: "#7a6f61", fontSize: 15.5, lineHeight: 1.6, margin: "0 0 26px" }}>{t("emptyBody")}</p>
              <button type="button" onClick={() => document.getElementById("share-story")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 font-semibold rounded-lg cursor-pointer transition-colors hover:bg-brand-green" style={{ background: "#274e22", color: "#faf8f5", fontSize: 15, padding: "13px 26px" }}>
                <Quote size={15} style={{ transform: "rotate(180deg)" }} />{t("emptyCta")}
              </button>
            </div>
          ) : rest.length > 0 ? (
            <>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "clamp(18px,2.4vw,26px)" }}>
                {rest.map((item, i) => (
                  <article key={`r-${i}`} className="relative flex flex-col" style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 16, padding: "24px 24px 22px" }}>
                    <Quote size={30} style={{ position: "absolute", top: 20, right: 20, color: "rgba(196,143,43,.16)" }} fill="currentColor" stroke="none" />
                    <div className="flex items-center justify-between" style={{ gap: 10, marginBottom: 12 }}>
                      {isTripadvisor(item.sourceDisplayName) ? <Bubbles rating={item.rating} /> : <Stars rating={item.rating} />}
                    </div>
                    {item.reviewTitle && (
                      <h3 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 17, lineHeight: 1.25, margin: "0 0 8px", paddingRight: 34, textWrap: "balance" }}>{item.reviewTitle}</h3>
                    )}
                    <p style={{ color: "#4a3f34", fontSize: 15, lineHeight: 1.62, margin: "0 0 20px", flex: 1 }}>&ldquo;{item.message}&rdquo;</p>
                    <div style={{ paddingTop: 16, borderTop: "1px solid #f1ece3" }}>
                      <div className="flex items-center justify-between" style={{ gap: 10 }}>
                        <AuthorRow item={item} />
                        {item.sourceDisplayName && <div className="flex-shrink-0"><SourceBadge source={item.sourceDisplayName} href={item.sourceUrl} ariaLabel={t("readOnSource", { source: item.sourceDisplayName })} /></div>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center" style={{ marginTop: "clamp(30px,4vw,44px)" }}>
                  <button onClick={loadMore} disabled={loadingMore} className="inline-flex items-center gap-2 cursor-pointer transition-colors hover:bg-brand-green hover:text-brand-cream disabled:opacity-60" style={{ background: "none", color: "#274e22", fontWeight: 600, fontSize: 15, border: "1.5px solid #274e22", borderRadius: 8, padding: "14px 30px" }}>{loadingMore ? "…" : t("showMore")}<ArrowDown size={16} strokeWidth={2.2} /></button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>

      {/* ===== Share your story ===== */}
      <section id="share-story" style={{ background: "#faf8f5", borderTop: "1px solid #e4ddd1", padding: "clamp(44px,6vw,80px) clamp(16px,5vw,56px)", scrollMarginTop: 96 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <TestimonyForm />
        </div>
      </section>

      {/* ===== Rate us on TripAdvisor ===== */}
      <TripAdvisorReviewSection />
    </>
  );
}
