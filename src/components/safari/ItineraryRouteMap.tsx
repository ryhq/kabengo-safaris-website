"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapStopGeo { n: number; lat: number; lng: number }

/** Fits the map to the route + fixes sizing when the container was hidden. */
function FitRoute({ points, active }: { points: [number, number][]; active: number }) {
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
    const p = points[active - 1];
    if (p && points.length > 1) map.panTo(p, { animate: true });
  }, [active, map, points]);
  return null;
}

function numberIcon(n: number, isActive: boolean) {
  const size = isActive ? 34 : 28;
  const bg = isActive ? "#c48f2b" : "#3d1402";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font:700 ${isActive ? 13 : 12}px Inter,system-ui,sans-serif">${n}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Real OpenStreetMap route map with numbered day pins + a dashed route line. */
export default function ItineraryRouteMap({ stops, active }: { stops: MapStopGeo[]; active: number }) {
  const pts = stops.map((s) => [s.lat, s.lng] as [number, number]);
  const center = pts[0] || [-3.3, 35.5];
  return (
    <MapContainer center={center} zoom={7} scrollWheelZoom={false} attributionControl={false} zoomControl={true} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
      {pts.length > 1 && <Polyline positions={pts} pathOptions={{ color: "#c48f2b", weight: 3, dashArray: "3 8", opacity: 0.9 }} />}
      {stops.map((s) => <Marker key={s.n} position={[s.lat, s.lng]} icon={numberIcon(s.n, s.n === active)} />)}
      <FitRoute points={pts} active={active} />
    </MapContainer>
  );
}
