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
    items: ['Base layer', 'Mid layer', 'Vest', 'Fleece', 'Hardshell', 'Softshell', 'Down jacket'],
  },
  {
    name: 'Head & Hands',
    items: ['Hat', 'Headband', 'Gloves', 'Goggles', 'Balaclava'],
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

  // ── v3: gear overhaul + outfit_comfort column ───────────────────────────────
  const v3Check = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_version WHERE version = 3 LIMIT 1'
  );
  if (v3Check.length === 0 && rows.length > 0) {
    // Add outfit_comfort column
    await db.execAsync('ALTER TABLE log_entries ADD COLUMN outfit_comfort TEXT;');

    // Remove Safety category (CASCADE deletes its items)
    await db.runAsync(
      'DELETE FROM categories WHERE name = ? AND is_default = 1',
      ['Safety']
    );

    // Remove Helmet from Head & Hands
    await db.runAsync(
      `DELETE FROM items WHERE name = ? AND is_default = 1
         AND category_id = (SELECT id FROM categories WHERE name = ? LIMIT 1)`,
      ['Helmet', 'Head & Hands']
    );

    // Add Headband to Head & Hands
    await db.runAsync(
      `INSERT INTO items (category_id, name, sort_order, is_default)
       SELECT id, ?, 5, 1 FROM categories WHERE name = ? LIMIT 1`,
      ['Headband', 'Head & Hands']
    );

    // Add Vest and Fleece to Layers
    await db.runAsync(
      `INSERT INTO items (category_id, name, sort_order, is_default)
       SELECT id, ?, 5, 1 FROM categories WHERE name = ? LIMIT 1`,
      ['Vest', 'Layers']
    );
    await db.runAsync(
      `INSERT INTO items (category_id, name, sort_order, is_default)
       SELECT id, ?, 6, 1 FROM categories WHERE name = ? LIMIT 1`,
      ['Fleece', 'Layers']
    );

    await db.runAsync('INSERT INTO schema_version (version) VALUES (3)');
  }

  // ── v4: manual geotag columns ───────────────────────────────────────────────
  const v4Check = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_version WHERE version = 4 LIMIT 1'
  );
  if (v4Check.length === 0 && rows.length > 0) {
    await db.execAsync(`
      ALTER TABLE log_entries ADD COLUMN location_name TEXT;
      ALTER TABLE log_entries ADD COLUMN location_lat  REAL;
      ALTER TABLE log_entries ADD COLUMN location_lng  REAL;
    `);
    await db.runAsync('INSERT INTO schema_version (version) VALUES (4)');
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
    await db.runAsync('INSERT INTO schema_version (version) VALUES (3)');
    await db.runAsync('INSERT INTO schema_version (version) VALUES (4)');
  }
}
