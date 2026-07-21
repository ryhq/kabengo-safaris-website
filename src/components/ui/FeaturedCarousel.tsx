"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const SERIF = "var(--font-source-serif), Georgia, serif";
const GAP = 16;
const AUTO_MS = 3500;

/**
 * Auto-advancing featured strip (/safaris, /parks). Uses a native scroll-snap
 * rail with CSS flex-basis so cards are responsive without measuring widths;
 * prev/next + dots + auto-advance drive the scroll. Pauses on hover.
 */
export default function FeaturedCarousel<T>({
  title, subtitle, items, renderCard, prevLabel = "Previous", nextLabel = "Next", wide = false, autoMs = AUTO_MS,
}: {
  title: string;
  subtitle?: string;
  items: T[];
  renderCard: (item: T) => ReactNode;
  prevLabel?: string;
  nextLabel?: string;
  /** Wider cards (horizontal detail cards): 2-up on desktop instead of 3. */
  wide?: boolean;
  /** Auto-advance interval in ms (larger = slower). */
  autoMs?: number;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [winW, setWinW] = useState(1280);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const r = () => setWinW(window.innerWidth);
    r();
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  const perView = wide ? (winW >= 900 ? 2 : 1) : (winW >= 1080 ? 3 : winW >= 680 ? 2 : 1);
  const basis = `calc((100% - ${(perView - 1) * GAP}px) / ${perView})`;
  const pages = Math.max(1, items.length - perView + 1);
  const showNav = pages > 1;

  // Scroll step = the real rendered width of one card + gap.
  const step = () => {
    const el = railRef.current;
    const c = el?.querySelector<HTMLElement>("[data-c]");
    return c ? c.getBoundingClientRect().width + GAP : 0;
  };
  const goTo = (i: number) => {
    const el = railRef.current;
    if (!el) return;
    const idx = Math.max(0, Math.min(i, pages - 1));
    el.scrollTo({ left: idx * step(), behavior: "smooth" });
  };
  const onScroll = () => {
    const el = railRef.current;
    const s = step();
    if (el && s > 0) setActive(Math.round(el.scrollLeft / s));
  };

  useEffect(() => {
    if (paused || pages <= 1) return;
    const id = setInterval(() => {
      setActive((a) => {
        const n = a + 1 >= pages ? 0 : a + 1;
        railRef.current?.scrollTo({ left: n * step(), behavior: "smooth" });
        return n;
      });
    }, autoMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, pages, autoMs]);

  if (!items.length) return null;

  return (
    <section aria-label={title}>
      <div className="flex items-end justify-between flex-wrap" style={{ gap: 14, marginBottom: 18 }}>
        <div className="flex items-center flex-wrap" style={{ gap: 10 }}>
          <Star size={18} fill="#c48f2b" stroke="none" />
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(20px,2.6vw,26px)", margin: 0 }}>{title}</h2>
          {subtitle && <span style={{ color: "#7a6f61", fontSize: 13.5 }}>— {subtitle}</span>}
        </div>
        {showNav && (
          <div className="flex" style={{ gap: 7 }}>
            <button onClick={() => goTo(active - 1)} aria-label={prevLabel} className="flex items-center justify-center cursor-pointer" style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #e4ddd1", background: "#fff", color: "#5a1e03" }}><ChevronLeft size={16} strokeWidth={2.2} /></button>
            <button onClick={() => goTo(active + 1)} aria-label={nextLabel} className="flex items-center justify-center cursor-pointer" style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #274e22", background: "#274e22", color: "#faf8f5" }}><ChevronRight size={16} strokeWidth={2.2} /></button>
          </div>
        )}
      </div>
      {/* outer clips the rail's hidden scrollbar (paddingBottom + negative margin) */}
      <div style={{ overflow: "hidden" }}>
        <div ref={railRef} onScroll={onScroll} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
          style={{ display: "flex", gap: GAP, overflowX: "auto", overflowY: "hidden", scrollSnapType: "x mandatory", scrollbarWidth: "none", paddingBottom: 24, marginBottom: -24 }}>
          {items.map((it, i) => (
            <div key={i} data-c style={{ flex: `0 0 ${basis}`, scrollSnapAlign: "start" }}>{renderCard(it)}</div>
          ))}
        </div>
      </div>
      {showNav && (
        <div className="flex justify-center" style={{ gap: 8, marginTop: 20 }}>
          {Array.from({ length: pages }).map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`${i + 1}`} aria-current={i === active} className="cursor-pointer" style={{ height: 7, width: i === active ? 26 : 7, borderRadius: 7, border: "none", background: i === active ? "#c48f2b" : "#e4ddd1", padding: 0, transition: "width .3s,background .3s" }} />
          ))}
        </div>
      )}
    </section>
  );
}
