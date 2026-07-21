"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Img { imageUrl: string; altText?: string; caption?: string }

/**
 * Continuously-scrolling photo "wheel": the rail auto-scrolls forever (seamless
 * loop via a duplicated track) but the visitor can swipe/drag through it, and
 * clicking a photo opens a full-screen lightbox with prev/next + counter.
 * Auto-scroll pauses on hover / while interacting and resumes on release.
 */
export default function PhotoWheel({
  images, label, speed = 0.5, itemWidth = 300, itemHeight = 220,
}: {
  images: Img[];
  label?: string;
  speed?: number;
  itemWidth?: number;
  itemHeight?: number;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const posRef = useRef(0); // float accumulator — scrollLeft reads back as an integer, so track position ourselves
  const drag = useRef({ x: 0, left: 0, moved: 0 });
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const n = images.length;
  const loop = n > 0 ? [...images, ...images] : [];
  const STEP = itemWidth + 16; // tile width + gap
  const syncActive = (pos: number) => {
    const idx = n > 0 ? ((Math.round(pos / STEP) % n) + n) % n : 0;
    if (idx !== activeRef.current) { activeRef.current = idx; setActive(idx); }
  };

  // continuous auto-scroll (steady speed, seamless loop)
  useEffect(() => {
    if (n === 0) return;
    let raf = 0;
    const tick = () => {
      const el = railRef.current;
      if (el && !pausedRef.current && !draggingRef.current) {
        const half = el.scrollWidth / 2;
        if (half > 0) {
          posRef.current += speed;
          if (posRef.current >= half) posRef.current -= half;
          el.scrollLeft = posRef.current;
          syncActive(posRef.current);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n, speed]);

  const pauseBriefly = () => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { pausedRef.current = false; }, 1400);
  };

  // seamless wrap for native scroll / swipe; keep the float accumulator in sync when user-driven
  const onScroll = () => {
    const el = railRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
    if (pausedRef.current || draggingRef.current) posRef.current = el.scrollLeft;
    syncActive(el.scrollLeft);
  };

  // mouse drag-to-scroll (touch uses native scrolling). No pointer capture — it
  // would swallow the click on the child image button.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current.moved = 0;
    if (e.pointerType !== "mouse") { pauseBriefly(); return; }
    const el = railRef.current; if (!el) return;
    draggingRef.current = true;
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: 0 };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const el = railRef.current; if (!el) return;
    const dx = e.clientX - drag.current.x;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    let left = drag.current.left - dx;
    const half = el.scrollWidth / 2;
    if (half > 0) { if (left >= half) left -= half; else if (left < 0) left += half; }
    el.scrollLeft = left;
    posRef.current = left;
  };
  const onPointerUp = () => { if (draggingRef.current) { draggingRef.current = false; pauseBriefly(); } };

  // lightbox
  const openAt = (i: number) => setLightbox(((i % n) + n) % n);
  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(() => setLightbox((v) => (v === null ? v : (v - 1 + n) % n)), [n]);
  const next = useCallback(() => setLightbox((v) => (v === null ? v : (v + 1) % n)), [n]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [lightbox, close, prev, next]);

  if (n === 0) return null;

  const round: React.CSSProperties = { position: "absolute", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: "50%", border: "1px solid rgba(255,255,255,.35)", background: "rgba(20,12,4,.5)", backdropFilter: "blur(6px)", color: "#fff", cursor: "pointer" };

  return (
    <>
      <div
        ref={railRef}
        onScroll={onScroll}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { draggingRef.current = false; pausedRef.current = false; }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={pauseBriefly}
        onTouchMove={pauseBriefly}
        style={{ display: "flex", gap: 16, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none", msOverflowStyle: "none", cursor: "grab", paddingBottom: 24, marginBottom: -24, WebkitOverflowScrolling: "touch" }}
        aria-label={label}
      >
        {loop.map((g, i) => (
          <button
            key={i}
            type="button"
            aria-hidden={i >= n}
            aria-label={g.altText || label || "Photo"}
            onClick={() => { if (drag.current.moved < 6) openAt(i % n); }}
            style={{ flex: "0 0 auto", width: itemWidth, height: itemHeight, borderRadius: 14, overflow: "hidden", border: "none", padding: 0, cursor: "pointer", background: `50% 50%/cover no-repeat url('${g.imageUrl}')` }}
          />
        ))}
      </div>

      {n > 1 && (
        <div className="flex justify-center" style={{ gap: 8, marginTop: 18 }}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}`}
              aria-current={i === active}
              onClick={() => { const el = railRef.current; if (!el) return; posRef.current = i * STEP; el.scrollLeft = i * STEP; syncActive(i * STEP); }}
              className="cursor-pointer"
              style={{ height: 7, width: i === active ? 26 : 7, borderRadius: 7, border: "none", padding: 0, background: i === active ? "#c48f2b" : "#e4ddd1", transition: "width .3s,background .3s" }}
            />
          ))}
        </div>
      )}

      {lightbox !== null && (
        <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(12,8,3,.94)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(16px,4vw,56px)" }}>
          <button onClick={(e) => { e.stopPropagation(); close(); }} aria-label="Close" style={{ ...round, top: "clamp(16px,3vw,28px)", right: "clamp(16px,4vw,40px)" }}><X size={20} strokeWidth={2.2} /></button>
          {n > 1 && <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous" style={{ ...round, left: "clamp(10px,3vw,32px)", top: "50%", transform: "translateY(-50%)" }}><ChevronLeft size={22} strokeWidth={2.2} /></button>}
          <img
            src={images[lightbox].imageUrl}
            alt={images[lightbox].altText || label || "Photo"}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "min(1200px,92vw)", maxHeight: "82vh", width: "auto", height: "auto", objectFit: "contain", borderRadius: 10, boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}
          />
          {n > 1 && <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next" style={{ ...round, right: "clamp(10px,3vw,32px)", top: "50%", transform: "translateY(-50%)" }}><ChevronRight size={22} strokeWidth={2.2} /></button>}
          <div style={{ position: "absolute", bottom: "clamp(16px,3vw,28px)", left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,.75)", fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{lightbox + 1} / {n}</div>
        </div>
      )}
    </>
  );
}
