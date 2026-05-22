"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Type, SkipForward, Check, RotateCcw, Eye } from "lucide-react";
import { GameShell, ScoreBadge } from "@/components/GameShell";
import BergenMap from "@/components/MapClient";
import { AreaPicker } from "@/components/AreaPicker";
import { loadBergen } from "@/lib/data";
import { normaliseName, similarity } from "@/lib/geo";
import { DEFAULT_AREA, isInArea, type Area } from "@/lib/areas";
import type { BergenData, Street } from "@/lib/types";

type Phase = "guessing" | "revealed";

export default function NamePage() {
  const [data, setData] = useState<BergenData | null>(null);
  const [area, setArea] = useState<Area>(DEFAULT_AREA);
  const [target, setTarget] = useState<Street | null>(null);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("guessing");
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
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
      return isInArea(s.center, area);
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

  const nextRound = useCallback(() => {
    if (!playable.length) return;
    let pick: Street;
    do {
      pick = playable[Math.floor(Math.random() * playable.length)];
    } while (pick === target && playable.length > 1);
    setTarget(pick);
    setText("");
    setVerdict(null);
    setPhase("guessing");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [playable, target]);

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
    setPhase("revealed");
  };

  const reveal = () => {
    if (!target) return;
    setVerdict({ correct: false, similarity: 0, points: 0 });
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
      title="Name the street"
      subtitle="A street is highlighted on the map. What is it called?"
      status={<ScoreBadge score={score} rounds={rounds} />}
      loading={!data}
      side={
        <>
          <AreaPicker area={area} onChange={setArea} />

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
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-ink placeholder:text-slate-400 focus:outline-none focus:border-bergen-500 focus:bg-white"
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-soft overflow-hidden z-10">
                  {suggestions.map((n) => (
                    <li key={n}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setText(n);
                          submit(n);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-bergen-50"
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
                "rounded-md border p-3 " +
                (verdict.correct
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-slate-200 bg-slate-50")
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
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-ink text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-bergen-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Check size={16} /> Check
                </button>
                <button
                  onClick={reveal}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium border border-slate-200 text-slate-600 hover:border-slate-300"
                  title="Reveal answer"
                >
                  <Eye size={16} />
                </button>
              </>
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
          highlighted={target}
          fitTarget={target}
          showStreetLabel={phase === "revealed"}
          area={area}
        />
      }
    />
  );
}
