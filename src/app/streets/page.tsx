"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ListOrdered, X } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import BergenMap from "@/components/MapClient";
import { AreaPicker } from "@/components/AreaPicker";
import { ZoomToggle } from "@/components/MapOptions";
import { loadBergen } from "@/lib/data";
import { normaliseName } from "@/lib/geo";
import { DEFAULT_AREA, streetInArea, type Area } from "@/lib/areas";
import type { ZoomMode } from "@/components/Map";
import type { BergenData, Street } from "@/lib/types";

export default function StreetsPage() {
  const [data, setData] = useState<BergenData | null>(null);
  const [area, setArea] = useState<Area>(DEFAULT_AREA);
  const [zoom, setZoom] = useState<ZoomMode>("auto");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Street | null>(null);

  useEffect(() => {
    loadBergen().then(setData);
  }, []);

  const inArea = useMemo(() => {
    if (!data) return [] as Street[];
    return data.streets.filter((s) => streetInArea(s, area));
  }, [data, area]);

  const filtered = useMemo(() => {
    if (!query.trim()) return inArea;
    const q = normaliseName(query);
    return inArea.filter((s) => normaliseName(s.name).includes(q));
  }, [inArea, query]);

  return (
    <GameShell
      title="Every street in Bergen Sentrum"
      subtitle={
        data
          ? `${data.streets.length} streets, ${data.pois.length} landmarks. Pick an area, then tap a name to see it traced.`
          : ""
      }
      loading={!data}
      side={
        <>
          <AreaPicker area={area} onChange={setArea} />
          <ZoomToggle value={zoom} onChange={setZoom} />

          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
              <ListOrdered size={12} /> Street index
            </div>
            <div className="mt-2 relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search this area…"
                className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md text-ink placeholder:text-slate-400 focus:outline-none focus:border-bergen-500 focus:bg-white text-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center w-6 h-6 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="clear"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="mt-1.5 text-xs text-slate-400">
              {filtered.length} of {inArea.length}
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col rounded-md border border-slate-200 bg-white overflow-hidden max-h-[50vh] md:max-h-none">
            <ul className="flex-1 overflow-auto divide-y divide-slate-100">
              {filtered.map((s) => {
                const isSel = s === selected;
                return (
                  <li key={s.name}>
                    <button
                      onClick={() => setSelected(s)}
                      className={
                        "w-full text-left px-3 py-1.5 text-sm transition-colors flex items-baseline gap-2 " +
                        (isSel
                          ? "bg-bergen-100 text-bergen-800"
                          : "hover:bg-slate-50 text-slate-700")
                      }
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider text-slate-400">
                        {s.highway.replace(/_/g, " ")}
                      </span>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-4 text-sm text-slate-400 text-center">
                  No streets match.
                </li>
              )}
            </ul>
          </div>
        </>
      }
      map={
        <BergenMap
          highlighted={selected}
          fitTarget={selected}
          showStreetLabel={!!selected}
          area={area}
          fitArea={selected ? null : area}
          zoomMode={zoom}
        />
      }
    />
  );
}
