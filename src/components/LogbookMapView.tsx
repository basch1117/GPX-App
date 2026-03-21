import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { SwisstopoMap } from './SwisstopoMap';
import { parseGpx } from '../gpx/parser';
import { gpxToLatLng, LatLng } from '../gpx/stats';
import { activityIcon } from '../utils/format';
import { LogEntryWithParsed } from '../db/types';

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

export function LogbookMapView({ entries, onEntryPress }: LogbookMapViewProps) {
  const tracks = parseTracksFromEntries(entries);
  const coordSets = tracks.map((t) => t.coords);

  return (
    <SwisstopoMap
      tracks={coordSets}
      onTrackPress={(index) => onEntryPress(tracks[index].id)}
      style={StyleSheet.absoluteFill}
    >
      {tracks.map((t) => {
        if (t.coords.length === 0) return null;
        return (
          <Marker
            key={t.id}
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
    </SwisstopoMap>
  );
}

const styles = StyleSheet.create({
  markerBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  markerIcon: {
    fontSize: 16,
  },
});
