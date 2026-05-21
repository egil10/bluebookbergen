import type { BergenData, Street } from "./types";

// The dataset is fetched at build time by scripts/fetch-bergen-data.mjs and
// shipped as a static asset. We load it lazily on the client so the home
// page stays light.
let cache: Promise<BergenData> | null = null;

export function loadBergen(): Promise<BergenData> {
  if (cache) return cache;
  cache = fetch("/data/bergen.json", { cache: "force-cache" }).then((r) => {
    if (!r.ok) throw new Error(`Failed to load bergen.json: ${r.status}`);
    return r.json() as Promise<BergenData>;
  });
  return cache;
}

export function streetByName(data: BergenData, name: string): Street | undefined {
  return data.streets.find((s) => s.name === name);
}
