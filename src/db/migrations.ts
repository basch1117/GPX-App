import { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_V1 = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_default  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS log_entries (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    title            TEXT    NOT NULL,
    date             TEXT    NOT NULL,
    activity_type    TEXT    NOT NULL DEFAULT 'Hike',
    notes            TEXT,
    photos           TEXT    NOT NULL DEFAULT '[]',
    gear_selections  TEXT    NOT NULL DEFAULT '{}',
    gpx_raw          TEXT,
    distance_km      REAL,
    duration_minutes INTEGER,
    elevation_gain_m REAL,
    elevation_loss_m REAL,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_entries_date ON log_entries(date DESC);
  CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
`;

const DEFAULT_GEAR = [
  {
    name: 'Layers',
    items: ['Base layer', 'Mid layer', 'Hardshell', 'Softshell', 'Down jacket'],
  },
  {
    name: 'Head & Hands',
    items: ['Hat', 'Helmet', 'Gloves', 'Goggles', 'Balaclava'],
  },
  {
    name: 'Safety',
    items: ['Avalanche beacon', 'Probe', 'Shovel', 'Airbag pack'],
  },
  {
    name: 'Footwear',
    items: ['Ski boots', 'Hiking boots', 'Crampons', 'Gaiters'],
  },
];

export async function runMigrations(db: SQLiteDatabase) {
  // Create tables
  await db.execAsync(SCHEMA_V1);

  // Check if already seeded
  const rows = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1'
  );

  // ── v2: add conditions columns ─────────────────────────────────────────────
  const v2Check = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_version WHERE version = 2 LIMIT 1'
  );
  if (v2Check.length === 0 && rows.length > 0) {
    await db.execAsync(`
      ALTER TABLE log_entries ADD COLUMN temperature_c  REAL;
      ALTER TABLE log_entries ADD COLUMN wind           TEXT;
      ALTER TABLE log_entries ADD COLUMN sky            TEXT;
    `);
    await db.runAsync('INSERT INTO schema_version (version) VALUES (2)');
  }

  if (rows.length === 0) {
    // Seed default gear
    for (let ci = 0; ci < DEFAULT_GEAR.length; ci++) {
      const cat = DEFAULT_GEAR[ci];
      const result = await db.runAsync(
        'INSERT INTO categories (name, sort_order, is_default) VALUES (?, ?, 1)',
        [cat.name, ci]
      );
      const categoryId = result.lastInsertRowId;
      for (let ii = 0; ii < cat.items.length; ii++) {
        await db.runAsync(
          'INSERT INTO items (category_id, name, sort_order, is_default) VALUES (?, ?, ?, 1)',
          [categoryId, cat.items[ii], ii]
        );
      }
    }
    await db.runAsync('INSERT INTO schema_version (version) VALUES (1)');
    await db.runAsync('INSERT INTO schema_version (version) VALUES (2)');
  }
}
