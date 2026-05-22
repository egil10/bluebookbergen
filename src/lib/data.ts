import { normaliseName } from "./geo";
import type { BergenData, Gatetab, Street } from "./types";

// The dataset is fetched at build time by scripts/fetch-bergen-data.mjs and
// shipped as a static asset. The kommune gatetabell (scripts/parse-gatetab.mjs)
// provides the authoritative bydel for each street. We merge them on first
// load so every Street has `.bydel` where the name matches the register.
let cache: Promise<BergenData> | null = null;
let gatetabCache: Promise<Gatetab> | null = null;

export function loadGatetab(): Promise<Gatetab> {
  if (gatetabCache) return gatetabCache;
  gatetabCache = fetch("/data/bergen-gatetab.json", { cache: "force-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load bergen-gatetab.json: ${r.status}`);
      return r.json() as Promise<Gatetab>;
    });
  return gatetabCache;
}

export function loadBergen(): Promise<BergenData> {
  if (cache) return cache;
  cache = Promise.all([
    fetch("/data/bergen.json", { cache: "force-cache" }).then((r) => {
      if (!r.ok) throw new Error(`Failed to load bergen.json: ${r.status}`);
      return r.json() as Promise<BergenData>;
    }),
    loadGatetab(),
  ]).then(([bergen, gatetab]) => {
    const bydelByName = new Map<string, string>();
    for (const e of gatetab.entries) {
      if (!e.bydel) continue;
      bydelByName.set(normaliseName(e.name), e.bydel);
    }
    for (const s of bergen.streets) {
      const b = bydelByName.get(normaliseName(s.name));
      if (b) s.bydel = b;
    }
    return bergen;
  });
  return cache;
}

export function streetByName(data: BergenData, name: string): Street | undefined {
  return data.streets.find((s) => s.name === name);
}
