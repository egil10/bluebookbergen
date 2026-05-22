"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, SkipForward, Check, RotateCcw } from "lucide-react";
import { GameShell, ScoreBadge } from "@/components/GameShell";
import BergenMap from "@/components/MapClient";
import { AreaPicker } from "@/components/AreaPicker";
import { ZoomToggle } from "@/components/MapOptions";
import { loadBergen } from "@/lib/data";
import { fmtMetres, haversine } from "@/lib/geo";
import { DEFAULT_AREA, poiInArea, type Area } from "@/lib/areas";
import type { ZoomMode } from "@/components/Map";
import type { BergenData, LatLng, Poi } from "@/lib/types";

type Phase = "guessing" | "revealed";

// Tighter than the street locator — exact pin should be within 30 m to score
// full marks, decaying to 0 by 400 m.
function pinScore(metres: number): number {
  if (metres <= 30) return 100;
  if (metres >= 400) return 0;
  return Math.round(100 - ((metres - 30) / (400 - 30)) * 100);
}

export default function PinPage() {
  const [data, setData] = useState<BergenData | null>(null);
  const [area, setArea] = useState<Area>(DEFAULT_AREA);
  const [zoom, setZoom] = useState<ZoomMode>("auto");
  const [target, setTarget] = useState<Poi | null>(null);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [phase, setPhase] = useState<Phase>("guessing");
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [scoredRounds, setScoredRounds] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [bestDistance, setBestDistance] = useState<number | null>(null);
  const [perfectCount, setPerfectCount] = useState(0);
  const [last, setLast] = useState<{ distance: number; points: number } | null>(null);

  const playable = useMemo(() => {
    if (!data) return [] as Poi[];
    const pool = data.pois.filter((p) => poiInArea(p, area));
    return pool.length > 0 ? pool : data.pois;
  }, [data, area]);

  const nextRound = useCallback(() => {
    if (!playable.length) return;
    let pick: Poi;
    do {
      pick = playable[Math.floor(Math.random() * playable.length)];
    } while (pick === target && playable.length > 1);
    setTarget(pick);
    setGuess(null);
    setLast(null);
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
    const d = haversine(guess, [target.lat, target.lon]);
    const pts = pinScore(d);
    setLast({ distance: d, points: pts });
    setScore((s) => s + pts);
    setRounds((r) => r + 1);
    setScoredRounds((n) => n + 1);
    setTotalDistance((t) => t + d);
    setBestDistance((b) => (b === null ? d : Math.min(b, d)));
    if (d <= 30) setPerfectCount((n) => n + 1);
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

  const answerMarker: LatLng | null =
    phase === "revealed" && target ? [target.lat, target.lon] : null;

  return (
    <GameShell
      title="Pin the address"
      subtitle="A landmark in Bergen. Drop a pin exactly where it stands."
      status={<ScoreBadge score={score} rounds={rounds} extras={kpis} />}
      loading={!data}
      side={
        <>
          <AreaPicker area={area} onChange={setArea} />
          <ZoomToggle value={zoom} onChange={setZoom} />

          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
              <MapPin size={12} />
              Pin this address
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-ink leading-tight">
              {target?.name ?? "…"}
            </div>
            {target && (
              <div className="text-xs text-slate-400 mt-1 capitalize">
                {target.kind.replace(/_/g, " ")}
              </div>
            )}
          </div>

          {phase === "guessing" && (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {guess
                ? "Pin placed. Hit Check answer when you're ready."
                : "Click the map to drop your pin on the exact spot."}
            </div>
          )}

          {phase === "revealed" && last && (
            <div className="rounded-md border border-slate-200 p-3 bg-bergen-50/40">
              <div className="text-sm text-slate-500">You were off by</div>
              <div className="text-2xl font-semibold tracking-tight text-ink mt-0.5">
                {fmtMetres(last.distance)}
              </div>
              <div className="text-sm text-slate-500 mt-2">
                +{last.points} pts this round
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
                Next address
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
          answerMarker={answerMarker}
          onMapClick={(p) => phase === "guessing" && setGuess(p)}
          area={area}
          fitArea={area}
          zoomMode={zoom}
        />
      }
    />
  );
}
