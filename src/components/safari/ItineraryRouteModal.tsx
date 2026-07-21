"use client";

import { memo, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, RotateCcw, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";

export interface RouteStop { n: number; lat: number; lng: number; label?: string; sub?: string }

/* ── geometry helpers ─────────────────────────────────────────────────────── */
type LL = [number, number];
function segLen(a: LL, b: LL) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}
function lerp(a: LL, b: LL, f: number): LL {
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

/* ── numbered day pin ─────────────────────────────────────────────────────── */
function pinIcon(n: number, active: boolean) {
  const size = active ? 40 : 32;
  const bg = active ? "#c48f2b" : "#3d1402";
  const anim = active ? "ta-pop .45s cubic-bezier(.34,1.56,.64,1)" : "ta-drop .4s ease";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2.5px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;color:#fff;font:700 ${active ? 14 : 12}px Inter,system-ui,sans-serif;animation:${anim}">${n}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/* Memoized day pin — stable icon identity so its entry animation plays ONCE
   (not restarted every animation frame). Only re-creates when n/active change. */
const DayPin = memo(function DayPin({ n, lat, lng, active }: { n: number; lat: number; lng: number; active: boolean }) {
  const icon = useMemo(() => pinIcon(n, active), [n, active]);
  const pos = useMemo(() => [lat, lng] as LL, [lat, lng]);
  return <Marker position={pos} icon={icon} zIndexOffset={active ? 1000 : 0} />;
});

/* ── fit the whole route once ─────────────────────────────────────────────── */
function FitAll({ pts }: { pts: LL[] }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      if (pts.length > 1) map.fitBounds(pts, { padding: [60, 70] });
      else if (pts.length === 1) map.setView(pts[0], 7);
    }, 90);
    return () => clearTimeout(t);
  }, [map, pts]);
  return null;
}

/* ── route layer — pure render from the current progress fraction `t` ──────── */
function RouteLayer({ pts, stops, cum, total, t, passed }: { pts: LL[]; stops: RouteStop[]; cum: number[]; total: number; t: number; passed: number }) {
  const target = t * total;
  let headIdx = 0;
  let head: LL = pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (cum[i] >= target) {
      const f = (target - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      head = lerp(pts[i - 1], pts[i], f);
      headIdx = i - 1;
      break;
    }
    headIdx = i;
    head = pts[i];
  }
  const revealed: LL[] = [...pts.slice(0, headIdx + 1), head];

  return (
    <>
      {/* faint full track underneath */}
      {pts.length > 1 && (
        <Polyline positions={pts} pathOptions={{ color: "#c48f2b", weight: 2, dashArray: "1 12", lineCap: "round", opacity: 0.28 }} />
      )}
      {/* bright animated trail */}
      {revealed.length > 1 && (
        <Polyline positions={revealed} pathOptions={{ color: "#c48f2b", weight: 4, dashArray: "1 13", lineCap: "round", opacity: 0.98 }} />
      )}
      {/* stops revealed so far — each pops in once as the route reaches it */}
      {stops.map((s, i) => {
        if (cum[i] > target + 1e-9) return null;
        return <DayPin key={s.n} n={s.n} lat={s.lat} lng={s.lng} active={i === passed} />;
      })}
      <FitAll pts={pts} />
    </>
  );
}

