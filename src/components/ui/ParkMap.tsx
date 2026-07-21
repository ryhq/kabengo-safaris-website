"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Branded teardrop pin (gold/choc) — matches the itinerary route map, no
   external icon image requests. */
const parkIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:44px;filter:drop-shadow(0 3px 6px rgba(0,0,0,.4))">
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2C9.7 2 3 8.7 3 17c0 10.5 12.4 22.4 14 23.9a1.4 1.4 0 0 0 2 0C20.6 39.4 33 27.5 33 17 33 8.7 26.3 2 18 2Z" fill="#c48f2b" stroke="#fff" stroke-width="2.5"/>
      <circle cx="18" cy="17" r="6" fill="#3d1402"/>
    </svg>
  </div>`,
  iconSize: [36, 44],
  iconAnchor: [18, 42],
  popupAnchor: [0, -38],
});

/** Fixes sizing when the container was hidden/animated in. */
function Resize() {
  const map = useMap();
  useEffect(() => {
    const fit = () => map.invalidateSize();
    const t = setTimeout(fit, 90);
    window.addEventListener("resize", fit);
    return () => { clearTimeout(t); window.removeEventListener("resize", fit); };
  }, [map]);
  return null;
}

interface ParkMapProps {
  latitude: number;
  longitude: number;
  name: string;
  zoom?: number;
}

export default function ParkMap({ latitude, longitude, name, zoom = 9 }: ParkMapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={zoom}
      scrollWheelZoom={false}
      attributionControl={false}
      className="h-full w-full"
      style={{ minHeight: 300, zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={parkIcon}>
        <Popup>{name}</Popup>
      </Marker>
      <Resize />
    </MapContainer>
  );
}
