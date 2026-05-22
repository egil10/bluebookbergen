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

export type ZoomMode = "auto" | "manual" | "fixed";

export type MapStyle = "light" | "minimal" | "voyager" | "osm" | "satellite";

interface TileStyle {
  url: string;
  // No-labels variant of the same style. Used when `hideLabels` is true
  // (game modes where the answer is the street name). Optional —
  // satellite has no labels in either case; OSM has no clean no-labels
  // variant, so it falls back to CARTO light_nolabels.
  urlNoLabels?: string;
  attribution: string;
  maxZoom: number;
  // When true, polyline/label colours should switch to high-contrast
  // because the basemap is dark (e.g. satellite).
  dark?: boolean;
}

const CARTO_NOLABELS = "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";

export const TILE_STYLES: Record<MapStyle, TileStyle> = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    urlNoLabels: CARTO_NOLABELS,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
  minimal: {
    url: CARTO_NOLABELS,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
  voyager: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    urlNoLabels:
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    // OSM standard has no no-labels variant; fall back to CARTO minimal
    // so we never leak names during a game.
    urlNoLabels: CARTO_NOLABELS,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    // Esri imagery has no labels baked in.
    attribution:
      'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
    maxZoom: 19,
    dark: true,
  },
};

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
  zoomLevel?: number; // used when zoomMode === "fixed"
  mapStyle?: MapStyle;
  // Force a no-labels tile variant regardless of the chosen style. Set
  // by game modes so the basemap can't spoil the street name.
  hideLabels?: boolean;
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

const FixedView = ({
  target,
  level,
}: {
  target: Street | null | undefined;
  level: number;
}) => {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.setView(target.center, level, { animate: true });
  }, [target, level, map]);
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
  zoomLevel = 14,
  mapStyle = "light",
  hideLabels = false,
}: BergenMapProps) {
  const tiles = TILE_STYLES[mapStyle];
  const tileUrl = hideLabels && tiles.urlNoLabels ? tiles.urlNoLabels : tiles.url;
  const dark = tiles.dark;
  const highlightColour = dark ? "#fde047" : "#3d6798";
  const hintColour = dark ? "#cbd5e1" : "#94a3b8";
  const backgroundColour = dark ? "#a5b4fc" : "#6b87b0";
  return (
    <div className={className ?? "w-full h-full"}>
      <MapContainer
        center={BERGEN_CENTER}
        zoom={BERGEN_ZOOM}
        scrollWheelZoom
        zoomControl
        className="h-full w-full"
        minZoom={7}
      >
        <TileLayer
          key={`${mapStyle}-${hideLabels ? "nolabels" : "labels"}`}
          attribution={tiles.attribution}
          url={tileUrl}
          maxZoom={tiles.maxZoom}
        />
        <ClickHandler onClick={onMapClick} />
        {area && <AreaOverlay area={area} />}
        {background?.map((s) => (
          <StreetLines
            key={`bg-${s.name}`}
            street={s}
            color={backgroundColour}
            weight={3}
            opacity={dark ? 0.7 : 0.55}
            label={backgroundLabels ? s.name : undefined}
          />
        ))}
        {hint && (
          <StreetLines
            street={hint}
            color={hintColour}
            weight={6}
            dashArray="2 8"
            label={showStreetLabel ? hint.name : undefined}
          />
        )}
        {highlighted && (
          <StreetLines
            street={highlighted}
            color={highlightColour}
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
            zoomMode === "auto"
              ? (fitTarget ?? highlighted ?? hint ?? null)
              : null
          }
        />
        <FixedView
          target={
            zoomMode === "fixed"
              ? (fitTarget ?? highlighted ?? hint ?? null)
              : null
          }
          level={zoomLevel}
        />
        <FitArea area={fitArea ?? null} />
      </MapContainer>
    </div>
  );
}
