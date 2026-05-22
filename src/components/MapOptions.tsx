"use client";

import { Maximize2, Layers, Timer } from "lucide-react";
import type { MapStyle, ZoomMode } from "./Map";

interface ZoomControlProps {
  mode: ZoomMode;
  onModeChange: (z: ZoomMode) => void;
  level: number;
  onLevelChange: (n: number) => void;
}

// Single panel that owns both the mode and the slider. Auto re-fits to each
// round; Fixed pans to the target's centre at the chosen zoom and holds
// that zoom across rounds; Manual leaves the map entirely alone.
export function ZoomControl({
  mode,
  onModeChange,
  level,
  onLevelChange,
}: ZoomControlProps) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
        <Maximize2 size={12} /> Zoom
      </div>
      <div className="mt-2 inline-flex bg-slate-50 border border-slate-200 rounded-md p-0.5 text-xs">
        <Chip active={mode === "auto"} onClick={() => onModeChange("auto")}>
          Auto
        </Chip>
        <Chip active={mode === "fixed"} onClick={() => onModeChange("fixed")}>
          Fixed
        </Chip>
        <Chip active={mode === "manual"} onClick={() => onModeChange("manual")}>
          Manual
        </Chip>
      </div>
      {mode === "fixed" && (
        <div className="mt-2.5 flex items-center gap-2">
          <input
            type="range"
            min={11}
            max={18}
            step={1}
            value={level}
            onChange={(e) => onLevelChange(parseInt(e.target.value, 10))}
            className="flex-1 accent-bergen-600"
          />
          <span className="text-xs font-mono text-slate-500 tabular-nums w-6 text-right">
            {level}
          </span>
        </div>
      )}
      <div className="text-xs text-slate-400 mt-1.5 leading-snug">
        {mode === "auto"
          ? "Map re-frames tightly to each round."
          : mode === "fixed"
            ? `Map centres on each street at zoom ${level} and holds it.`
            : "Map keeps your current pan and zoom between rounds."}
      </div>
    </div>
  );
}

interface AutoNextPickerProps {
  value: number; // ms; 0 = off
  onChange: (ms: number) => void;
}

const AUTO_NEXT_OPTIONS = [
  { v: 0, label: "Off" },
  { v: 1000, label: "1s" },
  { v: 3000, label: "3s" },
  { v: 5000, label: "5s" },
];

export function AutoNextPicker({ value, onChange }: AutoNextPickerProps) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
        <Timer size={12} /> Auto-next
      </div>
      <div className="mt-2 inline-flex bg-slate-50 border border-slate-200 rounded-md p-0.5 text-xs">
        {AUTO_NEXT_OPTIONS.map((o) => (
          <Chip
            key={o.v}
            active={value === o.v}
            onClick={() => onChange(o.v)}
          >
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

interface StylePickerProps {
  value: MapStyle;
  onChange: (s: MapStyle) => void;
}

const STYLE_OPTIONS: { v: MapStyle; label: string }[] = [
  { v: "light", label: "Light" },
  { v: "minimal", label: "Clean" },
  { v: "voyager", label: "Color" },
  { v: "osm", label: "Detail" },
  { v: "satellite", label: "Sat" },
];

export function StylePicker({ value, onChange }: StylePickerProps) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
        <Layers size={12} /> Map style
      </div>
      <div className="mt-2 inline-flex bg-slate-50 border border-slate-200 rounded-md p-0.5 text-xs flex-wrap">
        {STYLE_OPTIONS.map((o) => (
          <Chip
            key={o.v}
            active={value === o.v}
            onClick={() => onChange(o.v)}
          >
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({
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
        "px-2.5 py-1 rounded transition-colors " +
        (active
          ? "bg-white border border-slate-200 text-ink shadow-sm"
          : "text-slate-500 hover:text-slate-700")
      }
    >
      {children}
    </button>
  );
}
