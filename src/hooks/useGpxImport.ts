import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { parseGpx, GpxData } from '../gpx/parser';
import { computeStats, gpxToLatLng, GpxStats, LatLng } from '../gpx/stats';

export interface GpxImportResult {
  raw: string;
  data: GpxData;
  stats: GpxStats;
  coords: LatLng[];
  fileName: string;
}

export function useGpxImport() {
  const [result, setResult] = useState<GpxImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickGpx = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (picked.canceled || picked.assets.length === 0) {
        setLoading(false);
        return;
      }

      const asset = picked.assets[0];
      const uri = asset.uri;
      const fileName = asset.name ?? 'track.gpx';

      let xml: string;
      try {
        xml = await new File(uri).text();
      } catch {
        throw new Error('Could not read the selected file. Please try again.');
      }

      const data = parseGpx(xml);
      if (data.allPoints.length === 0) {
        throw new Error('No track points found in this GPX file.');
      }

      const stats = computeStats(data);
      const coords = gpxToLatLng(data);

      setResult({ raw: xml, data, stats, coords, fileName });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to import GPX file.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const setFromRaw = useCallback((xml: string, fileName = 'track.gpx') => {
    try {
      const data = parseGpx(xml);
      if (data.allPoints.length === 0) return;
      const stats = computeStats(data);
      const coords = gpxToLatLng(data);
      setResult({ raw: xml, data, stats, coords, fileName });
    } catch {
      // ignore — leave existing state
    }
  }, []);

  return { result, error, loading, pickGpx, clear, setFromRaw };
}
