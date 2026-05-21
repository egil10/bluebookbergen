"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ListOrdered } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import BergenMap from "@/components/MapClient";
import { loadBergen } from "@/lib/data";
import { normaliseName } from "@/lib/geo";
import type { BergenData, Street } from "@/lib/types";

export default function StreetsPage() {
  const [data, setData] = useState<BergenData | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Street | null>(null);

  useEffect(() => {
    loadBergen().then(setData);
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [] as Street[];
    if (!query.trim()) return data.streets;
    const q = normaliseName(query);
    return data.streets.filter((s) => normaliseName(s.name).includes(q));
  }, [data, query]);

  return (
    <GameShell
      title="Every street in Bergen Sentrum"
      subtitle={
        data
          ? `${data.streets.length} streets, ${data.pois.length} landmarks. Search and tap a name to see it traced.`
          : ""
      }
      loading={!data}
      side={
        <>
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
                placeholder="Search…"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-ink placeholder:text-slate-400 focus:outline-none focus:border-bergen-500 focus:bg-white text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto no-scrollbar -mx-2">
            <ul className="px-2 space-y-0.5">
              {filtered.slice(0, 400).map((s) => {
                const isSel = s === selected;
                return (
                  <li key={s.name}>
                    <button
                      onClick={() => setSelected(s)}
                      className={
                        "w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors " +
                        (isSel
                          ? "bg-bergen-100 text-bergen-800"
                          : "hover:bg-slate-100 text-slate-700")
                      }
                    >
                      {s.name}
                      <span className="ml-2 text-xs text-slate-400 capitalize">
                        {s.highway.replace(/_/g, " ")}
                      </span>
                    </button>
                  </li>
                );
              })}
              {filtered.length > 400 && (
                <li className="px-2 py-1.5 text-xs text-slate-400">
                  + {filtered.length - 400} more — keep typing to narrow it down.
                </li>
              )}
              {filtered.length === 0 && (
                <li className="px-2 py-3 text-sm text-slate-400">
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
        />
      }
    />
  );
}
