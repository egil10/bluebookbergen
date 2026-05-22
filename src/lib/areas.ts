import type { LatLng, Street, Poi } from "./types";

// Areas can match by bydel name (preferred — uses kommune ground truth) or
// by bbox (fallback for streets not in the gatetab register, e.g. minor
// alleys and paths). bbox is also used to frame the map.
export interface Area {
  id: string;
  name: string;
  blurb: string;
  bbox: [number, number, number, number]; // [south, west, north, east]
  bydeler?: string[]; // gatetab bydel labels (uppercase)
  group: "all" | "bydel" | "sentrum"; // for grouping in the picker
}

// Tightened, ground-checked bboxes around each bydel and the Sentrum
// sub-areas. Bydel-name matching takes precedence for streets that exist
// in the kommune register; bbox is the visual frame and the fallback for
// minor streets / paths.
export const AREAS: Area[] = [
  {
    id: "all",
    name: "All of Bergen",
    blurb: "The whole kommune — every bydel from Fana to Åsane.",
    bbox: [60.180, 5.050, 60.560, 5.550],
    group: "all",
  },
  {
    id: "bergenhus",
    name: "Bergenhus",
    blurb: "Sentrum, Nordnes, Sandviken, Skuteviken, Eidsvåg.",
    bbox: [60.385, 5.288, 60.428, 5.348],
    bydeler: ["BERGENHUS", "BERGENH-ÅSANE", "LAKSV/BERGENH"],
    group: "bydel",
  },
  {
    id: "arstad",
    name: "Årstad",
    blurb: "Møhlenpris, Solheim, Kronstad, Kalfaret, Haukeland.",
    bbox: [60.360, 5.310, 60.392, 5.378],
    bydeler: ["ÅRSTAD"],
    group: "bydel",
  },
  {
    id: "laksevag",
    name: "Laksevåg",
    blurb: "Damsgård, Gravdal, Loddefjord, Olsvik, Mathopen.",
    bbox: [60.336, 5.140, 60.405, 5.300],
    bydeler: ["LAKSEVÅG", "LAKSEVÅG m.fl.", "LAKSV/BERGENH"],
    group: "bydel",
  },
  {
    id: "fyllingsdalen",
    name: "Fyllingsdalen",
    blurb: "The valley behind Løvstakken — Spelhaugen up to Storrinden.",
    bbox: [60.340, 5.215, 60.382, 5.298],
    bydeler: ["FYLLINGSDALEN"],
    group: "bydel",
  },
  {
    id: "ytrebygda",
    name: "Ytrebygda",
    blurb: "Sandsli, Kokstad, Flesland, Birkeland — south near the airport.",
    bbox: [60.265, 5.180, 60.348, 5.330],
    bydeler: ["YTREBYGDA", "FANA YTREBYGDA"],
    group: "bydel",
  },
  {
    id: "fana",
    name: "Fana",
    blurb: "Nesttun, Paradis, Skjold, Fana, Krokeide.",
    bbox: [60.215, 5.310, 60.355, 5.495],
    bydeler: ["FANA", "FANA YTREBYGDA"],
    group: "bydel",
  },
  {
    id: "arna",
    name: "Arna",
    blurb: "East of Ulriken — Indre Arna, Ytre Arna, Espeland.",
    bbox: [60.385, 5.420, 60.495, 5.560],
    bydeler: ["ARNA"],
    group: "bydel",
  },
  {
    id: "asane",
    name: "Åsane",
    blurb: "North of Eidsvåg — Tertnes, Nyborg, Salhus, Hordvik.",
    bbox: [60.428, 5.260, 60.560, 5.420],
    bydeler: ["ÅSANE", "BERGENH-ÅSANE"],
    group: "bydel",
  },
  // Sentrum sub-areas — handy zoom-ins inside Bergenhus + Årstad. Pure bbox
  // filtering since they don't map to a bydel.
  {
    id: "kjernen",
    name: "Sentrum kjernen",
    blurb: "The dense core — Torgallmenningen, Bryggen, Vågsbunnen.",
    bbox: [60.391, 5.318, 60.401, 5.336],
    group: "sentrum",
  },
  {
    id: "nordnes",
    name: "Nordnes",
    blurb: "The peninsula west of Vågen, out to the aquarium.",
    bbox: [60.394, 5.288, 60.404, 5.320],
    group: "sentrum",
  },
  {
    id: "sandviken",
    name: "Sandviken",
    blurb: "North of the harbour, up past Sandvikskirken to Skuteviken.",
    bbox: [60.401, 5.318, 60.418, 5.345],
    group: "sentrum",
  },
  {
    id: "mohlenpris",
    name: "Møhlenpris",
    blurb: "South-west of Sentrum, around Olav Kyrres gate and Nygård.",
    bbox: [60.382, 5.310, 60.392, 5.328],
    group: "sentrum",
  },
];

export const DEFAULT_AREA = AREAS[0];

export function findArea(id: string | null | undefined): Area {
  return AREAS.find((a) => a.id === id) ?? DEFAULT_AREA;
}

export function isInBbox(p: LatLng, area: Area): boolean {
  const [s, w, n, e] = area.bbox;
  return p[0] >= s && p[0] <= n && p[1] >= w && p[1] <= e;
}

// Kept as the public name used in earlier callers — same semantics.
export function isInArea(p: LatLng, area: Area): boolean {
  return isInBbox(p, area);
}

// Street belongs to an area if its bydel matches (preferred) or its centre
// is inside the bbox (fallback for streets not in the gatetab).
export function streetInArea(street: Street, area: Area): boolean {
  if (area.id === "all") return true;
  if (area.bydeler && street.bydel) {
    return area.bydeler.includes(street.bydel);
  }
  return isInBbox(street.center, area);
}

// POIs have no bydel attached — always bbox.
export function poiInArea(poi: Poi, area: Area): boolean {
  if (area.id === "all") return true;
  return isInBbox([poi.lat, poi.lon], area);
}

export function areaCenter(area: Area): LatLng {
  const [s, w, n, e] = area.bbox;
  return [(s + n) / 2, (w + e) / 2];
}
