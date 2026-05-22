"use client";

import { MapPinned } from "lucide-react";
import { AREAS, type Area } from "@/lib/areas";

interface AreaPickerProps {
  area: Area;
  onChange: (a: Area) => void;
  label?: string;
}

export function AreaPicker({ area, onChange, label = "Play area" }: AreaPickerProps) {
  const bydeler = AREAS.filter((a) => a.group === "bydel");
  const sentrum = AREAS.filter((a) => a.group === "sentrum");
  const all = AREAS.find((a) => a.group === "all");

  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
        <MapPinned size={12} /> {label}
      </div>
      <div className="mt-2">
        <select
          value={area.id}
          onChange={(e) => {
            const next = AREAS.find((a) => a.id === e.target.value);
            if (next) onChange(next);
          }}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-ink text-sm focus:outline-none focus:border-bergen-500 focus:bg-white appearance-none cursor-pointer"
        >
          {all && <option value={all.id}>{all.name}</option>}
          <optgroup label="Bydeler">
            {bydeler.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Sentrum sub-areas">
            {sentrum.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </optgroup>
        </select>
        <div className="text-xs text-slate-400 mt-1.5 leading-snug">{area.blurb}</div>
      </div>
    </div>
  );
}
