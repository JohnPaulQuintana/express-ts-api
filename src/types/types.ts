export interface Quake {
  id: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
  place: string;
  occurred_at: string;
  source: 'phivolcs' | 'usgs';
}

export interface USGSGeoJSON {
  type: string;
  metadata: any;
  features: Array<{
    id: string;
    properties: {
      mag: number;
      place: string;
      time: number;
    };
    geometry: {
      coordinates: [number, number, number];
    };
  }>;
}
