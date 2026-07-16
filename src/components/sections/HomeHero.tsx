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

interface HomeHeroProps {
  heroes: Hero[];
}

const pad = (n: number) => String(n + 1).padStart(2, "0");

// Staggered reveal helper — one keyframe, cascading delays.
const rise = (delay: number): React.CSSProperties => ({
  animation: `hero-rise .9s cubic-bezier(.2,.7,.2,1) both`,
  animationDelay: `${delay}s`,
});

// Fade-only reveal (no movement) — keeps the element's position fixed.
const fade = (delay: number): React.CSSProperties => ({
  animation: `hero-fade .7s ease both`,
  animationDelay: `${delay}s`,
});

// Cap long CMS text to N lines with an ellipsis so the hero never overflows.
const lineClamp = (lines: number): React.CSSProperties =>
  ({ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden" }) as React.CSSProperties;

export default function HomeHero({ heroes }: HomeHeroProps) {
  const t = useTranslations("hero");

  // Build slides from CMS heroes, or a single translated fallback slide.
  const slides = heroes.length
    ? heroes.map((h) => ({
        title: h.title,
        subtitle: h.subtitle,
        description: h.description,
        ctaText: h.ctaText,
        ctaLink: h.ctaLink,
        primaryImageUrl: h.primaryImageUrl,
      }))
    : [{ title: t("title"), subtitle: t("subtitle"), description: undefined, ctaText: t("cta"), ctaLink: "/safaris", primaryImageUrl: undefined }];

  const count = slides.length;
  const [i, setI] = useState(0);
  const [tick, setTick] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [descOpen, setDescOpen] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      setI(((index % count) + count) % count);
      setTick((x) => x + 1);
    },
    [count],
  );
  const advance = useCallback(
    (dir: number) => {
      setI((prev) => (prev + dir + count) % count);
      setTick((x) => x + 1);
    },
    [count],
  );

  // Autoplay — restarts whenever the slide changes (i or manual tick).
  useEffect(() => {
    if (count <= 1) return;
    const id = setTimeout(() => advance(1), SLIDE_DURATION);
    return () => clearTimeout(id);
  }, [i, tick, count, advance]);

  // Keyboard nav + mobile breakpoint.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advance(1);
      if (e.key === "ArrowLeft") advance(-1);
    };
    const onResize = () => setIsMobile(window.innerWidth < 680);
    onResize();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [advance]);

  const active = slides[i];
  const cream = "rgba(250,248,245,";

  return (
    <section
      aria-label="Featured safaris"
      style={{
        position: "relative",
        width: "100%",
        height: "100svh",
        minHeight: 600,
        overflow: "hidden",
        background: "#3d1402",
      }}
    >
      {/* ── Stacked image layers (crossfade + Ken Burns) ── */}
      {slides.map((s, idx) => {
        const on = idx === i;
        return (
          <div
            key={idx}
            aria-hidden={!on}
            style={{ position: "absolute", inset: 0, opacity: on ? 1 : 0, transition: "opacity 1.1s ease" }}
          >
            <div
              className={on ? "hero-kb" : undefined}
              style={{
                position: "absolute",
                inset: 0,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundImage: s.primaryImageUrl ? `url('${s.primaryImageUrl}')` : BG_FALLBACKS[idx % BG_FALLBACKS.length],
                animation: on ? "hero-kenburns 9s ease-out both" : "none",
              }}
            />
          </div>
        );
      })}

      {/* ── Fixed signature overlay (same on every slide) ── */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(20,12,4,.82) 0%,rgba(20,12,4,.52) 42%,rgba(20,12,4,.12) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(20,12,4,.78) 0%,rgba(20,12,4,.18) 34%,transparent 60%)" }} />

      {/* thin gold horizon line + gold acacia silhouette motif */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "19%", height: 1, background: "linear-gradient(90deg,transparent,rgba(196,143,43,.5) 30%,rgba(196,143,43,.5) 70%,transparent)", pointerEvents: "none" }} />
      <svg viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" style={{ position: "absolute", right: "5%", bottom: "19%", width: "min(280px,34vw)", height: "auto", opacity: 0.62, pointerEvents: "none" }}>
        <g fill="none" stroke="rgba(196,143,43,.95)" strokeWidth={1.4} strokeLinecap="round">
          <path d="M118 80V44" />
          <path d="M118 46c-9-3-19-8-26-9M118 46c9-4 20-7 30-8M118 52c-6-2-13-4-18-4M118 52c7-2 14-4 20-3" />
        </g>
        <path d="M70 40c14-9 44-11 64-2 10-5 30-6 44 1-8-6-26-9-40-6-16-8-52-6-68 7Z" fill="rgba(196,143,43,.82)" />
      </svg>

      {/* ── Content column — asymmetric, lower-left ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", zIndex: 4 }}>
        <div style={{ width: "100%", maxWidth: 1340, margin: "0 auto", padding: "0 clamp(20px,5vw,60px) clamp(128px,19vh,200px)" }}>
          <div style={{ maxWidth: 640 }}>
            {/* brand eyebrow — fixed across slides: animates once on load, does NOT replay */}
            <div className="hero-rise" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 22, ...rise(0.1) }}>
              <span style={{ width: 28, height: 1, background: "#c48f2b", flexShrink: 0 }} />
              <span style={{ color: "#f3e6c8", fontSize: 12, fontWeight: 600, letterSpacing: ".24em", textTransform: "uppercase" }}>{t("eyebrow")}</span>
            </div>

            {/* per-slide content — key remounts this block on slide change so it replays */}
            <div key={`slide-${i}-${tick}`}>
              {active.subtitle && (
                <div className="hero-rise hero-sub" style={{ color: "#c48f2b", fontFamily: "var(--font-source-serif), Georgia, serif", fontStyle: "italic", fontSize: "clamp(16px,2vw,20px)", marginBottom: 12, ...lineClamp(2), ...rise(0.25) }}>{active.subtitle}</div>
              )}

              <h1 className="hero-rise" style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 700, color: "#fff", fontSize: "clamp(34px,6.4vw,78px)", lineHeight: 1.05, letterSpacing: "-.02em", margin: 0, textShadow: "0 2px 30px rgba(20,12,4,.5)", ...lineClamp(3), ...rise(0.4) }}>{active.title}</h1>

              {active.description && (
                <p
                  className="hero-rise hero-desc"
                  onMouseEnter={() => setDescOpen(true)}
                  onMouseLeave={() => setDescOpen(false)}
                  style={{ color: `${cream}.9)`, fontSize: "clamp(16px,1.7vw,19px)", lineHeight: 1.6, maxWidth: 520, margin: "22px 0 0", textShadow: "0 1px 14px rgba(20,12,4,.5)", cursor: "default", ...(descOpen ? {} : lineClamp(4)), ...rise(0.55) }}
                >{active.description}</p>
              )}
            </div>

            {/* CTA row — primary cross-fades in place each slide (keyed); "Plan a Custom Safari" animates once on load only */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 34 }}>
              {active.ctaText && active.ctaLink && (
                <Link key={`cta-${i}-${tick}`} href={active.ctaLink} className="hero-fade" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 16, borderRadius: 6, padding: "16px 28px", maxWidth: "100%", boxShadow: "0 10px 30px rgba(196,143,43,.4)", transition: "background .2s,color .2s,transform .2s", ...fade(0.45) }}>
                  <span style={lineClamp(1)}>{active.ctaText}</span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              )}
              <Link href="/plan" className="hero-rise" style={{ display: "inline-flex", alignItems: "center", background: `${cream}.07)`, color: "#faf8f5", fontWeight: 600, fontSize: 16, border: "1.5px solid rgba(250,248,245,.55)", borderRadius: 6, padding: "15px 26px", maxWidth: "100%", backdropFilter: "blur(4px)", transition: "background .2s,border-color .2s", whiteSpace: "nowrap", ...rise(0.7) }}>
                {t("planCustom")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Refined index navigator (bottom band, raised clear of the grass) ── */}
      {count > 1 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 6 }}>
          <div style={{ maxWidth: 1340, margin: "0 auto", padding: "0 clamp(20px,5vw,60px) clamp(64px,8vw,92px)", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            {/* numbered index list */}
            <div style={{ display: "flex", alignItems: "stretch", gap: "clamp(14px,3vw,40px)" }}>
              {slides.map((s, idx) => {
                const on = idx === i;
                return (
                  <button
                    key={idx}
                    onClick={() => goTo(idx)}
                    aria-label={`${t("goToSlide", { n: idx + 1 })}: ${s.title}`}
                    aria-current={on ? "true" : "false"}
                    style={{ position: "relative", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "14px 0 0", minWidth: 0, opacity: on ? 1 : 0.5, transition: "opacity .3s" }}
                  >
                    <div style={{ height: 2, width: "clamp(46px,9vw,96px)", background: "rgba(250,248,245,.22)", overflow: "hidden", borderRadius: 2 }}>
                      <div
                        key={on ? `${idx}-${tick}` : idx}
                        style={{
                          height: "100%",
                          background: "#c48f2b",
                          width: on ? "0%" : idx < i ? "100%" : "0%",
                          animation: on ? `hero-rail ${SLIDE_DURATION}ms linear forwards` : "none",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 11 }}>
                      <span style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 600, fontSize: 14, color: "#c48f2b" }}>{pad(idx)}</span>
                      {!isMobile && <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(250,248,245,.92)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "clamp(80px,18vw,220px)" }}>{s.title}</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* prev / counter / next */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 2 }}>
              <div style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontSize: 15, color: "rgba(250,248,245,.75)", letterSpacing: ".04em" }}>
                <span style={{ color: "#fff", fontWeight: 600 }}>{pad(i)}</span> / {pad(count - 1)}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => advance(-1)} aria-label={t("prevSlide")} style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(250,248,245,.08)", border: "1px solid rgba(250,248,245,.3)", color: "#faf8f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                </button>
                <button onClick={() => advance(1)} aria-label={t("nextSlide")} style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(250,248,245,.08)", border: "1px solid rgba(250,248,245,.3)", color: "#faf8f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
