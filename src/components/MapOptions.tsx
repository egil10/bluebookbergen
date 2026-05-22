"use client";

import { Maximize2, Timer } from "lucide-react";
import type { ZoomMode } from "./Map";

interface ZoomToggleProps {
  value: ZoomMode;
  onChange: (z: ZoomMode) => void;
}

export function ZoomToggle({ value, onChange }: ZoomToggleProps) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
        <Maximize2 size={12} /> Zoom
      </div>
      <div className="mt-2 inline-flex bg-slate-50 border border-slate-200 rounded-md p-0.5 text-xs">
        <Chip active={value === "auto"} onClick={() => onChange("auto")}>
          Auto
        </Chip>
        <Chip active={value === "manual"} onClick={() => onChange("manual")}>
          Manual
        </Chip>
      </div>
      <div className="text-xs text-slate-400 mt-1.5 leading-snug">
        {value === "auto"
          ? "Map re-frames to each round."
          : "Map keeps your zoom level between rounds."}
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
