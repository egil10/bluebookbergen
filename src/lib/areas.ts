import type { LatLng } from "./types";

// Sub-areas of the dataset bbox. Coordinates are [south, west, north, east].
// Tuned by eye against the OSM basemap — small enough to feel local, large
// enough that there are plenty of streets in each.

export interface Area {
  id: string;
  name: string;
  blurb: string;
  bbox: [number, number, number, number];
}

// The full dataset bbox (matches scripts/fetch-bergen-data.mjs).
const FULL: [number, number, number, number] = [60.370, 5.290, 60.410, 5.360];

export const AREAS: Area[] = [
  {
    id: "all",
    name: "All of Sentrum",
    blurb: "The whole fetched bounding box — Bergen Sentrum + surrounds.",
    bbox: FULL,
  },
  {
    id: "kjernen",
    name: "Sentrum kjernen",
    blurb: "The dense core — Torgallmenningen, Bryggen, Vågsbunnen.",
    bbox: [60.390, 5.318, 60.402, 5.336],
  },
  {
    id: "nordnes",
    name: "Nordnes",
    blurb: "The peninsula west of Vågen, out to the aquarium.",
    bbox: [60.392, 5.290, 60.406, 5.319],
  },
  {
    id: "sandviken",
    name: "Sandviken",
    blurb: "North of the harbour, up past Sandvikskirken.",
    bbox: [60.401, 5.318, 60.410, 5.345],
  },
  {
    id: "mohlenpris",
    name: "Møhlenpris",
    blurb: "South-west of Sentrum, around Olav Kyrres gate down to Nygård.",
    bbox: [60.380, 5.308, 60.392, 5.328],
  },
  {
    id: "nygard",
    name: "Nygård & Marken",
    blurb: "South of Lille Lungegårdsvann, around the railway station.",
    bbox: [60.386, 5.324, 60.394, 5.342],
  },
  {
    id: "kalfaret",
    name: "Kalfaret & Årstad",
    blurb: "East and south-east — Kalfaret, Stadsporten, Møllendal.",
    bbox: [60.370, 5.330, 60.390, 5.360],
  },
];

export const DEFAULT_AREA = AREAS[0];

export function findArea(id: string | null | undefined): Area {
  return AREAS.find((a) => a.id === id) ?? DEFAULT_AREA;
}

// True if the point is inside the area's bbox (inclusive).
export function isInArea(p: LatLng, area: Area): boolean {
  const [s, w, n, e] = area.bbox;
  return p[0] >= s && p[0] <= n && p[1] >= w && p[1] <= e;
}

export function areaCenter(area: Area): LatLng {
  const [s, w, n, e] = area.bbox;
  return [(s + n) / 2, (w + e) / 2];
}
