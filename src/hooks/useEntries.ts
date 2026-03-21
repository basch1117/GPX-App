import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getAllEntries, getEntryById, deleteEntry } from '../db/queries/entries';
import { LogEntryWithParsed } from '../db/types';

export function useEntries() {
  const db = useSQLiteContext();
  const [entries, setEntries] = useState<LogEntryWithParsed[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllEntries(db);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, loading, reload: load };
}

export function useEntry(id: number) {
  const db = useSQLiteContext();
  const [entry, setEntry] = useState<LogEntryWithParsed | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEntryById(db, id);
      setEntry(data);
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = useCallback(async () => {
    await deleteEntry(db, id);
  }, [db, id]);

  return { entry, loading, remove };
}
