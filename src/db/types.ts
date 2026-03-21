export type ActivityType = 'Hike' | 'Trailrun' | 'Skitour' | 'Bike';

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
  created_at: string;
}

export interface LogEntryWithParsed extends Omit<LogEntry, 'photos' | 'gear_selections'> {
  photos: string[];
  gear_selections: Record<string, boolean>;
}
