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

export function GameShell({ title, subtitle, side, map, status, loading }: GameShellProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="mx-auto max-w-6xl w-full px-5 py-5 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {status}
      </div>
      <div className="mx-auto max-w-6xl w-full px-5 pb-8 grid grid-cols-1 md:grid-cols-[360px_1fr] gap-5 flex-1">
        <aside className="bg-white border border-slate-200 rounded-xl shadow-soft p-5 flex flex-col gap-4 min-h-[420px]">
          {side}
        </aside>
        <section className="bg-white border border-slate-200 rounded-xl shadow-soft overflow-hidden relative min-h-[420px]">
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

export function ScoreBadge({
  score,
  rounds,
}: {
  score: number;
  rounds: number;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="px-3 py-1.5 rounded-md bg-bergen-50 border border-bergen-100 text-bergen-700 font-medium">
        {score} pts
      </div>
      <div className="text-slate-500">round {rounds}</div>
    </div>
  );
}
