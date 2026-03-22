import { ActivityType, WindLevel, SkyCondition, OutfitComfort } from '../db/types';

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-CH', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Swiss display format: DD.MM.YYYY */
export function formatDateSwiss(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

/** Convert a JS Date to ISO YYYY-MM-DD (local time, no UTC shift) */
export function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Convert an ISO YYYY-MM-DD string to a JS Date in local time */
export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDistance(km: number | null): string {
  if (km == null) return '—';
  return `${km.toFixed(1)} km`;
}

export function formatDuration(minutes: number | null): string {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function formatElevation(meters: number | null): string {
  if (meters == null) return '—';
  return `${Math.round(meters)} m`;
}

export function activityLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    Hike: 'Hike',
    Trailrun: 'Trail Run',
    Skitour: 'Ski Tour',
    Bike: 'Bike',
  };
  return labels[type] ?? type;
}

export function activityIcon(type: ActivityType): string {
  const icons: Record<ActivityType, string> = {
    Hike: '🥾',
    Trailrun: '🏃',
    Skitour: '⛷️',
    Bike: '🚴',
  };
  return icons[type] ?? '📍';
}

export function formatTemperature(c: number | null): string {
  if (c == null) return '—';
  return `${c} °C`;
}

export function windLabel(w: WindLevel | null): string {
  if (w == null) return '—';
  const labels: Record<WindLevel, string> = {
    none: 'None', low: 'Low', medium: 'Medium', high: 'High',
  };
  return labels[w];
}

export function skyLabel(s: SkyCondition | null): string {
  if (s == null) return '—';
  const labels: Record<SkyCondition, string> = {
    snow: 'Snow', cloudy: 'Cloudy', partly_sunny: 'Partly Sunny', sunny: 'Sunny',
  };
  return labels[s];
}

export function outfitComfortLabel(c: OutfitComfort | null): string {
  if (c == null) return '—';
  const labels: Record<OutfitComfort, string> = {
    too_cold: 'Too Cold',
    good:     'Good',
    too_hot:  'Too Hot',
  };
  return labels[c];
}

export function outfitComfortIcon(c: OutfitComfort | null): string {
  if (c == null) return '';
  const icons: Record<OutfitComfort, string> = {
    too_cold: '🥶',
    good:     '👌',
    too_hot:  '🥵',
  };
  return icons[c];
}

export function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
