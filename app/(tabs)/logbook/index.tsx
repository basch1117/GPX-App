import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEntries } from '@/src/hooks/useEntries';
import { EntryCard } from '@/src/components/EntryCard';
import { LogbookMapView } from '@/src/components/LogbookMapView';
import { ActivityType } from '@/src/db/types';

type ViewMode = 'list' | 'map';

const ACTIVITY_FILTERS: { type: ActivityType; label: string; icon: string; color: string }[] = [
  { type: 'Hike',     label: 'Hike',      icon: '🥾', color: '#2D6A4F' },
  { type: 'Trailrun', label: 'Trail Run',  icon: '🏃', color: '#C62828' },
  { type: 'Skitour',  label: 'Ski Tour',  icon: '⛷️', color: '#1565C0' },
  { type: 'Bike',     label: 'Bike',      icon: '🚴', color: '#E65100' },
];

export default function LogbookScreen() {
  const { entries, loading, reload } = useEntries();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActivityType | null>(null);

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

  const navigateToEntry = useCallback((id: number) => {
    router.push(`/(tabs)/logbook/${id}`);
  }, []);

  const filteredEntries = activeFilter
    ? entries.filter((e) => e.activity_type === activeFilter)
    : entries;

  return (
    <View style={styles.container}>
      {/* Toggle Bar */}
      <View style={styles.toggleBar}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons name="list" size={18} color={viewMode === 'list' ? '#FFFFFF' : '#757575'} />
          <Text style={[styles.toggleLabel, viewMode === 'list' && styles.toggleLabelActive]}>
            List
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
          onPress={() => setViewMode('map')}
        >
          <Ionicons name="map-outline" size={18} color={viewMode === 'map' ? '#FFFFFF' : '#757575'} />
          <Text style={[styles.toggleLabel, viewMode === 'map' && styles.toggleLabelActive]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Activity Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === null && styles.filterPillActiveAll]}
          onPress={() => setActiveFilter(null)}
        >
          <Text style={[styles.filterPillText, activeFilter === null && styles.filterPillTextActiveAll]}>
            All
          </Text>
        </TouchableOpacity>

        {ACTIVITY_FILTERS.map((f) => {
          const isActive = activeFilter === f.type;
          return (
            <TouchableOpacity
              key={f.type}
              style={[
                styles.filterPill,
                isActive && { backgroundColor: f.color, borderColor: f.color },
              ]}
              onPress={() => setActiveFilter(isActive ? null : f.type)}
            >
              <Text style={styles.filterPillIcon}>{f.icon}</Text>
              <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List View */}
      <View style={[StyleSheet.absoluteFill, styles.viewContainer, viewMode !== 'list' && styles.hidden]}>
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#2D6A4F" />
          </View>
        ) : (
          <FlatList
            data={filteredEntries}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <EntryCard entry={item} onPress={() => navigateToEntry(item.id)} />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2D6A4F" />
            }
            contentContainerStyle={
              filteredEntries.length === 0 ? styles.emptyContainer : styles.listContent
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>{activeFilter ? '🔍' : '🗺️'}</Text>
                <Text style={styles.emptyTitle}>
                  {activeFilter ? 'No matching entries' : 'No entries yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeFilter
                    ? 'Try selecting a different activity filter.'
                    : 'Tap "New Entry" to log your first activity.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Map View */}
      <View style={[StyleSheet.absoluteFill, styles.viewContainer, viewMode !== 'map' && styles.hidden]}>
        <LogbookMapView entries={filteredEntries} onEntryPress={navigateToEntry} />
      </View>
    </View>
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
    marginBottom: 6,
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
  filterBar: {
    flexGrow: 0,
    zIndex: 10,
  },
  filterBarContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  filterPillActiveAll: {
    backgroundColor: '#424242',
    borderColor: '#424242',
  },
  filterPillIcon: {
    fontSize: 13,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextActiveAll: {
    color: '#FFFFFF',
  },
  viewContainer: {
    top: 108,
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
});
