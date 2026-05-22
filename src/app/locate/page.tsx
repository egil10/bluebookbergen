"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crosshair, SkipForward, Check, RotateCcw } from "lucide-react";
import { GameShell, ScoreBadge } from "@/components/GameShell";
import BergenMap from "@/components/MapClient";
import { AreaPicker } from "@/components/AreaPicker";
import { ZoomToggle } from "@/components/MapOptions";
import { loadBergen } from "@/lib/data";
import { distanceScore, distanceToStreet, fmtMetres } from "@/lib/geo";
import { DEFAULT_AREA, streetInArea, type Area } from "@/lib/areas";
import type { ZoomMode } from "@/components/Map";
import type { BergenData, LatLng, Street } from "@/lib/types";

type Phase = "guessing" | "revealed";

export default function LocatePage() {
  const [data, setData] = useState<BergenData | null>(null);
  const [area, setArea] = useState<Area>(DEFAULT_AREA);
  const [zoom, setZoom] = useState<ZoomMode>("auto");
  const [target, setTarget] = useState<Street | null>(null);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [phase, setPhase] = useState<Phase>("guessing");
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [scoredRounds, setScoredRounds] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [bestDistance, setBestDistance] = useState<number | null>(null);
  const [perfectCount, setPerfectCount] = useState(0);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [lastPoints, setLastPoints] = useState<number | null>(null);

  const playable = useMemo(() => {
    if (!data) return [] as Street[];
    return data.streets.filter((s) => {
      const totalPts = s.segments.reduce((n, seg) => n + seg.coords.length, 0);
      if (totalPts < 3) return false;
      return streetInArea(s, area);
    });
  }, [data, area]);

  const nextRound = useCallback(() => {
    if (!playable.length) return;
    let pick: Street;
    do {
      pick = playable[Math.floor(Math.random() * playable.length)];
    } while (pick === target && playable.length > 1);
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
    if (data) nextRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, area]);

  const submit = () => {
    if (!guess || !target) return;
    const d = distanceToStreet(guess, target);
    const pts = distanceScore(d);
    setLastDistance(d);
    setLastPoints(pts);
    setScore((s) => s + pts);
    setRounds((r) => r + 1);
    setScoredRounds((n) => n + 1);
    setTotalDistance((t) => t + d);
    setBestDistance((b) => (b === null ? d : Math.min(b, d)));
    if (d <= 25) setPerfectCount((n) => n + 1);
    setPhase("revealed");
  };

  const skip = () => {
    setRounds((r) => r + 1);
    nextRound();
  };

  const reset = () => {
    setScore(0);
    setRounds(0);
    setScoredRounds(0);
    setTotalDistance(0);
    setBestDistance(null);
    setPerfectCount(0);
    nextRound();
  };

  const kpis = [
    {
      label: "total off",
      value: scoredRounds > 0 ? fmtMetres(totalDistance) : "—",
    },
    {
      label: "avg",
      value:
        scoredRounds > 0 ? fmtMetres(totalDistance / scoredRounds) : "—",
    },
    {
      label: "best",
      value: bestDistance !== null ? fmtMetres(bestDistance) : "—",
    },
    { label: "spot-on", value: String(perfectCount) },
  ];

  return (
    <GameShell
      title="Locate the street"
      subtitle="Read the name, then click where you think the street is."
      status={<ScoreBadge score={score} rounds={rounds} extras={kpis} />}
      loading={!data}
      side={
        <>
          <AreaPicker area={area} onChange={setArea} />
          <ZoomToggle value={zoom} onChange={setZoom} />

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
          area={area}
          fitArea={area}
          zoomMode={zoom}
        />
      }
    />
  );
}
