import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Polyline } from 'react-native-maps';
import { SwisstopoMap } from './SwisstopoMap';
import { parseGpx } from '../gpx/parser';
import { gpxToLatLng, LatLng } from '../gpx/stats';
import { activityIcon } from '../utils/format';
import { LogEntryWithParsed } from '../db/types';
import { ActivityType } from '../db/types';

// --- Per-activity colour palette ---
const ACTIVITY_COLORS: Record<ActivityType, string> = {
  Hike:     '#2D6A4F',
  Trailrun: '#E63946',
  Skitour:  '#1565C0',
  Bike:     '#F57C00',
};

interface LogbookMapViewProps {
  entries: LogEntryWithParsed[];
  onEntryPress: (id: number) => void;
}

interface TrackEntry {
  id: number;
  coords: LatLng[];
  entry: LogEntryWithParsed;
}

function parseTracksFromEntries(entries: LogEntryWithParsed[]): TrackEntry[] {
  return entries
    .filter((e) => !!e.gpx_raw)
    .map((e) => {
      try {
        const data = parseGpx(e.gpx_raw!);
        return { id: e.id, coords: gpxToLatLng(data), entry: e };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as TrackEntry[];
}

// --- Overlap detection ---
// Rounds a coordinate to a ~100 m grid key
function cellKey(lat: number, lng: number): string {
  return `${Math.round(lat * 1000)}_${Math.round(lng * 1000)}`;
}

interface OverlapSegment {
  trackIndex: number;
  segmentIndex: number;
  coords: LatLng[];
}

function computeOverlapSegments(tracks: TrackEntry[]): OverlapSegment[] {
  // 1. Build grid map: cell -> number of distinct tracks visiting it
  const gridMap = new Map<string, number>();
  for (const track of tracks) {
    const visited = new Set<string>();
    for (const pt of track.coords) {
      const key = cellKey(pt.latitude, pt.longitude);
      if (!visited.has(key)) {
        visited.add(key);
        gridMap.set(key, (gridMap.get(key) ?? 0) + 1);
      }
    }
  }

  // 2. For each track, collect consecutive overlap sub-segments
  const result: OverlapSegment[] = [];
  tracks.forEach((track, ti) => {
    let currentSeg: LatLng[] = [];
    let segIdx = 0;

    const flush = () => {
      if (currentSeg.length >= 2) {
        result.push({ trackIndex: ti, segmentIndex: segIdx++, coords: currentSeg });
      }
      currentSeg = [];
    };

    for (let i = 0; i < track.coords.length; i++) {
      const pt = track.coords[i];
      const key = cellKey(pt.latitude, pt.longitude);
      const count = gridMap.get(key) ?? 1;

      if (count >= 2) {
        // Include previous point as anchor if starting a new segment
        if (currentSeg.length === 0 && i > 0) {
          currentSeg.push(track.coords[i - 1]);
        }
        currentSeg.push(pt);
      } else {
        if (currentSeg.length > 0) {
          // Include this point as closing anchor
          currentSeg.push(pt);
          flush();
        }
      }
    }
    flush();
  });

  return result;
}

export function LogbookMapView({ entries, onEntryPress }: LogbookMapViewProps) {
  const tracks = parseTracksFromEntries(entries);
  const coordSets = tracks.map((t) => t.coords);
  const trackColors = tracks.map((t) => ACTIVITY_COLORS[t.entry.activity_type]);
  const overlapSegments = computeOverlapSegments(tracks);

  // Entries with no GPX but a manually selected geotag
  const geotagged = entries.filter(
    (e) => !e.gpx_raw && e.location_lat != null && e.location_lng != null
  );

  // Default map region: prefer GPX start, fall back to first geotag
  const lastCoord = tracks[0]?.coords[0] ?? null;
  const fallbackCoord =
    geotagged[0]
      ? { latitude: geotagged[0].location_lat!, longitude: geotagged[0].location_lng! }
      : null;
  const regionCoord = lastCoord ?? fallbackCoord;
  const initialRegion = regionCoord
    ? {
        latitude: regionCoord.latitude,
        longitude: regionCoord.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }
    : undefined;

  return (
    <SwisstopoMap
      tracks={coordSets}
      trackColors={trackColors}
      onTrackPress={(index) => onEntryPress(tracks[index].id)}
      style={StyleSheet.absoluteFill}
      {...(initialRegion ? { initialRegion } : {})}
    >
      {/* Overlap highlight overlays */}
      {overlapSegments.map((seg) => (
        <Polyline
          key={`ov-${seg.trackIndex}-${seg.segmentIndex}`}
          coordinates={seg.coords}
          strokeColor="rgba(0,0,0,0.22)"
          strokeWidth={11}
          zIndex={5}
        />
      ))}

      {/* GPX start markers */}
      {tracks.map((t) => {
        if (t.coords.length === 0) return null;
        return (
          <Marker
            key={`gpx-${t.id}`}
            coordinate={t.coords[0]}
            onPress={() => onEntryPress(t.id)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.markerBubble}>
              <Text style={styles.markerIcon}>{activityIcon(t.entry.activity_type)}</Text>
            </View>
          </Marker>
        );
      })}

      {/* Geotag-only markers (no GPX) */}
      {geotagged.map((e) => (
        <Marker
          key={`geo-${e.id}`}
          coordinate={{ latitude: e.location_lat!, longitude: e.location_lng! }}
          onPress={() => onEntryPress(e.id)}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.markerBubble}>
            <Text style={styles.markerIcon}>{activityIcon(e.activity_type)}</Text>
          </View>
        </Marker>
      ))}
    </SwisstopoMap>
  );
}

const styles = StyleSheet.create({
  markerBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  markerIcon: {
    fontSize: 11,
  },
});
