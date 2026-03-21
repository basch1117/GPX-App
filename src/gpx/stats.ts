import { GpxPoint, GpxData } from './parser';

const ELEVATION_NOISE_THRESHOLD_M = 2;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
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

  for (let i = 1; i < points.length; i++) {
    distanceKm += haversineKm(points[i - 1], points[i]);

    const prevEle = points[i - 1].ele;
    const currEle = points[i].ele;
    if (prevEle != null && currEle != null) {
      const diff = currEle - prevEle;
      if (diff > ELEVATION_NOISE_THRESHOLD_M) {
        elevationGain += diff;
      } else if (diff < -ELEVATION_NOISE_THRESHOLD_M) {
        elevationLoss += Math.abs(diff);
      }
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
