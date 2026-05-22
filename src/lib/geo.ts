import type { LatLng, Street } from "./types";

const R = 6371000; // Earth radius in metres

export function haversine(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Distance from point P to segment AB (in metres).
export function pointToSegmentMetres(p: LatLng, a: LatLng, b: LatLng): number {
  // Project on a local tangent plane around `a`.
  const lat0 = (a[0] * Math.PI) / 180;
  const mPerDegLat = 111_320;
  const mPerDegLon = 111_320 * Math.cos(lat0);

  const ax = 0, ay = 0;
  const bx = (b[1] - a[1]) * mPerDegLon;
  const by = (b[0] - a[0]) * mPerDegLat;
  const px = (p[1] - a[1]) * mPerDegLon;
  const py = (p[0] - a[0]) * mPerDegLat;

  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function distanceToStreet(p: LatLng, street: Street): number {
  let best = Infinity;
  for (const seg of street.segments) {
    for (let i = 0; i < seg.coords.length - 1; i++) {
      const d = pointToSegmentMetres(p, seg.coords[i], seg.coords[i + 1]);
      if (d < best) best = d;
    }
  }
  return best;
}

// Normalise a Norwegian street name for fuzzy comparison.
export function normaliseName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/['’`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 0..1 similarity using normalised Levenshtein.
export function similarity(a: string, b: string): number {
  const s = normaliseName(a);
  const t = normaliseName(b);
  if (s === t) return 1;
  if (!s || !t) return 0;
  const m = s.length, n = t.length;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (s[i - 1] === t[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return 1 - dp[n] / Math.max(m, n);
}

// Pretty metre formatting.
export function fmtMetres(m: number): string {
  if (m < 1) return "0 m";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

// Score 0..100 from distance — within 25 m is perfect, falls off to 0 by 600 m.
export function distanceScore(m: number): number {
  if (m <= 25) return 100;
  if (m >= 600) return 0;
  return Math.round(100 - ((m - 25) / (600 - 25)) * 100);
}

// Deterministic-ish picker that avoids repeating the previous pick.
export function pickRandom<T>(arr: T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}

// Fisher–Yates shuffle, returning a new array. Used by every game mode to
// produce a deck that plays through without repeats before reshuffling.
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
