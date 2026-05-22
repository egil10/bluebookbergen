"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

interface GameShellProps {
  title: string;
  subtitle?: string;
  side: ReactNode; // the prompt / controls column
  map: ReactNode;
  status?: ReactNode; // small inline status row (e.g. score breakdown)
  loading?: boolean;
}

// The body is locked to the viewport (see layout.tsx). GameShell takes the
// full remaining height inside <main> and never scrolls itself — the
// side panel scrolls internally, the map fills its own column.
export function GameShell({ title, subtitle, side, map, status, loading }: GameShellProps) {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="mx-auto max-w-6xl w-full px-5 py-4 md:py-5 flex items-baseline justify-between shrink-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {status}
      </div>
      <div className="mx-auto max-w-6xl w-full px-5 pb-5 md:pb-6 grid grid-cols-1 md:grid-cols-[360px_1fr] grid-rows-[minmax(0,40dvh)_minmax(0,1fr)] md:grid-rows-1 gap-3 md:gap-5 flex-1 min-h-0">
        <aside className="bg-white border border-slate-200 rounded-xl shadow-soft p-5 flex flex-col gap-4 min-h-0 h-full overflow-y-auto">
          {side}
        </aside>
        <section className="bg-white border border-slate-200 rounded-xl shadow-soft overflow-hidden relative min-h-0 h-full">
          {loading && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-white/70">
              <Loader2 className="animate-spin text-bergen-600" />
            </div>
          )}
          {map}
        </section>
      </div>
    </div>
  );
}

export interface KpiChip {
  label: string;
  value: string;
}

export function ScoreBadge({
  score,
  rounds,
  extras = [],
}: {
  score: number;
  rounds: number;
  extras?: KpiChip[];
}) {
  return (
    <div className="flex items-center gap-2 md:gap-3 text-sm flex-wrap justify-end max-w-[60%]">
      <div className="px-3 py-1.5 rounded-md bg-bergen-50 border border-bergen-100 text-bergen-700 font-medium">
        {score} pts
      </div>
      <div className="text-slate-500 whitespace-nowrap">round {rounds}</div>
      {extras.map((e) => (
        <div
          key={e.label}
          className="text-xs whitespace-nowrap px-2 py-1 rounded-md bg-white border border-slate-200"
        >
          <span className="text-slate-400 uppercase tracking-wider">
            {e.label}
          </span>{" "}
          <span className="text-ink font-medium">{e.value}</span>
        </div>
      ))}
    </div>
  );
}
