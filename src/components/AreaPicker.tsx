"use client";

import { MapPinned } from "lucide-react";
import { AREAS, type Area } from "@/lib/areas";

interface AreaPickerProps {
  area: Area;
  onChange: (a: Area) => void;
  label?: string;
}

export function AreaPicker({ area, onChange, label = "Play area" }: AreaPickerProps) {
  const all = AREAS.find((a) => a.group === "all");
  const bydeler = AREAS.filter((a) => a.group === "bydel");
  const subareas = AREAS.filter((a) => a.group === "sentrum");

  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
        <MapPinned size={12} /> {label}
      </div>
      {all && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Pill active={area.id === all.id} onClick={() => onChange(all)}>
            {all.name}
          </Pill>
        </div>
      )}
      <div className="mt-2.5">
        <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">
          Bydeler
        </div>
        <div className="flex flex-wrap gap-1.5">
          {bydeler.map((a) => (
            <Pill
              key={a.id}
              active={area.id === a.id}
              onClick={() => onChange(a)}
            >
              {a.name}
            </Pill>
          ))}
        </div>
      </div>
      <div className="mt-2.5">
        <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">
          Sentrum sub-areas
        </div>
        <div className="flex flex-wrap gap-1.5">
          {subareas.map((a) => (
            <Pill
              key={a.id}
              active={area.id === a.id}
              onClick={() => onChange(a)}
            >
              {a.name}
            </Pill>
          ))}
        </div>
      </div>
      <div className="text-xs text-slate-400 mt-2 leading-snug">
        {area.blurb}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-2.5 py-1 rounded-full text-xs border transition-colors whitespace-nowrap " +
        (active
          ? "bg-bergen-600 border-bergen-600 text-white font-medium shadow-sm"
          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800")
      }
    >
      {children}
    </button>
  );
}
