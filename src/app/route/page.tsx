"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Route as RouteIcon,
  SkipForward,
  Check,
  RotateCcw,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { GameShell, ScoreBadge } from "@/components/GameShell";
import BergenMap from "@/components/MapClient";
import { AreaPicker } from "@/components/AreaPicker";
import { StylePicker } from "@/components/MapOptions";
import { loadBergen } from "@/lib/data";
import { haversine, normaliseName } from "@/lib/geo";
import { DEFAULT_AREA, poiInArea, type Area } from "@/lib/areas";
import type { MapStyle } from "@/components/Map";
import type { BergenData, LatLng, Poi } from "@/lib/types";

type Phase = "guessing" | "loading" | "revealed";

interface RouteResult {
  geometry: LatLng[];
  streets: string[]; // unique street names in driving order
  distanceM: number;
  durationS: number;
}

async function fetchRoute(a: LatLng, b: LatLng): Promise<RouteResult> {
  // OSRM public demo. Free, no auth, CORS-enabled. Order is lon,lat.
  const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson&steps=true&annotations=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const json = await res.json();
  if (!json.routes?.length) throw new Error("no route");
  const route = json.routes[0];
  const geometry: LatLng[] = route.geometry.coordinates.map(
    ([lon, lat]: [number, number]) => [lat, lon] as LatLng,
  );
  const namesInOrder: string[] = [];
  for (const leg of route.legs ?? []) {
    for (const step of leg.steps ?? []) {
      const n = (step.name as string | undefined)?.trim();
      if (!n) continue;
      if (namesInOrder[namesInOrder.length - 1] !== n) namesInOrder.push(n);
    }
  }
  return {
    geometry,
    streets: namesInOrder,
    distanceM: route.distance,
    durationS: route.duration,
  };
}

function pickEndpoints(pois: Poi[]): [Poi, Poi] | null {
  if (pois.length < 2) return null;
  for (let i = 0; i < 80; i++) {
    const a = pois[Math.floor(Math.random() * pois.length)];
    const b = pois[Math.floor(Math.random() * pois.length)];
    if (a === b) continue;
    const d = haversine([a.lat, a.lon], [b.lat, b.lon]);
    if (d > 300 && d < 2500) return [a, b];
  }
  return [pois[0], pois[1]];
}

