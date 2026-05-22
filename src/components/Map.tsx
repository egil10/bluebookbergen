"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  Rectangle,
  CircleMarker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { LatLng, Street } from "@/lib/types";
import type { Area } from "@/lib/areas";

// Bergen Sentrum default centre + zoom.
export const BERGEN_CENTER: LatLng = [60.392, 5.324];
export const BERGEN_ZOOM = 14;

export type ZoomMode = "auto" | "manual";

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
  area?: Area | null;
  fitArea?: Area | null; // pan/zoom to area on change
  // Faint "background" streets, used by explore mode.
  background?: Street[];
  backgroundLabels?: boolean;
  // When "manual", skip auto-fitting to per-round targets. Area changes
  // still re-frame (since the user explicitly changed area).
  zoomMode?: ZoomMode;
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

const FitArea = ({ area }: { area: Area | null | undefined }) => {
  const map = useMap();
  useEffect(() => {
    if (!area) return;
    const [s, w, n, e] = area.bbox;
    map.fitBounds(
      L.latLngBounds(L.latLng(s, w), L.latLng(n, e)),
      { padding: [30, 30] },
    );
  }, [area, map]);
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
  opacity,
  label,
}: {
  street: Street;
  color: string;
  weight: number;
  dashArray?: string;
  opacity?: number;
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
            opacity: opacity ?? 0.95,
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

// Translucent "outside" mask + crisp outline around the play area. We draw a
// polygon spanning the world with a rectangular hole over the bbox, plus a
// dashed border on the bbox itself. Result: subtle but legible boundary.
function AreaOverlay({ area }: { area: Area }) {
  const [s, w, n, e] = area.bbox;
  const outer: LatLng[] = [
    [-85, -180],
    [-85, 180],
    [85, 180],
    [85, -180],
  ];
  const hole: LatLng[] = [
    [s, w],
    [s, e],
    [n, e],
    [n, w],
  ];
  return (
    <>
      <Polygon
        positions={[outer, hole]}
        pathOptions={{
          color: "transparent",
          fillColor: "#0b1d3a",
          fillOpacity: 0.06,
          stroke: false,
          interactive: false,
        }}
      />
      <Rectangle
        bounds={L.latLngBounds(L.latLng(s, w), L.latLng(n, e))}
        pathOptions={{
          color: "#3d6798",
          weight: 1.5,
          opacity: 0.65,
          dashArray: "4 6",
          fill: false,
          interactive: false,
        }}
      />
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
  area,
  fitArea,
  background,
  backgroundLabels,
  zoomMode = "auto",
}: BergenMapProps) {
  return (
    <div className={className ?? "w-full h-full"}>
      <MapContainer
        center={BERGEN_CENTER}
        zoom={BERGEN_ZOOM}
        scrollWheelZoom
        zoomControl
        className="h-full w-full"
        minZoom={11}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        <ClickHandler onClick={onMapClick} />
        {area && <AreaOverlay area={area} />}
        {background?.map((s) => (
          <StreetLines
            key={`bg-${s.name}`}
            street={s}
            color="#6b87b0"
            weight={3}
            opacity={0.55}
            label={backgroundLabels ? s.name : undefined}
          />
        ))}
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
        <FitBounds
          street={
            zoomMode === "manual"
              ? null
              : (fitTarget ?? highlighted ?? hint ?? null)
          }
        />
        <FitArea area={fitArea ?? null} />
      </MapContainer>
    </div>
  );
}
