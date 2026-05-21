"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crosshair, SkipForward, Check, RotateCcw } from "lucide-react";
import { GameShell, ScoreBadge } from "@/components/GameShell";
import BergenMap from "@/components/MapClient";
import { loadBergen } from "@/lib/data";
import { distanceScore, distanceToStreet, fmtMetres } from "@/lib/geo";
import type { BergenData, LatLng, Street } from "@/lib/types";

type Phase = "guessing" | "revealed";

export default function LocatePage() {
  const [data, setData] = useState<BergenData | null>(null);
  const [target, setTarget] = useState<Street | null>(null);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [phase, setPhase] = useState<Phase>("guessing");
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [lastPoints, setLastPoints] = useState<number | null>(null);

  // Only consider streets that have some actual length — skip tiny alley stubs
  // so the game stays fair.
  const playable = useMemo(() => {
    if (!data) return [] as Street[];
    return data.streets.filter((s) => {
      const totalPts = s.segments.reduce((n, seg) => n + seg.coords.length, 0);
      return totalPts >= 3;
    });
  }, [data]);

  const nextRound = useCallback(() => {
    if (!playable.length) return;
    let pick: Street;
    do {
      pick = playable[Math.floor(Math.random() * playable.length)];
    } while (pick === target);
    setTarget(pick);
    setGuess(null);
    setLastDistance(null);
    setLastPoints(null);
    setPhase("guessing");
  }, [playable, target]);

  useEffect(() => {
    loadBergen().then(setData);
  }, []);

  useEffect(() => {
    if (data && !target) nextRound();
  }, [data, target, nextRound]);

  const submit = () => {
    if (!guess || !target) return;
    const d = distanceToStreet(guess, target);
    const pts = distanceScore(d);
    setLastDistance(d);
    setLastPoints(pts);
    setScore((s) => s + pts);
    setRounds((r) => r + 1);
    setPhase("revealed");
  };

  const skip = () => {
    setRounds((r) => r + 1);
    nextRound();
  };

  const reset = () => {
    setScore(0);
    setRounds(0);
    nextRound();
  };

  return (
    <GameShell
      title="Locate the street"
      subtitle="Read the name, then click where you think the street is."
      status={<ScoreBadge score={score} rounds={rounds} />}
      loading={!data}
      side={
        <>
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
              <Crosshair size={12} />
              Find this street
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              {target?.name ?? "…"}
            </div>
            {target && (
              <div className="text-xs text-slate-400 mt-1 capitalize">
                {target.highway.replace(/_/g, " ")}
              </div>
            )}
          </div>

          {phase === "guessing" && (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {guess
                ? "Marker placed. Hit Check answer when you're ready."
                : "Click anywhere on the map to drop your guess."}
            </div>
          )}

          {phase === "revealed" && lastDistance !== null && lastPoints !== null && (
            <div className="rounded-md border border-slate-200 p-3 bg-bergen-50/40">
              <div className="text-sm text-slate-500">You were off by</div>
              <div className="text-2xl font-semibold tracking-tight text-ink mt-0.5">
                {fmtMetres(lastDistance)}
              </div>
              <div className="text-sm text-slate-500 mt-2">
                +{lastPoints} pts this round
              </div>
            </div>
          )}

          <div className="mt-auto flex gap-2">
            {phase === "guessing" ? (
              <button
                onClick={submit}
                disabled={!guess}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-ink text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-bergen-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Check size={16} /> Check answer
              </button>
            ) : (
              <button
                onClick={nextRound}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-ink text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-bergen-700 transition-colors"
              >
                Next street
              </button>
            )}
            <button
              onClick={skip}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium border border-slate-200 text-slate-600 hover:border-slate-300"
              title="Skip"
            >
              <SkipForward size={16} />
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium border border-slate-200 text-slate-600 hover:border-slate-300"
              title="Reset score"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </>
      }
      map={
        <BergenMap
          marker={guess}
          hint={phase === "revealed" ? target : null}
          fitTarget={phase === "revealed" ? target : null}
          onMapClick={(p) => phase === "guessing" && setGuess(p)}
          showStreetLabel={phase === "revealed"}
        />
      }
    />
  );
}
