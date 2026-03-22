import { useState, useEffect, useCallback } from 'react';

export interface LocationResult {
  name: string;
  lat: number;
  lng: number;
}

const GEOADMIN_URL =
  'https://api3.geo.admin.ch/rest/services/api/SearchServer';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function useLocationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<LocationResult | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `${GEOADMIN_URL}?searchText=${encodeURIComponent(query)}` +
          `&type=locations&origins=gazetteer&sr=4326&limit=8`;
        const resp = await fetch(url);
        const json = await resp.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: LocationResult[] = (json.results ?? []).map((r: any) => ({
          name: stripHtml(r.attrs.label),
          lat: r.attrs.lat,
          lng: r.attrs.lon,
        }));
        setResults(items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const select = useCallback((loc: LocationResult) => {
    setSelected(loc);
    setQuery('');
    setResults([]);
  }, []);

  const clear = useCallback(() => {
    setSelected(null);
    setQuery('');
    setResults([]);
  }, []);

  return { query, setQuery, results, loading, selected, select, clear };
}
