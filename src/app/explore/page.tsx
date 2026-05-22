"use client";

import { useEffect, useMemo, useState } from "react";
import { Compass } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import BergenMap from "@/components/MapClient";
import { AreaPicker } from "@/components/AreaPicker";
import { StylePicker, ZoomControl } from "@/components/MapOptions";
import { loadBergen } from "@/lib/data";
import { normaliseName } from "@/lib/geo";
import { AREAS, DEFAULT_AREA, streetInArea, type Area } from "@/lib/areas";
import type { MapStyle, ZoomMode } from "@/components/Map";
import type { BergenData, Street } from "@/lib/types";

export default function ExplorePage() {
  const [data, setData] = useState<BergenData | null>(null);
  const [area, setArea] = useState<Area>(DEFAULT_AREA);
  const [zoom, setZoom] = useState<ZoomMode>("fixed");
  const [zoomLevel, setZoomLevel] = useState(15);
  const [mapStyle, setMapStyle] = useState<MapStyle>("light");
  const [focus, setFocus] = useState<Street | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadBergen().then(setData);
  }, []);

  useEffect(() => {
    setFocus(null);
  }, [area]);

  const inArea = useMemo(() => {
    if (!data) return [] as Street[];
    return data.streets.filter((s) => streetInArea(s, area));
  }, [data, area]);

  const countsByArea = useMemo(() => {
    if (!data) return {} as Record<string, number>;
    const out: Record<string, number> = {};
    for (const a of AREAS) {
      out[a.id] = data.streets.filter((s) => streetInArea(s, a)).length;
    }
    return out;
  }, [data]);

  const filtered = useMemo(() => {
    if (!query.trim()) return inArea;
    const q = normaliseName(query);
    return inArea.filter((s) => normaliseName(s.name).includes(q));
  }, [inArea, query]);

  return (
    <GameShell
      title="Explore the map"
      subtitle="Pan around, switch the basemap, click a name to fly to it."
      loading={!data}
      side={
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400 font-medium mb-1.5">
            <span className="inline-flex items-center gap-2">
              <Compass size={12} /> Fly to a street
            </span>
            <span className="normal-case tracking-normal text-slate-400">
              {filtered.length} of {inArea.length}
            </span>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this area…"
            className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-ink placeholder:text-slate-400 focus:outline-none focus:border-bergen-500 focus:bg-white text-sm transition-colors"
          />
          <ul className="mt-2 flex-1 min-h-0 overflow-auto thin-scrollbar rounded-xl border border-slate-200 bg-white/70 divide-y divide-slate-100">
            {filtered.map((s) => {
              const isSel = s === focus;
              return (
                <li key={s.name}>
                  <button
                    onClick={() => setFocus(s)}
                    className={
                      "w-full text-left px-3 py-1.5 text-sm transition-colors " +
                      (isSel
                        ? "bg-bergen-50 text-bergen-800"
                        : "hover:bg-slate-50/70 text-slate-700")
                    }
                  >
                    {s.name}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-400">No matches.</li>
            )}
          </ul>
        </div>
      }
      settings={
        <>
          <AreaPicker
            area={area}
            onChange={setArea}
            countFor={(a) => countsByArea[a.id] ?? 0}
            minCount={1}
          />
          <ZoomControl
            mode={zoom}
            onModeChange={setZoom}
            level={zoomLevel}
            onLevelChange={setZoomLevel}
          />
          <StylePicker value={mapStyle} onChange={setMapStyle} />
        </>
      }
      map={
        <BergenMap
          highlighted={focus}
          fitTarget={focus}
          showStreetLabel={!!focus}
          area={area}
          fitArea={focus ? null : area}
          zoomMode={zoom}
          zoomLevel={zoomLevel}
          mapStyle={mapStyle}
        />
      }
    />
  );
}
