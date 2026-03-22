export type ActivityType = 'Hike' | 'Trailrun' | 'Skitour' | 'Bike';

export type WindLevel = 'none' | 'low' | 'medium' | 'high';
export type SkyCondition = 'snow' | 'cloudy' | 'partly_sunny' | 'sunny';

export interface Category {
  id: number;
  name: string;
  sort_order: number;
  is_default: number; // 0 | 1
}

export interface GearItem {
  id: number;
  category_id: number;
  name: string;
  sort_order: number;
  is_default: number; // 0 | 1
}

export interface LogEntry {
  id: number;
  title: string;
  date: string; // ISO-8601 "YYYY-MM-DD"
  activity_type: ActivityType;
  notes: string | null;
  photos: string; // JSON array of file:// URIs
  gear_selections: string; // JSON object { [item_id: string]: boolean }
  gpx_raw: string | null;
  distance_km: number | null;
  duration_minutes: number | null;
  elevation_gain_m: number | null;
  elevation_loss_m: number | null;
  temperature_c: number | null;
  wind: WindLevel | null;
  sky: SkyCondition | null;
  created_at: string;
}

export interface LogEntryWithParsed extends Omit<LogEntry, 'photos' | 'gear_selections'> {
  photos: string[];
  gear_selections: Record<string, boolean>;
}
