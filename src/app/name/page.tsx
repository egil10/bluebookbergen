"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Type, SkipForward, Check, RotateCcw, Eye } from "lucide-react";
import { GameShell, ScoreBadge } from "@/components/GameShell";
import BergenMap from "@/components/MapClient";
import { AreaPicker } from "@/components/AreaPicker";
import { StylePicker, ZoomControl } from "@/components/MapOptions";
import { loadBergen } from "@/lib/data";
import { normaliseName, shuffle, similarity } from "@/lib/geo";
import { DEFAULT_AREA, streetInArea, type Area } from "@/lib/areas";
import type { MapStyle, ZoomMode } from "@/components/Map";
import type { BergenData, Street } from "@/lib/types";

type Phase = "guessing" | "revealed";

export default function NamePage() {
  const [data, setData] = useState<BergenData | null>(null);
  const [area, setArea] = useState<Area>(DEFAULT_AREA);
  const [zoom, setZoom] = useState<ZoomMode>("fixed");
  const [zoomLevel, setZoomLevel] = useState(14);
  const [mapStyle, setMapStyle] = useState<MapStyle>("light");
  const [target, setTarget] = useState<Street | null>(null);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("guessing");
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [scoredRounds, setScoredRounds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [verdict, setVerdict] = useState<null | {
    correct: boolean;
    similarity: number;
    points: number;
  }>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const playable = useMemo(() => {
    if (!data) return [] as Street[];
    return data.streets.filter((s) => {
      const totalPts = s.segments.reduce((n, seg) => n + seg.coords.length, 0);
      if (totalPts < 4) return false;
      return streetInArea(s, area);
    });
  }, [data, area]);

  const allNames = useMemo(
    () => (data?.streets ?? []).map((s) => s.name),
    [data],
  );

  const suggestions = useMemo(() => {
    if (!text || phase !== "guessing") return [];
    const q = normaliseName(text);
    if (q.length < 2) return [];
    return allNames
      .filter((n) => normaliseName(n).includes(q))
      .slice(0, 6);
  }, [text, allNames, phase]);

  const deckRef = useRef<Street[]>([]);
  const cursorRef = useRef(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    deckRef.current = shuffle(playable);
    cursorRef.current = 0;
    setRemaining(deckRef.current.length);
  }, [playable]);

  const nextRound = useCallback(() => {
    if (deckRef.current.length === 0) return;
    if (cursorRef.current >= deckRef.current.length) {
      deckRef.current = shuffle(playable);
      cursorRef.current = 0;
    }
    const pick = deckRef.current[cursorRef.current];
    cursorRef.current += 1;
    setRemaining(deckRef.current.length - cursorRef.current);
    setTarget(pick);
    setText("");
    setVerdict(null);
    setPhase("guessing");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [playable]);

  useEffect(() => {
    loadBergen().then(setData);
  }, []);

  useEffect(() => {
    if (data) nextRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, area]);

  const submit = (override?: string) => {
    if (!target) return;
    const answer = override ?? text;
    if (!answer.trim()) return;
    const sim = similarity(answer, target.name);
    const correct = sim >= 0.9;
    const points = correct ? 100 : sim >= 0.7 ? 50 : sim >= 0.5 ? 20 : 0;
    setVerdict({ correct, similarity: sim, points });
    setScore((s) => s + points);
    setRounds((r) => r + 1);
    setScoredRounds((n) => n + 1);
    if (correct) {
      setCorrectCount((n) => n + 1);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
    setPhase("revealed");
  };

  const reveal = () => {
    if (!target) return;
    setVerdict({ correct: false, similarity: 0, points: 0 });
    setRounds((r) => r + 1);
    setScoredRounds((n) => n + 1);
    setStreak(0);
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
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    deckRef.current = shuffle(playable);
    cursorRef.current = 0;
    setRemaining(deckRef.current.length);
    nextRound();
  };

  const kpis = [
    { label: "pool", value: `${remaining}/${playable.length}` },
    {
      label: "correct",
      value: scoredRounds > 0 ? `${correctCount}/${scoredRounds}` : "0/0",
    },
    { label: "streak", value: String(streak) },
    { label: "best", value: String(bestStreak) },
  ];

  return (
    <GameShell
      title="Name the street"
      subtitle="A street is highlighted on the map. What is it called?"
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
          <StylePicker value={mapStyle} onChange={setMapStyle} />

          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
              <Type size={12} />
              Type the street name
            </div>
            <div className="mt-2 relative">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={phase === "revealed"}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (phase === "guessing") submit();
                    else nextRound();
                  }
                }}
                placeholder="e.g. Bryggen"
                className="w-full px-3 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-ink placeholder:text-slate-400 focus:outline-none focus:border-bergen-500 focus:bg-white transition-colors"
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 glass shadow-soft rounded-xl overflow-hidden z-10">
                  {suggestions.map((n) => (
                    <li key={n}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setText(n);
                          submit(n);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-bergen-50/60 transition-colors"
                      >
                        {n}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {phase === "revealed" && verdict && target && (
            <div
              className={
                "rounded-xl border p-3 " +
                (verdict.correct
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-slate-200 bg-slate-50/60")
              }
            >
              <div className="text-sm text-slate-500">
                {verdict.correct ? "Spot on" : "The answer was"}
              </div>
              <div className="text-2xl font-semibold tracking-tight text-ink mt-0.5">
                {target.name}
              </div>
              <div className="text-sm text-slate-500 mt-2">
                +{verdict.points} pts · match {(verdict.similarity * 100).toFixed(0)}%
              </div>
            </div>
          )}

          <div className="mt-auto flex gap-2">
            {phase === "guessing" ? (
              <>
                <button
                  onClick={() => submit()}
                  disabled={!text.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-ink text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-bergen-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Check size={16} /> Check
                </button>
                <button
                  onClick={reveal}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:border-slate-300 bg-white/60 transition-all"
                  title="Reveal answer"
                >
                  <Eye size={16} />
                </button>
              </>
            ) : (
              <button
                onClick={nextRound}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-ink text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-bergen-700 transition-all"
              >
                Next street
              </button>
            )}
            <button
              onClick={skip}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:border-slate-300 bg-white/60 transition-all"
              title="Skip"
            >
              <SkipForward size={16} />
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:border-slate-300 bg-white/60 transition-all"
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
