import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getAllCategories, getAllItems } from '../db/queries/gear';
import { Category, GearItem } from '../db/types';

export function useGearTemplate() {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, itms] = await Promise.all([getAllCategories(db), getAllItems(db)]);
      setCategories(cats);
      setItems(itms);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, items, loading, reload: load };
}
