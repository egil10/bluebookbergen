"use client";

import { ChevronDown, Loader2, Settings2 } from "lucide-react";
import type { ReactNode } from "react";

interface GameShellProps {
  title: string;
  subtitle?: string;
  side: ReactNode; // game-state content + action buttons
  settings?: ReactNode; // configuration controls — collapsible at bottom
  map: ReactNode;
  status?: ReactNode;
  loading?: boolean;
}

export function GameShell({
  title,
  subtitle,
  side,
  settings,
  map,
  status,
  loading,
}: GameShellProps) {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="mx-auto max-w-6xl w-full px-5 py-3 md:py-4 flex items-baseline justify-between shrink-0 gap-3 animate-fade-up">
        <div>
          <h1 className="text-xl md:text-[1.35rem] font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && (
            <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {status}
      </div>
      <div className="mx-auto max-w-6xl w-full px-3 md:px-5 pb-4 md:pb-6 grid grid-cols-1 md:grid-cols-[360px_1fr] grid-rows-[minmax(0,40dvh)_minmax(0,1fr)] md:grid-rows-1 gap-3 md:gap-5 flex-1 min-h-0 animate-fade-up">
        <aside className="glass shadow-glass rounded-2xl p-5 flex flex-col gap-4 min-h-0 h-full overflow-y-auto thin-scrollbar">
          {side}
          {settings && (
            <details className="group mt-auto pt-3 border-t border-slate-200/70 -mx-1">
              <summary className="cursor-pointer list-none flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium hover:text-slate-600 transition-colors px-1 py-0.5 rounded-md">
                <Settings2 size={12} />
                <span>Settings</span>
                <ChevronDown
                  size={12}
                  className="ml-auto transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="mt-3 px-1 flex flex-col gap-4">
                {settings}
              </div>
            </details>
          )}
        </aside>
        <section className="glass shadow-glass rounded-2xl overflow-hidden relative min-h-0 h-full">
          {loading && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-white/60 backdrop-blur-sm">
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
    <div className="flex items-center gap-2 text-sm flex-wrap justify-end max-w-[65%]">
      <div className="px-3 py-1.5 rounded-full bg-ink text-white text-xs font-medium tracking-tight shadow-sm">
        {score} pts
      </div>
      <div className="text-xs text-slate-500 whitespace-nowrap px-2">round {rounds}</div>
      {extras.map((e) => (
        <div
          key={e.label}
          className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full glass shadow-sm"
        >
          <span className="text-slate-400 uppercase tracking-wider mr-1">
            {e.label}
          </span>
          <span className="text-ink font-medium tabular-nums">{e.value}</span>
        </div>
      ))}
    </div>
  );
}
