"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListChecks, SkipForward, RotateCcw } from "lucide-react";
import { GameShell, ScoreBadge } from "@/components/GameShell";
import BergenMap from "@/components/MapClient";
import { AreaPicker } from "@/components/AreaPicker";
import {
  AutoNextPicker,
  StylePicker,
  ZoomControl,
} from "@/components/MapOptions";
import { loadBergen } from "@/lib/data";
import { shuffle } from "@/lib/geo";
import { DEFAULT_AREA, streetInArea, type Area } from "@/lib/areas";
import type { MapStyle, ZoomMode } from "@/components/Map";
import type { BergenData, Street } from "@/lib/types";

type Phase = "guessing" | "revealed";

function pickN<T>(arr: T[], n: number, exclude: T): T[] {
  const pool = arr.filter((x) => x !== exclude);
  return shuffle(pool).slice(0, n);
}

export default function QuizPage() {
  const [data, setData] = useState<BergenData | null>(null);
  const [area, setArea] = useState<Area>(DEFAULT_AREA);
  const [zoom, setZoom] = useState<ZoomMode>("fixed");
  const [zoomLevel, setZoomLevel] = useState(14);
  const [mapStyle, setMapStyle] = useState<MapStyle>("light");
  const [autoNextMs, setAutoNextMs] = useState(0);
  const [target, setTarget] = useState<Street | null>(null);
  const [options, setOptions] = useState<Street[]>([]);
  const [picked, setPicked] = useState<Street | null>(null);
  const [phase, setPhase] = useState<Phase>("guessing");
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [scoredRounds, setScoredRounds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const playable = useMemo(() => {
    if (!data) return [] as Street[];
    return data.streets.filter((s) => {
      const totalPts = s.segments.reduce((n, seg) => n + seg.coords.length, 0);
      if (totalPts < 4) return false;
      return streetInArea(s, area);
    });
  }, [data, area]);

  const deckRef = useRef<Street[]>([]);
  const cursorRef = useRef(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    deckRef.current = shuffle(playable);
    cursorRef.current = 0;
    setRemaining(deckRef.current.length);
  }, [playable]);

  const nextRound = useCallback(() => {
    if (deckRef.current.length < 4) return;
    if (cursorRef.current >= deckRef.current.length) {
      deckRef.current = shuffle(playable);
      cursorRef.current = 0;
    }
    const pick = deckRef.current[cursorRef.current];
    cursorRef.current += 1;
    setRemaining(deckRef.current.length - cursorRef.current);
    const distractors = pickN(playable, 3, pick);
    const opts = shuffle([pick, ...distractors]);
    setTarget(pick);
    setOptions(opts);
    setPicked(null);
    setPhase("guessing");
  }, [playable]);

  useEffect(() => {
    loadBergen().then(setData);
  }, []);

  useEffect(() => {
    if (data) nextRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, area]);

  useEffect(() => {
    if (phase !== "revealed" || autoNextMs <= 0) return;
    const t = window.setTimeout(() => nextRound(), autoNextMs);
    return () => window.clearTimeout(t);
  }, [phase, autoNextMs, nextRound]);

  const choose = (s: Street) => {
    if (phase !== "guessing" || !target) return;
    setPicked(s);
    const correct = s === target;
    setScore((sc) => sc + (correct ? 100 : 0));
    setRounds((r) => r + 1);
    setScoredRounds((n) => n + 1);
    if (correct) {
      setCorrectCount((n) => n + 1);
      setStreak((s2) => {
        const next = s2 + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
    setPhase("revealed");
  };

  const skip = () => {
    setRounds((r) => r + 1);
    setStreak(0);
    nextRound();
  };

  const reset = () => {
    setScore(0);
    setRounds(0);
    setScoredRounds(0);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    deckRef.current = shuffle(playable);
    cursorRef.current = 0;
    setRemaining(deckRef.current.length);
    nextRound();
  };

  const kpis = [
    {
      label: "pool",
      value: `${remaining}/${playable.length}`,
    },
    {
      label: "correct",
      value:
        scoredRounds > 0 ? `${correctCount}/${scoredRounds}` : "0/0",
    },
    { label: "streak", value: String(streak) },
    { label: "best", value: String(bestStreak) },
  ];

  return (
    <GameShell
      title="Multiple choice"
      subtitle="One street is highlighted. Pick its name from four options."
      status={<ScoreBadge score={score} rounds={rounds} extras={kpis} />}
      loading={!data}
      side={
        <>
          <AreaPicker area={area} onChange={setArea} />
          <ZoomControl
            mode={zoom}
            onModeChange={setZoom}
            level={zoomLevel}
            onLevelChange={setZoomLevel}
          />
          <div className="grid grid-cols-2 gap-3">
            <StylePicker value={mapStyle} onChange={setMapStyle} />
            <AutoNextPicker value={autoNextMs} onChange={setAutoNextMs} />
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
              <ListChecks size={12} /> Which street is highlighted?
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {options.map((s) => {
                const isCorrect = phase === "revealed" && s === target;
                const isWrongPick =
                  phase === "revealed" && s === picked && picked !== target;
                const base =
                  "w-full text-left px-3 py-2.5 rounded-md text-sm border transition-colors";
                let tone =
                  "border-slate-200 bg-slate-50 hover:border-bergen-300 hover:bg-white text-ink";
                if (isCorrect) {
                  tone = "border-emerald-300 bg-emerald-50 text-emerald-800";
                } else if (isWrongPick) {
                  tone = "border-rose-300 bg-rose-50 text-rose-800";
                } else if (phase === "revealed") {
                  tone = "border-slate-200 bg-white text-slate-500";
                }
                return (
                  <button
                    key={s.name}
                    onClick={() => choose(s)}
                    disabled={phase === "revealed"}
                    className={`${base} ${tone} disabled:cursor-default`}
                  >
                    {s.name}
                  </button>
                );
              })}
              {options.length === 0 && (
                <div className="text-sm text-slate-400">
                  Not enough streets in this area — pick a wider one.
                </div>
              )}
            </div>
          </div>

          {phase === "revealed" && target && (
            <div
              className={
                "rounded-md border p-3 " +
                (picked === target
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-slate-200 bg-slate-50")
              }
            >
              <div className="text-sm text-slate-500">
                {picked === target ? "Correct" : "Answer"}
              </div>
              <div className="text-2xl font-semibold tracking-tight text-ink mt-0.5">
                {target.name}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                +{picked === target ? 100 : 0} pts
              </div>
            </div>
          )}

          <div className="mt-auto flex gap-2">
            <button
              onClick={nextRound}
              disabled={phase !== "revealed"}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-ink text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-bergen-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next street
            </button>
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
          highlighted={target}
          fitTarget={target}
          showStreetLabel={phase === "revealed"}
          area={area}
          fitArea={area}
          zoomMode={zoom}
          zoomLevel={zoomLevel}
          mapStyle={mapStyle}
        />
      }
    />
  );
}
