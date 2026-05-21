"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { LatLng, Street } from "@/lib/types";

// Bergen Sentrum default centre + zoom.
export const BERGEN_CENTER: LatLng = [60.392, 5.324];
export const BERGEN_ZOOM = 14;

export interface BergenMapProps {
  highlighted?: Street | null;
  hint?: Street | null; // ghost overlay (e.g. the correct answer reveal)
  marker?: LatLng | null;
  answerMarker?: LatLng | null;
  extraMarkers?: { latlng: LatLng; label: string; tone?: "ink" | "muted" }[];
  onMapClick?: (p: LatLng) => void;
  fitTarget?: Street | null;
  className?: string;
  showStreetLabel?: boolean;
}

const FitBounds = ({ street }: { street: Street | null | undefined }) => {
  const map = useMap();
  useEffect(() => {
    if (!street) return;
    const pts = street.segments.flatMap((s) => s.coords);
    if (pts.length === 0) return;
    const bounds = L.latLngBounds(pts.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
  }, [street, map]);
  return null;
};

const ClickHandler = ({ onClick }: { onClick?: (p: LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onClick?.([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

function StreetLines({
  street,
  color,
  weight,
  dashArray,
  label,
}: {
  street: Street;
  color: string;
  weight: number;
  dashArray?: string;
  label?: string;
}) {
  return (
    <>
      {street.segments.map((seg, i) => (
        <Polyline
          key={seg.id}
          positions={seg.coords}
          pathOptions={{
            color,
            weight,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
            dashArray,
          }}
        >
          {label && i === 0 && (
            <Tooltip direction="top" offset={[0, -4]} opacity={1} permanent>
              <span className="street-pop">{label}</span>
            </Tooltip>
          )}
        </Polyline>
      ))}
    </>
  );
}

export default function BergenMap({
  highlighted,
  hint,
  marker,
  answerMarker,
  extraMarkers,
  onMapClick,
  fitTarget,
  className,
  showStreetLabel,
}: BergenMapProps) {
  return (
    <div className={className ?? "w-full h-full"}>
      <MapContainer
        center={BERGEN_CENTER}
        zoom={BERGEN_ZOOM}
        scrollWheelZoom
        zoomControl
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        <ClickHandler onClick={onMapClick} />
        {hint && (
          <StreetLines
            street={hint}
            color="#94a3b8"
            weight={6}
            dashArray="2 8"
            label={showStreetLabel ? hint.name : undefined}
          />
        )}
        {highlighted && (
          <StreetLines
            street={highlighted}
            color="#3d6798"
            weight={6}
            label={showStreetLabel ? highlighted.name : undefined}
          />
        )}
        {answerMarker && (
          <CircleMarker
            center={answerMarker}
            radius={7}
            pathOptions={{
              color: "#16a34a",
              fillColor: "#22c55e",
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} permanent>
              <span className="street-pop">answer</span>
            </Tooltip>
          </CircleMarker>
        )}
        {marker && (
          <CircleMarker
            center={marker}
            radius={7}
            pathOptions={{
              color: "#0b1d3a",
              fillColor: "#3d6798",
              fillOpacity: 0.9,
              weight: 2,
            }}
          />
        )}
        {extraMarkers?.map((m, i) => (
          <CircleMarker
            key={i}
            center={m.latlng}
            radius={6}
            pathOptions={{
              color: m.tone === "muted" ? "#94a3b8" : "#0b1d3a",
              fillColor: m.tone === "muted" ? "#cbd5e1" : "#3d6798",
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} permanent>
              <span className="street-pop">{m.label}</span>
            </Tooltip>
          </CircleMarker>
        ))}
        <FitBounds street={fitTarget ?? highlighted ?? hint ?? null} />
      </MapContainer>
    </div>
  );
}
