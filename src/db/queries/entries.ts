import { SQLiteDatabase } from 'expo-sqlite';
import { LogEntry, LogEntryWithParsed, ActivityType, WindLevel, SkyCondition } from '../types';

export function parseEntry(row: LogEntry): LogEntryWithParsed {
  return {
    ...row,
    photos: JSON.parse(row.photos || '[]'),
    gear_selections: JSON.parse(row.gear_selections || '{}'),
  };
}

export async function getAllEntries(db: SQLiteDatabase): Promise<LogEntryWithParsed[]> {
  const rows = await db.getAllAsync<LogEntry>(
    'SELECT * FROM log_entries ORDER BY date DESC, created_at DESC'
  );
  return rows.map(parseEntry);
}

export async function getEntryById(
  db: SQLiteDatabase,
  id: number
): Promise<LogEntryWithParsed | null> {
  const row = await db.getFirstAsync<LogEntry>('SELECT * FROM log_entries WHERE id = ?', [id]);
  return row ? parseEntry(row) : null;
}

export interface CreateEntryInput {
  title: string;
  date: string;
  activity_type: ActivityType;
  notes?: string;
  photos?: string[];
  gear_selections?: Record<string, boolean>;
  gpx_raw?: string;
  distance_km?: number;
  duration_minutes?: number;
  elevation_gain_m?: number;
  elevation_loss_m?: number;
  temperature_c?: number;
  wind?: WindLevel;
  sky?: SkyCondition;
}

export async function createEntry(
  db: SQLiteDatabase,
  input: CreateEntryInput
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO log_entries
      (title, date, activity_type, notes, photos, gear_selections,
       gpx_raw, distance_km, duration_minutes, elevation_gain_m, elevation_loss_m,
       temperature_c, wind, sky)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.title,
      input.date,
      input.activity_type,
      input.notes ?? null,
      JSON.stringify(input.photos ?? []),
      JSON.stringify(input.gear_selections ?? {}),
      input.gpx_raw ?? null,
      input.distance_km ?? null,
      input.duration_minutes ?? null,
      input.elevation_gain_m ?? null,
      input.elevation_loss_m ?? null,
      input.temperature_c ?? null,
      input.wind ?? null,
      input.sky ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteEntry(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM log_entries WHERE id = ?', [id]);
}
