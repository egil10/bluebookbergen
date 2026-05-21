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
