import { GpxPoint, GpxData } from './parser';

// Smooth elevation with a centered moving average to eliminate GPS noise.
// After smoothing, all positive/negative deltas are summed — no per-step
// threshold needed because the average already removes the jitter.
const SMOOTHING_WINDOW = 10;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function smoothElevations(points: GpxPoint[]): (number | null)[] {
  const half = Math.floor(SMOOTHING_WINDOW / 2);
  return points.map((_, i) => {
    const slice = points.slice(Math.max(0, i - half), Math.min(points.length, i + half + 1));
    const valid = slice.map((p) => p.ele).filter((e): e is number => e != null);
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  });
}

function haversineKm(a: GpxPoint, b: GpxPoint): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const c =
    2 *
    Math.asin(
      Math.sqrt(
        sinLat * sinLat +
          Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon
      )
    );
  return R * c;
}

export interface GpxStats {
  distance_km: number;
  duration_minutes: number | null;
  elevation_gain_m: number;
  elevation_loss_m: number;
}

export function computeStats(data: GpxData): GpxStats {
  const points = data.allPoints;
  if (points.length < 2) {
    return { distance_km: 0, duration_minutes: null, elevation_gain_m: 0, elevation_loss_m: 0 };
  }

  let distanceKm = 0;
  let elevationGain = 0;
  let elevationLoss = 0;

  const smoothedEle = smoothElevations(points);

  for (let i = 1; i < points.length; i++) {
    distanceKm += haversineKm(points[i - 1], points[i]);

    const prevEle = smoothedEle[i - 1];
    const currEle = smoothedEle[i];
    if (prevEle != null && currEle != null) {
      const diff = currEle - prevEle;
      if (diff > 0) elevationGain += diff;
      else if (diff < 0) elevationLoss += Math.abs(diff);
    }
  }

  // Duration from timestamps
  let durationMinutes: number | null = null;
  const firstTime = points[0].time;
  const lastTime = points[points.length - 1].time;
  if (firstTime && lastTime) {
    durationMinutes = Math.round((lastTime.getTime() - firstTime.getTime()) / 60000);
  }

  return {
    distance_km: Math.round(distanceKm * 100) / 100,
    duration_minutes: durationMinutes,
    elevation_gain_m: Math.round(elevationGain),
    elevation_loss_m: Math.round(elevationLoss),
  };
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export function gpxToLatLng(data: GpxData): LatLng[] {
  return data.allPoints.map((p) => ({ latitude: p.lat, longitude: p.lon }));
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export function computeBounds(points: LatLng[]): BoundingBox | null {
  if (points.length === 0) return null;
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLon = points[0].longitude;
  let maxLon = points[0].longitude;
  for (const p of points) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLon) minLon = p.longitude;
    if (p.longitude > maxLon) maxLon = p.longitude;
  }
  return { minLat, maxLat, minLon, maxLon };
}
