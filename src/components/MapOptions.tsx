"use client";

import { Maximize2, Layers, Timer } from "lucide-react";
import type { MapStyle, ZoomMode } from "./Map";

interface ZoomControlProps {
  mode: ZoomMode;
  onModeChange: (z: ZoomMode) => void;
  level: number;
  onLevelChange: (n: number) => void;
}

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
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Pill active={mode === "auto"} onClick={() => onModeChange("auto")}>
          Auto
        </Pill>
        <Pill active={mode === "fixed"} onClick={() => onModeChange("fixed")}>
          Fixed
        </Pill>
        <Pill active={mode === "manual"} onClick={() => onModeChange("manual")}>
          Manual
        </Pill>
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
  value: number;
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
      <div className="mt-2 flex flex-wrap gap-1.5">
        {AUTO_NEXT_OPTIONS.map((o) => (
          <Pill
            key={o.v}
            active={value === o.v}
            onClick={() => onChange(o.v)}
          >
            {o.label}
          </Pill>
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
      <div className="mt-2 flex flex-wrap gap-1.5">
        {STYLE_OPTIONS.map((o) => (
          <Pill
            key={o.v}
            active={value === o.v}
            onClick={() => onChange(o.v)}
          >
            {o.label}
          </Pill>
        ))}
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
