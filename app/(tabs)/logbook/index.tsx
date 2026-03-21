import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Marker } from 'react-native-maps';
import { useEntries } from '@/src/hooks/useEntries';
import { EntryCard } from '@/src/components/EntryCard';
import { SwisstopoMap } from '@/src/components/SwisstopoMap';
import { parseGpx } from '@/src/gpx/parser';
import { gpxToLatLng, LatLng } from '@/src/gpx/stats';
import { LogEntryWithParsed } from '@/src/db/types';
import { formatDistance, formatElevation, activityIcon } from '@/src/utils/format';

type ViewMode = 'list' | 'map';

export default function LogbookScreen() {
  const { entries, loading, reload } = useEntries();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshing, setRefreshing] = useState(false);

  // Reload when tab is focused
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const navigateToEntry = (id: number) => {
    router.push(`/(tabs)/logbook/${id}`);
  };

  return (
    <View style={styles.container}>
      {/* Toggle Bar */}
      <View style={styles.toggleBar}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons
            name="list"
            size={18}
            color={viewMode === 'list' ? '#FFFFFF' : '#757575'}
          />
          <Text style={[styles.toggleLabel, viewMode === 'list' && styles.toggleLabelActive]}>
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
          onPress={() => setViewMode('map')}
        >
          <Ionicons
            name="map-outline"
            size={18}
            color={viewMode === 'map' ? '#FFFFFF' : '#757575'}
          />
          <Text style={[styles.toggleLabel, viewMode === 'map' && styles.toggleLabelActive]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* List View */}
      <View style={[StyleSheet.absoluteFill, styles.viewContainer, viewMode !== 'list' && styles.hidden]}>
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#2D6A4F" />
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <EntryCard entry={item} onPress={() => navigateToEntry(item.id)} />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2D6A4F" />
            }
            contentContainerStyle={entries.length === 0 ? styles.emptyContainer : styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🗺️</Text>
                <Text style={styles.emptyTitle}>No entries yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "New Entry" to log your first activity.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Map View */}
      <View style={[StyleSheet.absoluteFill, styles.viewContainer, viewMode !== 'map' && styles.hidden]}>
        <MapView
          entries={entries}
          onEntryPress={navigateToEntry}
          active={viewMode === 'map'}
        />
      </View>
    </View>
  );
}

// Separate component to avoid re-parsing when list entries update
interface MapViewComponentProps {
  entries: LogEntryWithParsed[];
  onEntryPress: (id: number) => void;
  active: boolean;
}

function MapView({ entries, onEntryPress, active }: MapViewComponentProps) {
  const tracksWithIds = entries
    .filter((e) => !!e.gpx_raw)
    .map((e) => {
      try {
        const data = parseGpx(e.gpx_raw!);
        return { id: e.id, coords: gpxToLatLng(data), entry: e };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as { id: number; coords: LatLng[]; entry: LogEntryWithParsed }[];

  const tracks = tracksWithIds.map((t) => t.coords);

  return (
    <SwisstopoMap
      tracks={tracks}
      onTrackPress={(index) => onEntryPress(tracksWithIds[index].id)}
      style={StyleSheet.absoluteFill}
    >
      {tracksWithIds.map((t) => {
        if (t.coords.length === 0) return null;
        const start = t.coords[0];
        return (
          <Marker
            key={t.id}
            coordinate={start}
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
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  toggleBar: {
    flexDirection: 'row',
    margin: 12,
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
    padding: 3,
    zIndex: 10,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#2D6A4F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  toggleLabelActive: {
    color: '#FFFFFF',
  },
  viewContainer: {
    top: 62, // below toggle bar (12 margin + 44 height + 6 extra)
  },
  hidden: {
    display: 'none',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
  },
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
