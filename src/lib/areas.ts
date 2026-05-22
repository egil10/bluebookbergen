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

// Approximate bboxes around each bydel for map framing and as a fallback
// when a street has no bydel attached. They overlap a little, which is
// fine — bydel-name matching takes precedence.
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
    blurb: "Sentrum, Nordnes, Sandviken, Skuteviken.",
    bbox: [60.385, 5.285, 60.430, 5.350],
    bydeler: ["BERGENHUS", "BERGENH-ÅSANE", "LAKSV/BERGENH"],
    group: "bydel",
  },
  {
    id: "arstad",
    name: "Årstad",
    blurb: "Møhlenpris, Solheim, Kronstad, Kalfaret.",
    bbox: [60.358, 5.310, 60.395, 5.380],
    bydeler: ["ÅRSTAD"],
    group: "bydel",
  },
  {
    id: "laksevag",
    name: "Laksevåg",
    blurb: "Damsgård, Gravdal, Loddefjord and the rest of the west side.",
    bbox: [60.330, 5.080, 60.395, 5.310],
    bydeler: ["LAKSEVÅG", "LAKSEVÅG m.fl.", "LAKSV/BERGENH"],
    group: "bydel",
  },
  {
    id: "fyllingsdalen",
    name: "Fyllingsdalen",
    blurb: "South-west, in the valley behind Løvstakken.",
    bbox: [60.330, 5.200, 60.380, 5.300],
    bydeler: ["FYLLINGSDALEN"],
    group: "bydel",
  },
  {
    id: "ytrebygda",
    name: "Ytrebygda",
    blurb: "Sandsli, Kokstad, Flesland — south near the airport.",
    bbox: [60.260, 5.180, 60.345, 5.350],
    bydeler: ["YTREBYGDA", "FANA YTREBYGDA"],
    group: "bydel",
  },
  {
    id: "fana",
    name: "Fana",
    blurb: "Nesttun, Paradis, Skjold and the long south.",
    bbox: [60.220, 5.300, 60.345, 5.500],
    bydeler: ["FANA", "FANA YTREBYGDA"],
    group: "bydel",
  },
  {
    id: "arna",
    name: "Arna",
    blurb: "East of Ulriken — Indre and Ytre Arna.",
    bbox: [60.380, 5.430, 60.490, 5.550],
    bydeler: ["ARNA"],
    group: "bydel",
  },
  {
    id: "asane",
    name: "Åsane",
    blurb: "North — Eidsvåg, Tertnes, Salhus, Hordvik.",
    bbox: [60.430, 5.260, 60.560, 5.420],
    bydeler: ["ÅSANE", "BERGENH-ÅSANE"],
    group: "bydel",
  },
  // Sentrum sub-areas inside Bergenhus + Årstad — these don't have a bydel
  // mapping; pure bbox filtering.
  {
    id: "kjernen",
    name: "Sentrum kjernen",
    blurb: "The dense core — Torgallmenningen, Bryggen, Vågsbunnen.",
    bbox: [60.390, 5.318, 60.402, 5.336],
    group: "sentrum",
  },
  {
    id: "nordnes",
    name: "Nordnes",
    blurb: "The peninsula west of Vågen, out to the aquarium.",
    bbox: [60.392, 5.290, 60.406, 5.319],
    group: "sentrum",
  },
  {
    id: "sandviken",
    name: "Sandviken",
    blurb: "North of the harbour, up past Sandvikskirken.",
    bbox: [60.401, 5.318, 60.413, 5.345],
    group: "sentrum",
  },
  {
    id: "mohlenpris",
    name: "Møhlenpris",
    blurb: "South-west of Sentrum, around Olav Kyrres gate down to Nygård.",
    bbox: [60.380, 5.308, 60.392, 5.328],
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
