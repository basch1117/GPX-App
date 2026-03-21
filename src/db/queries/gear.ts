import { SQLiteDatabase } from 'expo-sqlite';
import { Category, GearItem } from '../types';

// ── Categories ────────────────────────────────────────────────────────────────

export async function getAllCategories(db: SQLiteDatabase): Promise<Category[]> {
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
}

export async function createCategory(db: SQLiteDatabase, name: string): Promise<number> {
  const maxRow = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(sort_order) AS max_order FROM categories'
  );
  const nextOrder = (maxRow?.max_order ?? -1) + 1;
  const result = await db.runAsync(
    'INSERT INTO categories (name, sort_order, is_default) VALUES (?, ?, 0)',
    [name, nextOrder]
  );
  return result.lastInsertRowId;
}

export async function renameCategory(
  db: SQLiteDatabase,
  id: number,
  name: string
): Promise<void> {
  await db.runAsync('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
}

export async function deleteCategory(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

// ── Items ─────────────────────────────────────────────────────────────────────

export async function getItemsByCategory(
  db: SQLiteDatabase,
  categoryId: number
): Promise<GearItem[]> {
  return db.getAllAsync<GearItem>(
    'SELECT * FROM items WHERE category_id = ? ORDER BY sort_order ASC, id ASC',
    [categoryId]
  );
}

export async function getAllItems(db: SQLiteDatabase): Promise<GearItem[]> {
  return db.getAllAsync<GearItem>('SELECT * FROM items ORDER BY category_id ASC, sort_order ASC, id ASC');
}

export async function createItem(
  db: SQLiteDatabase,
  categoryId: number,
  name: string
): Promise<number> {
  const maxRow = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(sort_order) AS max_order FROM items WHERE category_id = ?',
    [categoryId]
  );
  const nextOrder = (maxRow?.max_order ?? -1) + 1;
  const result = await db.runAsync(
    'INSERT INTO items (category_id, name, sort_order, is_default) VALUES (?, ?, ?, 0)',
    [categoryId, name, nextOrder]
  );
  return result.lastInsertRowId;
}

export async function renameItem(db: SQLiteDatabase, id: number, name: string): Promise<void> {
  await db.runAsync('UPDATE items SET name = ? WHERE id = ?', [name, id]);
}

export async function deleteItem(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
}