export default function RoutePage() {
  const [data, setData] = useState<BergenData | null>(null);
  const [area, setArea] = useState<Area>(DEFAULT_AREA);
  const [mapStyle, setMapStyle] = useState<MapStyle>("light");
  const [endpoints, setEndpoints] = useState<[Poi, Poi] | null>(null);
  const [streetsInput, setStreetsInput] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("guessing");
  const [routeRes, setRouteRes] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [scoredRounds, setScoredRounds] = useState(0);
  const [totalPctSum, setTotalPctSum] = useState(0); // sum of per-round pct (0..1)
  const [totalMatched, setTotalMatched] = useState(0);
  const [totalRouteKm, setTotalRouteKm] = useState(0);
  const [lastBreakdown, setLastBreakdown] = useState<{
    matched: string[];
    missed: string[];
    extras: string[];
    pct: number;
    points: number;
  } | null>(null);

  const allNames = useMemo(
    () => (data?.streets ?? []).map((s) => s.name),
    [data],
  );

  const suggestions = useMemo(() => {
    if (!streetsInput.trim() || phase !== "guessing") return [];
    const q = normaliseName(streetsInput);
    if (q.length < 2) return [];
    return allNames
      .filter((n) => normaliseName(n).includes(q) && !chips.includes(n))
      .slice(0, 6);
  }, [streetsInput, allNames, chips, phase]);

  const areaPois = useMemo(() => {
    if (!data) return [] as Poi[];
    return data.pois.filter((p) => poiInArea(p, area));
  }, [data, area]);

  const nextRound = useCallback(() => {
    if (!data) return;
    const pool = areaPois.length >= 2 ? areaPois : data.pois;
    const ends = pickEndpoints(pool);
    setEndpoints(ends);
    setStreetsInput("");
    setChips([]);
    setRouteRes(null);
    setError(null);
    setLastBreakdown(null);
    setPhase("guessing");
  }, [data, areaPois]);

  useEffect(() => {
    loadBergen().then(setData);
  }, []);

  useEffect(() => {
    if (data) nextRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, area]);

  const addChip = (name?: string) => {
    const v = (name ?? streetsInput).trim();
    if (!v) return;
    if (!chips.includes(v)) setChips([...chips, v]);
    setStreetsInput("");
  };

  const removeChip = (i: number) => {
    setChips(chips.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    if (!endpoints || chips.length === 0) return;
    setPhase("loading");
    setError(null);
    try {
      const [a, b] = endpoints;
      const r = await fetchRoute([a.lat, a.lon], [b.lat, b.lon]);
      setRouteRes(r);
      // score: % of route streets that the player listed
      const routeNorm = r.streets.map(normaliseName);
      const chipNorm = chips.map(normaliseName);
      const matched: string[] = [];
      const missed: string[] = [];
      for (const [i, n] of r.streets.entries()) {
        if (chipNorm.includes(routeNorm[i])) matched.push(n);
        else missed.push(n);
      }
      const extras = chips.filter((c) => !routeNorm.includes(normaliseName(c)));
      const pct = r.streets.length === 0 ? 0 : matched.length / r.streets.length;
      const penalty = Math.min(extras.length * 0.05, 0.3);
      const points = Math.max(0, Math.round((pct - penalty) * 100));
      setLastBreakdown({ matched, missed, extras, pct, points });
      setScore((s) => s + points);
      setRounds((r) => r + 1);
      setScoredRounds((n) => n + 1);
      setTotalPctSum((p) => p + pct);
      setTotalMatched((m) => m + matched.length);
      setTotalRouteKm((k) => k + r.distanceM / 1000);
      setPhase("revealed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "route failed");
      setPhase("guessing");
    }
  };

  const reset = () => {
    setScore(0);
    setRounds(0);
    setScoredRounds(0);
    setTotalPctSum(0);
    setTotalMatched(0);
    setTotalRouteKm(0);
    nextRound();
  };

  const kpis = [
    {
      label: "accuracy",
      value:
        scoredRounds > 0
          ? `${Math.round((totalPctSum / scoredRounds) * 100)}%`
          : "—",
    },
    { label: "matched", value: String(totalMatched) },
    {
      label: "route km",
      value: scoredRounds > 0 ? totalRouteKm.toFixed(1) : "—",
    },
  ];

  // Extra markers for endpoints + dashed real route via hint
  const extraMarkers = useMemo(() => {
    if (!endpoints) return [];
    return [
      { latlng: [endpoints[0].lat, endpoints[0].lon] as LatLng, label: endpoints[0].name },
      { latlng: [endpoints[1].lat, endpoints[1].lon] as LatLng, label: endpoints[1].name },
    ];
  }, [endpoints]);

  // We hand the OSRM polyline to the map as a fake "highlighted" street so
  // it renders without leaking into other modes.
  const routeAsStreet = useMemo(() => {
    if (!routeRes) return null;
    return {
      name: "Route",
      highway: "route",
      oneway: false,
      segments: [{ id: -1, coords: routeRes.geometry }],
      center: routeRes.geometry[Math.floor(routeRes.geometry.length / 2)],
    };
  }, [routeRes]);

  return (
    <GameShell
      title="Plan the route"
      subtitle="From A to B. List the streets you'd drive — in any order works, order is a bonus."
      status={<ScoreBadge score={score} rounds={rounds} extras={kpis} />}
      loading={!data}
      side={
        <>
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
              <RouteIcon size={12} />
              From → To
            </div>
            <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
              <div className="text-xs text-slate-400 mt-1">A</div>
              <div className="text-base font-medium text-ink leading-tight">
                {endpoints?.[0].name ?? "…"}
                {endpoints && (
                  <div className="text-xs text-slate-400 capitalize">
                    {endpoints[0].kind.replace(/_/g, " ")}
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1">B</div>
              <div className="text-base font-medium text-ink leading-tight">
                {endpoints?.[1].name ?? "…"}
                {endpoints && (
                  <div className="text-xs text-slate-400 capitalize">
                    {endpoints[1].kind.replace(/_/g, " ")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {phase !== "revealed" && (
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1.5">
                Your route
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {chips.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-bergen-50 text-bergen-700 text-xs rounded-full border border-bergen-100"
                  >
                    {c}
                    <button
                      onClick={() => removeChip(i)}
                      className="rounded-full hover:bg-bergen-100 p-0.5"
                      aria-label="remove"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {chips.length === 0 && (
                  <span className="text-xs text-slate-400">Add streets one by one ↓</span>
                )}
              </div>
              <div className="relative">
                <input
                  value={streetsInput}
                  onChange={(e) => setStreetsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addChip();
                    }
                  }}
                  placeholder="Type a street and press Enter"
                  className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-md text-ink placeholder:text-slate-400 focus:outline-none focus:border-bergen-500 focus:bg-white text-sm"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => addChip()}
                  className="absolute right-1 top-1.5 grid place-items-center w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100"
                  aria-label="add"
                >
                  <Plus size={14} />
                </button>
                {suggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-soft overflow-hidden z-10">
                    {suggestions.map((n) => (
                      <li key={n}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addChip(n);
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
          )}

          {phase === "revealed" && lastBreakdown && routeRes && (
            <div className="rounded-md border border-slate-200 bg-bergen-50/40 p-3 space-y-2 max-h-72 overflow-auto">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-semibold tracking-tight text-ink">
                  +{lastBreakdown.points} pts
                </div>
                <div className="text-xs text-slate-500">
                  {(routeRes.distanceM / 1000).toFixed(2)} km ·{" "}
                  {Math.round(routeRes.durationS / 60)} min
                </div>
              </div>
              <Breakdown
                label="Matched"
                items={lastBreakdown.matched}
                tone="emerald"
              />
              <Breakdown
                label="Missed"
                items={lastBreakdown.missed}
                tone="amber"
              />
              {lastBreakdown.extras.length > 0 && (
                <Breakdown
                  label="Extras"
                  items={lastBreakdown.extras}
                  tone="slate"
                />
              )}
            </div>
          )}

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-md">
              Couldn&apos;t fetch the route: {error}
            </div>
          )}

          <div className="mt-auto flex gap-2">
            {phase !== "revealed" ? (
              <button
                onClick={submit}
                disabled={chips.length === 0 || phase === "loading"}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-ink text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-bergen-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {phase === "loading" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Routing…
                  </>
                ) : (
                  <>
                    <Check size={16} /> Check route
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextRound}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-ink text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-bergen-700 transition-colors"
              >
                Next route
              </button>
            )}
            <button
              onClick={nextRound}
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
      settings={
        <>
          <AreaPicker area={area} onChange={setArea} />
          <StylePicker value={mapStyle} onChange={setMapStyle} />
        </>
      }
      map={
        <BergenMap
          highlighted={routeAsStreet}
          extraMarkers={extraMarkers}
          fitTarget={routeAsStreet}
          area={area}
          mapStyle={mapStyle}
        />
      }
    />
  );
}

function Breakdown({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "emerald" | "amber" | "slate";
}) {
  if (!items.length) return null;
  const colour =
    tone === "emerald"
      ? "text-emerald-700 bg-emerald-50 border-emerald-100"
      : tone === "amber"
        ? "text-amber-700 bg-amber-50 border-amber-100"
        : "text-slate-600 bg-slate-50 border-slate-200";
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((n) => (
          <span
            key={n}
            className={`inline-block text-xs px-2 py-0.5 rounded-full border ${colour}`}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