/* ── modal shell ──────────────────────────────────────────────────────────── */
export default function ItineraryRouteModal({
  open,
  onClose,
  stops,
  title,
  subtitle,
}: {
  open: boolean;
  onClose: () => void;
  stops: RouteStop[];
  title: string;
  subtitle?: string;
}) {
  const pts = useMemo(() => stops.map((s) => [s.lat, s.lng] as LL), [stops]);
  const center: LL = pts[0] || [-3.3, 35.5];
  const last = stops.length - 1;

  const { cum, total, frac } = useMemo(() => {
    const c = [0];
    let sum = 0;
    for (let i = 1; i < pts.length; i++) { sum += segLen(pts[i - 1], pts[i]); c.push(sum); }
    const tot = sum || 1;
    return { cum: c, total: tot, frac: c.map((v) => v / tot) };
  }, [pts]);

  // playback state (refs drive the rAF loop; `force` re-renders each changed frame)
  const tRef = useRef(0);
  const targetRef = useRef(0);
  const playingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [, force] = useReducer((x) => x + 1, 0);

  const autoSec = Math.min(13, Math.max(5, stops.length * 0.95));

  // reset + autoplay + scroll-lock whenever the modal opens
  useEffect(() => {
    if (!open) return;
    tRef.current = 0;
    targetRef.current = 0;
    playingRef.current = true;
    setPlaying(true);
    force();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);

  // the animation loop — advances target while playing, eases t toward target
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    let lastTs: number | null = null;
    const loop = (ts: number) => {
      if (lastTs == null) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      let changed = false;
      if (playingRef.current) {
        targetRef.current = Math.min(1, targetRef.current + dt / autoSec);
        if (targetRef.current >= 1) { playingRef.current = false; setPlaying(false); }
        changed = true;
      }
      const d = targetRef.current - tRef.current;
      if (Math.abs(d) > 0.0004) { tRef.current += d * Math.min(1, dt * 7); changed = true; }
      else if (tRef.current !== targetRef.current) { tRef.current = targetRef.current; changed = true; }
      if (changed) force();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open, autoSec]);

  const currentPassed = () => {
    const target = tRef.current * total;
    let p = 0;
    for (let i = 0; i < pts.length; i++) if (cum[i] <= target + 1e-9) p = i;
    return p;
  };

  const stepTo = (i: number) => {
    const clamped = Math.max(0, Math.min(last, i));
    playingRef.current = false;
    setPlaying(false);
    targetRef.current = frac[clamped];
    force();
  };

  const togglePlay = () => {
    if (playingRef.current) {
      playingRef.current = false;
      setPlaying(false);
    } else {
      if (tRef.current >= 0.999) { tRef.current = 0; targetRef.current = 0; } // restart from the top
      playingRef.current = true;
      setPlaying(true);
    }
    force();
  };

  const replay = () => {
    tRef.current = 0;
    targetRef.current = 0;
    playingRef.current = true;
    setPlaying(true);
    force();
  };

  // keyboard shortcuts: Esc close · Space play/pause · ←/→ step days
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key === "ArrowRight") stepTo(currentPassed() + 1);
      else if (e.key === "ArrowLeft") stepTo(currentPassed() - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const t = tRef.current;
  const passed = currentPassed();
  const activeStop = stops[passed];

  const iconBtn = { width: 40, height: 40, borderRadius: "50%", border: "1px solid #e4ddd1", background: "#fff", color: "#3d1402", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 } as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(20,12,4,.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(10px,3vw,40px)", animation: "ta-fade .25s ease" }}
    >
      <style>{`
        @keyframes ta-fade{from{opacity:0}to{opacity:1}}
        @keyframes ta-rise{from{opacity:0;transform:translateY(16px) scale(.985)}to{opacity:1;transform:none}}
        @keyframes ta-pop{0%{transform:scale(.2);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
        @keyframes ta-drop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
        .ta-range{-webkit-appearance:none;appearance:none;height:5px;border-radius:3px;outline:none;cursor:pointer}
        .ta-range::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#c48f2b;border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);cursor:pointer}
        .ta-range::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#c48f2b;border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);cursor:pointer}
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "min(1120px,100%)", height: "min(80vh,780px)", background: "#faf8f5", borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 90px rgba(0,0,0,.5)", display: "flex", flexDirection: "column", animation: "ta-rise .34s cubic-bezier(.22,1,.36,1)" }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "14px clamp(16px,3vw,26px)", borderBottom: "1px solid #e4ddd1", background: "#fff" }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-source-serif),Georgia,serif", fontWeight: 700, color: "#2a2018", fontSize: "clamp(16px,2.2vw,21px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h3>
            {subtitle && <p style={{ margin: "2px 0 0", color: "#7a6f61", fontSize: 13 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" style={iconBtn}>
            <X size={20} />
          </button>
        </div>

        {/* map */}
        <div style={{ position: "relative", flex: 1, minHeight: 0, isolation: "isolate", background: "linear-gradient(150deg,#8aa06a,#4a5a2a)" }}>
          <MapContainer center={center} zoom={7} scrollWheelZoom attributionControl={false} zoomControl style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <RouteLayer pts={pts} stops={stops} cum={cum} total={total} t={t} passed={passed} />
          </MapContainer>

          {/* current-stop caption (top-right, clear of zoom control) */}
          {activeStop && (
            <div style={{ position: "absolute", right: "clamp(10px,2vw,18px)", top: "clamp(10px,2vw,18px)", zIndex: 500, maxWidth: "min(64%,360px)", background: "rgba(255,255,255,.94)", backdropFilter: "blur(8px)", border: "1px solid #e4ddd1", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 26px rgba(0,0,0,.18)" }}>
              <span style={{ display: "inline-block", background: "#274e22", color: "#faf8f5", fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 5, marginBottom: 6 }}>Day {activeStop.n}</span>
              <div style={{ fontFamily: "var(--font-source-serif),Georgia,serif", fontWeight: 700, color: "#2a2018", fontSize: 15, lineHeight: 1.25 }}>{activeStop.label || `Stop ${activeStop.n}`}</div>
              {activeStop.sub && <div style={{ color: "#7a6f61", fontSize: 12.5, marginTop: 2 }}>{activeStop.sub}</div>}
            </div>
          )}

          {/* playback control bar */}
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: "clamp(12px,2.4vw,20px)", zIndex: 500, width: "min(560px,calc(100% - 28px))", display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.97)", border: "1px solid #e4ddd1", borderRadius: 999, padding: "8px 12px", boxShadow: "0 10px 30px rgba(0,0,0,.28)" }}>
            <button onClick={() => stepTo(passed - 1)} disabled={passed <= 0} aria-label="Previous day" title="Previous day" style={{ ...iconBtn, width: 36, height: 36, opacity: passed <= 0 ? 0.4 : 1, cursor: passed <= 0 ? "default" : "pointer" }}>
              <ChevronLeft size={18} strokeWidth={2.4} />
            </button>
            <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} title={playing ? "Pause" : "Play"} style={{ width: 46, height: 46, borderRadius: "50%", border: "none", background: "#c48f2b", color: "#3d1402", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 3px 10px rgba(196,143,43,.5)" }}>
              {playing ? <Pause size={20} fill="#3d1402" /> : <Play size={20} fill="#3d1402" style={{ marginLeft: 2 }} />}
            </button>
            <button onClick={() => stepTo(passed + 1)} disabled={passed >= last} aria-label="Next day" title="Next day" style={{ ...iconBtn, width: 36, height: 36, opacity: passed >= last ? 0.4 : 1, cursor: passed >= last ? "default" : "pointer" }}>
              <ChevronRight size={18} strokeWidth={2.4} />
            </button>

            <input
              className="ta-range"
              type="range"
              min={0}
              max={last}
              step={1}
              value={passed}
              onChange={(e) => stepTo(Number(e.target.value))}
              aria-label="Day"
              style={{ flex: 1, minWidth: 60, background: `linear-gradient(90deg,#c48f2b ${(passed / (last || 1)) * 100}%,#e4ddd1 ${(passed / (last || 1)) * 100}%)` }}
            />

            <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: "#3d1402", fontVariantNumeric: "tabular-nums" }}>
              {activeStop ? `Day ${activeStop.n}` : ""}
            </span>
            <button onClick={replay} aria-label="Replay route" title="Replay route" style={{ ...iconBtn, width: 36, height: 36 }}>
              <RotateCcw size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
