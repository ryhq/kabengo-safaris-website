import type { Metadata } from "next";
import { Check, Clock } from "lucide-react";
import { buildAlternates } from "@/lib/seo";
import { fetchTestimonySummary, fetchFeaturedTestimonies } from "@/lib/server-api";
import SafariPlanner from "@/components/planner/SafariPlanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Plan Your Safari",
    description:
      "Build your tailor-made Tanzania safari in about a minute — tell us what excites you, when you'd travel and your budget, and a Kabengo specialist replies within 24 hours.",
    alternates: buildAlternates(locale, "/plan"),
  };
}

const TRUST = ["Local expert guides", "Tailor-made & private", "Honest, transparent pricing", "Reply within 24 hrs"];
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
const GRASS =
  "M0 40 L0 30 L8 12 L15 30 L24 8 L32 30 L41 16 L49 30 L60 6 L69 30 L78 18 L86 30 L98 10 L107 30 L116 20 L124 30 L136 8 L145 30 L154 16 L162 30 L174 6 L183 30 L192 18 L200 30 L212 10 L221 30 L230 20 L238 30 L250 8 L259 30 L268 16 L276 30 L288 6 L297 30 L306 18 L314 30 L326 10 L335 30 L344 20 L352 30 L364 8 L373 30 L382 16 L390 30 L400 12 L400 40 Z";
const SERIF = "var(--font-source-serif), Georgia, serif";

export default async function PlanPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [summary, featured] = await Promise.all([fetchTestimonySummary(), fetchFeaturedTestimonies(locale)]);
  const hasRating = !!(summary && summary.reviewCount > 0);
  const quote = featured.find((t) => t.message && t.message.trim().length > 20) || null;

  return (
    <div style={{ background: "linear-gradient(165deg,#f1ece3,#faf8f5 60%)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(104px,13vh,132px) clamp(18px,5vw,44px) clamp(56px,8vw,88px)" }}>
        {/* intro */}
        <div style={{ maxWidth: 640, margin: "0 0 clamp(24px,4vw,38px)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, color: "#96631a", fontSize: 12, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 12 }}>
            <span style={{ width: 24, height: 1, background: "#96631a" }} />
            Plan Your Safari
          </div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(30px,4.6vw,48px)", lineHeight: 1.05, letterSpacing: "-.015em", margin: 0 }}>
            Build your dream Tanzania trip
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,40fr)_minmax(0,60fr)] gap-7 lg:gap-8 lg:items-stretch lg:h-[calc(100vh-240px)] lg:min-h-[520px]">
          {/* LEFT — persuasion rail */}
          <aside className="lg:min-h-0">
            <div style={{ position: "relative", height: "100%", borderRadius: 20, overflow: "hidden", background: "linear-gradient(160deg,#1b3717,#12280f)" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(18,40,15,.35),rgba(18,40,15,.9))" }} />
              <div style={{ position: "absolute", inset: 0, background: GRAIN, opacity: 0.14, mixBlendMode: "overlay", pointerEvents: "none" }} />
              <svg viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 34, opacity: 0.5, pointerEvents: "none" }}>
                <path d={GRASS} fill="rgba(39,78,34,.85)" />
              </svg>

              <div style={{ position: "relative", padding: "clamp(26px,3.4vw,40px)" }}>
                <div style={{ color: "#c48f2b", fontSize: 12, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 16 }}>Tailor-made Safaris</div>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#faf8f5", fontSize: "clamp(26px,3vw,34px)", lineHeight: 1.12, margin: "0 0 14px" }}>Your Tanzania safari, planned around you</h2>
                <p style={{ color: "rgba(242,236,224,.82)", fontSize: 15.5, lineHeight: 1.6, margin: "0 0 26px" }}>Answer a few quick questions and a local expert will hand-build a free, no-obligation proposal — itinerary, lodges and honest pricing, all shaped to you.</p>

                {/* trust points 2×2 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 18px", marginBottom: 26 }}>
                  {TRUST.map((t) => (
                    <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(196,143,43,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <Check size={13} color="#c48f2b" strokeWidth={3} />
                      </span>
                      <span style={{ color: "#faf8f5", fontSize: 14, fontWeight: 500, lineHeight: 1.35 }}>{t}</span>
                    </div>
                  ))}
                </div>

                {/* social proof — shown only when there's real review data */}
                {(hasRating || quote) && (
                  <div style={{ background: "rgba(242,236,224,.08)", border: "1px solid rgba(242,236,224,.16)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
                    {hasRating && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: quote ? 14 : 0 }}>
                        <span style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: 30, lineHeight: 1 }}>{summary!.ratingValue.toFixed(1)}</span>
                        <div>
                          <div style={{ color: "#c48f2b", fontSize: 16, letterSpacing: 2 }}>★★★★★</div>
                          <div style={{ color: "rgba(242,236,224,.7)", fontSize: 12.5 }}>based on {summary!.reviewCount} guest review{summary!.reviewCount === 1 ? "" : "s"}</div>
                        </div>
                      </div>
                    )}
                    {quote && (
                      <>
                        <p style={{ fontFamily: SERIF, fontStyle: "italic", color: "#faf8f5", fontSize: 15.5, lineHeight: 1.55, margin: "0 0 10px" }}>“{quote.message}”</p>
                        <div style={{ color: "rgba(242,236,224,.7)", fontSize: 13 }}>— {quote.authorName}{quote.authorCountry ? `, ${quote.authorCountry}` : ""}</div>
                      </>
                    )}
                  </div>
                )}

                {/* reassurance chip */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "rgba(196,143,43,.16)", border: "1px solid rgba(196,143,43,.35)", borderRadius: 24, padding: "9px 16px" }}>
                  <Clock size={15} color="#c48f2b" strokeWidth={2} />
                  <span style={{ color: "#f3e6c8", fontSize: 13, fontWeight: 600 }}>Free · No obligation · Takes ~2 minutes</span>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT — the stepper */}
          <div style={{ height: "100%", minHeight: 0 }}>
            <SafariPlanner embedded />
          </div>
        </div>
      </div>
    </div>
  );
}
