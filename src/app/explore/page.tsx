"use client";

import { useEffect, useMemo, useState } from "react";
import { Compass, Eye, EyeOff } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import BergenMap from "@/components/MapClient";
import { AreaPicker } from "@/components/AreaPicker";
import { loadBergen } from "@/lib/data";
import { normaliseName } from "@/lib/geo";
import { DEFAULT_AREA, isInArea, type Area } from "@/lib/areas";
import type { BergenData, Street } from "@/lib/types";

export default function ExplorePage() {
  const [data, setData] = useState<BergenData | null>(null);
  const [area, setArea] = useState<Area>(DEFAULT_AREA);
  const [labels, setLabels] = useState(false);
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
    return data.streets.filter((s) => isInArea(s.center, area));
  }, [data, area]);

  // For the "all labels" overlay, cap to a sensible number so the map doesn't
  // turn into soup. Pick a deterministic slice of the longest streets so the
  // labels stay stable as you pan.
  const labelLayer = useMemo(() => {
    if (!labels) return [] as Street[];
    return [...inArea]
      .sort(
        (a, b) =>
          b.segments.reduce((n, s) => n + s.coords.length, 0) -
          a.segments.reduce((n, s) => n + s.coords.length, 0),
      )
      .slice(0, 80);
  }, [inArea, labels]);

  const filtered = useMemo(() => {
    if (!query.trim()) return inArea;
    const q = normaliseName(query);
    return inArea.filter((s) => normaliseName(s.name).includes(q));
  }, [inArea, query]);

  return (
    <GameShell
      title="Explore the map"
      subtitle="Pan around, toggle labels, click a name to fly to it."
      loading={!data}
      side={
        <>
          <AreaPicker area={area} onChange={setArea} />

          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
              <Compass size={12} /> Labels
            </div>
            <button
              onClick={() => setLabels((v) => !v)}
              className={
                "mt-2 w-full inline-flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors " +
                (labels
                  ? "border-bergen-200 bg-bergen-50 text-bergen-800"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300")
              }
            >
              <span>{labels ? "Showing street names" : "Hide street names"}</span>
              {labels ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <div className="text-xs text-slate-400 mt-1.5">
              Toggle on to overlay the names of the {inArea.length} streets in this area
              (the longest 80 to keep the map legible).
            </div>
          </div>

          <div className="flex flex-col min-h-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1.5">
              Fly to a street
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this area…"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-ink placeholder:text-slate-400 focus:outline-none focus:border-bergen-500 focus:bg-white text-sm"
            />
            <ul className="mt-2 flex-1 overflow-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-100">
              {filtered.slice(0, 200).map((s) => {
                const isSel = s === focus;
                return (
                  <li key={s.name}>
                    <button
                      onClick={() => setFocus(s)}
                      className={
                        "w-full text-left px-3 py-1.5 text-sm transition-colors " +
                        (isSel
                          ? "bg-bergen-100 text-bergen-800"
                          : "hover:bg-slate-50 text-slate-700")
                      }
                    >
                      {s.name}
                    </button>
                  </li>
                );
              })}
              {filtered.length > 200 && (
                <li className="px-3 py-1.5 text-xs text-slate-400">
                  + {filtered.length - 200} more
                </li>
              )}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-slate-400">No matches.</li>
              )}
            </ul>
          </div>
        </>
      }
      map={
        <BergenMap
          highlighted={focus}
          fitTarget={focus}
          showStreetLabel={!!focus}
          area={area}
          fitArea={focus ? null : area}
          background={labelLayer}
          backgroundLabels={labels}
        />
      }
    />
  );
}
