"use client";

import { Check, MapPinned } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AREAS, type Area } from "@/lib/areas";

interface AreaPickerProps {
  area: Area;
  onChange: (a: Area) => void;
  label?: string;
  // Optional per-area count function. When provided, pills show "(N)" and
  // pills with N < minCount are hidden entirely. Used by every game mode
  // so empty/too-small areas disappear from the picker for that mode.
  countFor?: (a: Area) => number;
  minCount?: number;
}

export function AreaPicker({
  area,
  onChange,
  label = "Play area",
  countFor,
  minCount = 1,
}: AreaPickerProps) {
  const all = AREAS.find((a) => a.group === "all");
  const bydeler = AREAS.filter((a) => a.group === "bydel");
  const subareas = AREAS.filter((a) => a.group === "sentrum");

  // Brief "✓ applied" confirmation when the area changes.
  const [applied, setApplied] = useState(false);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setApplied(true);
    const t = window.setTimeout(() => setApplied(false), 1100);
    return () => window.clearTimeout(t);
  }, [area.id]);

  const visible = (a: Area): boolean => {
    if (!countFor) return true;
    if (a.id === area.id) return true; // never hide the currently active pill
    return countFor(a) >= minCount;
  };
  const renderCount = (a: Area) =>
    countFor ? (
      <span className="ml-1 opacity-60 tabular-nums">
        {countFor(a)}
      </span>
    ) : null;

  const visibleSubareas = subareas.filter(visible);
  const visibleBydeler = bydeler.filter(visible);

  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
        <MapPinned size={12} /> {label}
        <span
          className={
            "ml-auto inline-flex items-center gap-1 text-[10px] normal-case tracking-normal text-emerald-600 transition-opacity " +
            (applied ? "opacity-100" : "opacity-0")
          }
          aria-live="polite"
        >
          <Check size={11} /> applied
        </span>
      </div>
      {all && visible(all) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Pill active={area.id === all.id} onClick={() => onChange(all)}>
            {all.name}
            {renderCount(all)}
          </Pill>
        </div>
      )}
      {visibleBydeler.length > 0 && (
        <div className="mt-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">
            Bydeler
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleBydeler.map((a) => (
              <Pill
                key={a.id}
                active={area.id === a.id}
                onClick={() => onChange(a)}
              >
                {a.name}
                {renderCount(a)}
              </Pill>
            ))}
          </div>
        </div>
      )}
      {visibleSubareas.length > 0 && (
        <div className="mt-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">
            Sentrum sub-areas
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleSubareas.map((a) => (
              <Pill
                key={a.id}
                active={area.id === a.id}
                onClick={() => onChange(a)}
              >
                {a.name}
                {renderCount(a)}
              </Pill>
            ))}
          </div>
        </div>
      )}
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
