import { XMLParser } from 'fast-xml-parser';

export interface GpxPoint {
  lat: number;
  lon: number;
  ele: number | null;
  time: Date | null;
}

export interface GpxTrack {
  points: GpxPoint[];
  name: string | null;
}

export interface GpxData {
  tracks: GpxTrack[];
  allPoints: GpxPoint[]; // flattened across all tracks/segments
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name: string) =>
    ['trkpt', 'trkseg', 'trk', 'wpt', 'rte', 'rtept'].includes(name),
  parseAttributeValue: true,
  parseTagValue: true,
});

function parseTrkpt(pt: any): GpxPoint {
  const lat = typeof pt['@_lat'] === 'number' ? pt['@_lat'] : parseFloat(pt['@_lat']);
  const lon = typeof pt['@_lon'] === 'number' ? pt['@_lon'] : parseFloat(pt['@_lon']);
  const ele = pt.ele != null ? parseFloat(String(pt.ele)) : null;
  const time = pt.time ? new Date(String(pt.time)) : null;
  return { lat, lon, ele, time };
}

export function parseGpx(xml: string): GpxData {
  const doc = parser.parse(xml);
  const gpx = doc?.gpx;
  if (!gpx) throw new Error('Invalid GPX: missing <gpx> root element');

  const trkArray: any[] = Array.isArray(gpx.trk) ? gpx.trk : gpx.trk ? [gpx.trk] : [];

  const tracks: GpxTrack[] = trkArray.map((trk: any) => {
    const name: string | null = trk.name ? String(trk.name) : null;
    const segments: any[] = Array.isArray(trk.trkseg)
      ? trk.trkseg
      : trk.trkseg
      ? [trk.trkseg]
      : [];

    const points: GpxPoint[] = [];
    for (const seg of segments) {
      const trkpts: any[] = Array.isArray(seg.trkpt)
        ? seg.trkpt
        : seg.trkpt
        ? [seg.trkpt]
        : [];
      for (const pt of trkpts) {
        points.push(parseTrkpt(pt));
      }
    }

    return { name, points };
  });

  const allPoints = tracks.flatMap((t) => t.points);
  return { tracks, allPoints };
}
