"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// `n` is the (first) day at this stop; `nEnd` extends it into a range when
// several consecutive days share the same place; `label` is the shown text.
export interface MapStopGeo { n: number; nEnd?: number; lat: number; lng: number; label?: string }

const isActiveStop = (s: MapStopGeo, active: number) => active >= s.n && active <= (s.nEnd ?? s.n);

/** Fits the map to the route + fixes sizing when the container was hidden. */
function FitRoute({ points, activeIdx }: { points: [number, number][]; activeIdx: number }) {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      if (points.length > 1) map.fitBounds(points, { padding: [30, 30] });
      else if (points.length === 1) map.setView(points[0], 8);
    };
    const t = setTimeout(fit, 80);
    window.addEventListener("resize", fit);
    return () => { clearTimeout(t); window.removeEventListener("resize", fit); };
  }, [map, points]);
  // recenter gently on the active pin
  useEffect(() => {
    const p = points[activeIdx];
    if (p && points.length > 1) map.panTo(p, { animate: true });
  }, [activeIdx, map, points]);
  return null;
}

function numberIcon(label: string, isActive: boolean) {
  const size = isActive ? 34 : 28;
  const w = label.length > 2 ? size + (label.length - 2) * 8 : size;
  const bg = isActive ? "#c48f2b" : "#3d1402";
  return L.divIcon({
    className: "",
    html: `<div style="min-width:${size}px;width:${w}px;height:${size}px;padding:0 ${label.length > 2 ? 6 : 0}px;border-radius:${size}px;background:${bg};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font:700 ${isActive ? 13 : 12}px Inter,system-ui,sans-serif;white-space:nowrap">${label}</div>`,
    iconSize: [w, size],
    iconAnchor: [w / 2, size / 2],
  });
}

/** Real OpenStreetMap route map with numbered day pins + a dashed route line. */
export default function ItineraryRouteMap({ stops, active }: { stops: MapStopGeo[]; active: number }) {
  const pts = stops.map((s) => [s.lat, s.lng] as [number, number]);
  const center = pts[0] || [-3.3, 35.5];
  const activeIdx = stops.findIndex((s) => isActiveStop(s, active));
  return (
    <MapContainer center={center} zoom={7} scrollWheelZoom={false} attributionControl={false} zoomControl={true} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
      {pts.length > 1 && <Polyline positions={pts} pathOptions={{ color: "#c48f2b", weight: 3, dashArray: "3 8", opacity: 0.9 }} />}
      {stops.map((s) => <Marker key={s.n} position={[s.lat, s.lng]} icon={numberIcon(s.label ?? String(s.n), isActiveStop(s, active))} />)}
      <FitRoute points={pts} activeIdx={activeIdx} />
    </MapContainer>
  );
}
