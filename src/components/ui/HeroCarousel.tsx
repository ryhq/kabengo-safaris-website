"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { Hero } from "@/types";

const SLIDE_DURATION = 6500;

/** Fallback backgrounds when a CMS slide has no primaryImageUrl. */
const BG_FALLBACKS = [
  "linear-gradient(120deg,#6b4a1f,#3d1402 60%,#1b3717)",
  "linear-gradient(120deg,#4a6b39,#274e22 55%,#1b3717)",
  "linear-gradient(120deg,#7a3a12,#5a1e03 58%,#3e3117)",
];

interface HeroCarouselProps {
  heroes: Hero[];
  variant?: "full" | "page";
  fallbackTitle: string;
  fallbackSubtitle?: string;
  fallbackCtaText?: string;
  fallbackCtaLink?: string;
  showScrollIndicator?: boolean;
}

const pad = (n: number) => String(n + 1).padStart(2, "0");
const rise = (delay: number): React.CSSProperties => ({ animation: "hero-rise .9s cubic-bezier(.2,.7,.2,1) both", animationDelay: `${delay}s` });
const fade = (delay: number): React.CSSProperties => ({ animation: "hero-fade .7s ease both", animationDelay: `${delay}s` });
const lineClamp = (lines: number): React.CSSProperties =>
  ({ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden" }) as React.CSSProperties;

/**
 * Sub-page hero — mirrors the HomeHero design language (directional gradient
 * scrims, lower-left branded column: gold eyebrow rule, italic gold subtitle,
 * serif title, gold CTA) at a shorter page-hero height.
 */
export default function HeroCarousel({
  heroes,
  fallbackTitle,
  fallbackSubtitle,
  fallbackCtaText,
  fallbackCtaLink,
}: HeroCarouselProps) {
  const t = useTranslations("hero");

  const slides = heroes.length
    ? heroes.map((h) => ({ title: h.title, subtitle: h.subtitle, description: h.description, ctaText: h.ctaText, ctaLink: h.ctaLink, primaryImageUrl: h.primaryImageUrl }))
    : [{ title: fallbackTitle, subtitle: fallbackSubtitle, description: undefined as string | undefined, ctaText: fallbackCtaText, ctaLink: fallbackCtaLink, primaryImageUrl: undefined as string | undefined }];

  const count = slides.length;
  const [i, setI] = useState(0);
  const [tick, setTick] = useState(0);

  const advance = useCallback((dir: number) => { setI((prev) => (prev + dir + count) % count); setTick((x) => x + 1); }, [count]);
  const goTo = useCallback((index: number) => { setI(((index % count) + count) % count); setTick((x) => x + 1); }, [count]);

  useEffect(() => {
    if (count <= 1) return;
    const id = setTimeout(() => advance(1), SLIDE_DURATION);
    return () => clearTimeout(id);
  }, [i, tick, count, advance]);

  const active = slides[i];
  const cream = "rgba(250,248,245,";

  return (
    <section
      aria-label={fallbackTitle}
      style={{ position: "relative", width: "100%", height: "clamp(420px,64vh,660px)", minHeight: 380, overflow: "hidden", background: "#3d1402" }}
    >
      {/* stacked image layers — crossfade + Ken Burns */}
      {slides.map((s, idx) => {
        const on = idx === i;
        return (
          <div key={idx} aria-hidden={!on} style={{ position: "absolute", inset: 0, opacity: on ? 1 : 0, transition: "opacity 1.1s ease" }}>
            <div
              style={{
                position: "absolute", inset: 0, backgroundSize: "cover", backgroundPosition: "center",
                backgroundImage: s.primaryImageUrl ? `url('${s.primaryImageUrl}')` : BG_FALLBACKS[idx % BG_FALLBACKS.length],
                animation: on ? "hero-kenburns 9s ease-out both" : "none",
              }}
            />
          </div>
        );
      })}

      {/* signature directional scrims (legibility, same on every slide) */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(20,12,4,.82) 0%,rgba(20,12,4,.52) 42%,rgba(20,12,4,.12) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(20,12,4,.8) 0%,rgba(20,12,4,.2) 38%,transparent 64%)" }} />

      {/* thin gold horizon line + acacia motif */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "16%", height: 1, background: "linear-gradient(90deg,transparent,rgba(196,143,43,.45) 30%,rgba(196,143,43,.45) 70%,transparent)", pointerEvents: "none" }} />
      <svg viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" style={{ position: "absolute", right: "5%", bottom: "16%", width: "min(220px,28vw)", height: "auto", opacity: 0.5, pointerEvents: "none" }}>
        <g fill="none" stroke="rgba(196,143,43,.95)" strokeWidth={1.4} strokeLinecap="round">
          <path d="M118 80V44" />
          <path d="M118 46c-9-3-19-8-26-9M118 46c9-4 20-7 30-8M118 52c-6-2-13-4-18-4M118 52c7-2 14-4 20-3" />
        </g>
        <path d="M70 40c14-9 44-11 64-2 10-5 30-6 44 1-8-6-26-9-40-6-16-8-52-6-68 7Z" fill="rgba(196,143,43,.82)" />
      </svg>

      {/* content column — lower-left, asymmetric */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", zIndex: 4 }}>
        <div style={{ width: "100%", maxWidth: 1340, margin: "0 auto", padding: "0 clamp(20px,5vw,60px) clamp(72px,12vh,120px)" }}>
          <div style={{ maxWidth: 640 }}>
            <div key={`slide-${i}-${tick}`}>
              {active.subtitle && (
                <div className="hero-rise" style={{ color: "#c48f2b", fontFamily: "var(--font-source-serif), Georgia, serif", fontStyle: "italic", fontSize: "clamp(15px,1.8vw,19px)", marginBottom: 10, ...lineClamp(2), ...rise(0.25) }}>{active.subtitle}</div>
              )}

              <h1 className="hero-rise" style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 700, color: "#fff", fontSize: "clamp(30px,5vw,60px)", lineHeight: 1.06, letterSpacing: "-.02em", margin: 0, textShadow: "0 2px 30px rgba(20,12,4,.5)", ...lineClamp(3), ...rise(0.4) }}>{active.title}</h1>

              {active.description && (
                <p className="hero-rise" style={{ color: `${cream}.9)`, fontSize: "clamp(15px,1.6vw,18px)", lineHeight: 1.6, maxWidth: 520, margin: "18px 0 0", textShadow: "0 1px 14px rgba(20,12,4,.5)", ...lineClamp(3), ...rise(0.55) }}>{active.description}</p>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 30 }}>
              {active.ctaText && active.ctaLink && (
                <Link key={`cta-${i}-${tick}`} href={active.ctaLink} className="hero-fade" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 16, borderRadius: 6, padding: "15px 26px", maxWidth: "100%", boxShadow: "0 10px 30px rgba(196,143,43,.4)", ...fade(0.45) }}>
                  <span style={lineClamp(1)}>{active.ctaText}</span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* slide dots (only when multiple CMS heroes) */}
      {count > 1 && (
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: "clamp(28px,5vh,44px)", display: "flex", gap: 8, zIndex: 6 }}>
          {slides.map((s, idx) => {
            const on = idx === i;
            return (
              <button key={idx} onClick={() => goTo(idx)} aria-label={`${t("goToSlide", { n: idx + 1 })}: ${s.title}`} aria-current={on ? "true" : "false"} style={{ position: "relative", height: 4, width: on ? 34 : 12, borderRadius: 4, border: "none", padding: 0, cursor: "pointer", background: "rgba(250,248,245,.3)", overflow: "hidden", transition: "width .3s" }}>
                {on && <span key={`${idx}-${tick}`} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 0, background: "#c48f2b", animation: `hero-rail ${SLIDE_DURATION}ms linear forwards` }} />}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
