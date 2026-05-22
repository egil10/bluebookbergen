export type LatLng = [number, number];

export interface StreetSegment {
  id: number;
  coords: LatLng[];
}

export interface Street {
  name: string;
  highway: string;
  oneway: boolean;
  segments: StreetSegment[];
  center: LatLng;
  bydel?: string; // attached from the kommune gatetab at load time
}

export interface GatetabEntry {
  name: string;
  code: string | null;
  bydel: string | null;
  postnr: string | null;
}

export interface Gatetab {
  source: string;
  parsedAt: string;
  count: number;
  entries: GatetabEntry[];
}

export interface Poi {
  id: number;
  name: string;
  kind: string;
  lat: number;
  lon: number;
}

export interface BergenData {
  bbox: [number, number, number, number];
  fetchedAt: string;
  streets: Street[];
  pois: Poi[];
}
