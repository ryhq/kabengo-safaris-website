"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, RotateCcw } from "lucide-react";

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

/* ── numbered day pin (matches the inline map) ────────────────────────────── */
function pinIcon(n: number, state: "done" | "active" | "pending") {
  const size = state === "active" ? 40 : 32;
  const bg = state === "active" ? "#c48f2b" : state === "done" ? "#3d1402" : "#a89a86";
  const anim = state === "active" ? "ta-pop .45s cubic-bezier(.34,1.56,.64,1)" : "ta-drop .4s ease";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2.5px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;color:#fff;font:700 ${state === "active" ? 14 : 12}px Inter,system-ui,sans-serif;animation:${anim}">${n}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/* ── fit the whole route once ─────────────────────────────────────────────── */
function FitAll({ pts }: { pts: LL[] }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      if (pts.length > 1) map.fitBounds(pts, { padding: [60, 60] });
      else if (pts.length === 1) map.setView(pts[0], 7);
    }, 90);
    return () => clearTimeout(t);
  }, [map, pts]);
  return null;
}

/* ── animated route layer ─────────────────────────────────────────────────── */
function AnimatedRoute({ pts, stops, runId, onProgress }: { pts: LL[]; stops: RouteStop[]; runId: number; onProgress: (i: number) => void }) {
  const [t, setT] = useState(0);
  const raf = useRef(0);
  const start = useRef<number | null>(null);

  const { cum, total } = useMemo(() => {
    const c = [0];
    let sum = 0;
    for (let i = 1; i < pts.length; i++) { sum += segLen(pts[i - 1], pts[i]); c.push(sum); }
    return { cum: c, total: sum || 1 };
  }, [pts]);

  const duration = Math.min(11000, Math.max(4200, pts.length * 900));

  useEffect(() => {
    start.current = null;
    setT(0);
    const step = (ts: number) => {
      if (start.current == null) start.current = ts;
      const p = Math.min(1, (ts - start.current) / duration);
      // ease-in-out
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setT(eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [runId, duration]);

  const target = t * total;

  // head position + revealed polyline
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

  // how many stops the head has passed
  let passed = 0;
  for (let i = 0; i < pts.length; i++) if (cum[i] <= target + 1e-9) passed = i;
  const activeStop = stops[passed];

  useEffect(() => { onProgress(activeStop?.n ?? stops[0]?.n ?? 1); }, [passed]); // eslint-disable-line

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
      {/* stops revealed so far */}
      {stops.map((s, i) => {
        if (cum[i] > target + 1e-9) return null;
        const state = i === passed && t < 1 ? "active" : "done";
        return <Marker key={`${runId}-${s.n}`} position={[s.lat, s.lng]} icon={pinIcon(s.n, state as "done" | "active")} zIndexOffset={state === "active" ? 1000 : 0} />;
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
  const [runId, setRunId] = useState(1);
  const [activeDay, setActiveDay] = useState(stops[0]?.n ?? 1);
  const pts = useMemo(() => stops.map((s) => [s.lat, s.lng] as LL), [stops]);
  const center: LL = pts[0] || [-3.3, 35.5];

  // esc to close + body scroll lock + replay on open
  useEffect(() => {
    if (!open) return;
    setRunId((r) => r + 1);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  const activeStop = stops.find((s) => s.n === activeDay) || stops[0];

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
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "min(1120px,100%)", height: "min(78vh,760px)", background: "#faf8f5", borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 90px rgba(0,0,0,.5)", display: "flex", flexDirection: "column", animation: "ta-rise .34s cubic-bezier(.22,1,.36,1)" }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "14px clamp(16px,3vw,26px)", borderBottom: "1px solid #e4ddd1", background: "#fff" }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-source-serif),Georgia,serif", fontWeight: 700, color: "#2a2018", fontSize: "clamp(16px,2.2vw,21px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h3>
            {subtitle && <p style={{ margin: "2px 0 0", color: "#7a6f61", fontSize: 13 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ flexShrink: 0, width: 38, height: 38, borderRadius: "50%", border: "1px solid #e4ddd1", background: "#fff", color: "#3d1402", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* map */}
        <div style={{ position: "relative", flex: 1, minHeight: 0, isolation: "isolate", background: "linear-gradient(150deg,#8aa06a,#4a5a2a)" }}>
          <MapContainer center={center} zoom={7} scrollWheelZoom attributionControl={false} zoomControl style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <AnimatedRoute pts={pts} stops={stops} runId={runId} onProgress={setActiveDay} />
          </MapContainer>

          {/* current-stop caption */}
          {activeStop && (
            <div style={{ position: "absolute", left: "clamp(10px,2vw,18px)", bottom: "clamp(10px,2vw,18px)", zIndex: 500, maxWidth: "min(70%,420px)", background: "rgba(255,255,255,.94)", backdropFilter: "blur(8px)", border: "1px solid #e4ddd1", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 26px rgba(0,0,0,.18)" }}>
              <span style={{ display: "inline-block", background: "#274e22", color: "#faf8f5", fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 5, marginBottom: 6 }}>Day {activeStop.n}</span>
              <div style={{ fontFamily: "var(--font-source-serif),Georgia,serif", fontWeight: 700, color: "#2a2018", fontSize: 15, lineHeight: 1.25 }}>{activeStop.label || `Stop ${activeStop.n}`}</div>
              {activeStop.sub && <div style={{ color: "#7a6f61", fontSize: 12.5, marginTop: 2 }}>{activeStop.sub}</div>}
            </div>
          )}

          {/* replay */}
          <button
            onClick={() => setRunId((r) => r + 1)}
            aria-label="Replay route"
            style={{ position: "absolute", right: "clamp(10px,2vw,18px)", bottom: "clamp(10px,2vw,18px)", zIndex: 500, display: "inline-flex", alignItems: "center", gap: 8, background: "#c48f2b", color: "#3d1402", fontWeight: 700, fontSize: 13.5, border: "none", borderRadius: 999, padding: "10px 18px", cursor: "pointer", boxShadow: "0 8px 26px rgba(0,0,0,.25)" }}
          >
            <RotateCcw size={15} strokeWidth={2.4} />Replay route
          </button>
        </div>
      </div>
    </div>
  );
}
