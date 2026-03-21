import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useEntry } from '@/src/hooks/useEntries';
import { useGearTemplate } from '@/src/hooks/useGearTemplate';
import { SwisstopoMap } from '@/src/components/SwisstopoMap';
import { StatsBar } from '@/src/components/StatsBar';
import { GearChecklist } from '@/src/components/GearChecklist';
import { PhotoStrip } from '@/src/components/PhotoStrip';
import { SectionHeader } from '@/src/components/SectionHeader';
import { parseGpx } from '@/src/gpx/parser';
import { gpxToLatLng, LatLng } from '@/src/gpx/stats';
import { formatDate, activityLabel, activityIcon } from '@/src/utils/format';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entryId = Number(id);
  const navigation = useNavigation();

  const { entry, loading, remove } = useEntry(entryId);
  const { categories, items } = useGearTemplate();

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await remove();
            router.back();
          },
        },
      ]
    );
  }, [remove]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleDelete} style={{ marginRight: 8 }}>
          <Ionicons name="trash-outline" size={22} color="#E63946" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleDelete]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2D6A4F" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Entry not found.</Text>
      </View>
    );
  }

  // Parse GPX track
  let coords: LatLng[] = [];
  if (entry.gpx_raw) {
    try {
      const data = parseGpx(entry.gpx_raw);
      coords = gpxToLatLng(data);
    } catch {
      // ignore parse errors
    }
  }

  const hasGpx = coords.length > 0;
  const hasPhotos = entry.photos.length > 0;
  const hasNotes = !!entry.notes?.trim();
  const checkedCount = Object.values(entry.gear_selections).filter(Boolean).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Map */}
      {hasGpx ? (
        <View style={styles.mapContainer}>
          <SwisstopoMap
            tracks={[coords]}
            fitToTracks
            style={styles.map}
          />
        </View>
      ) : (
        <View style={styles.noMapPlaceholder}>
          <Text style={styles.noMapText}>No GPS track attached</Text>
        </View>
      )}

      {/* Stats */}
      <StatsBar
        distanceKm={entry.distance_km}
        durationMinutes={entry.duration_minutes}
        elevationGainM={entry.elevation_gain_m}
        elevationLossM={entry.elevation_loss_m}
      />

      {/* Activity type + date */}
      <View style={styles.metaRow}>
        <View style={styles.activityBadge}>
          <Text style={styles.activityIcon}>{activityIcon(entry.activity_type)}</Text>
          <Text style={styles.activityLabel}>{activityLabel(entry.activity_type)}</Text>
        </View>
        <Text style={styles.date}>{formatDate(entry.date)}</Text>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{entry.title}</Text>
      </View>

      {/* Photos */}
      {hasPhotos && (
        <>
          <SectionHeader title="Photos" />
          <PhotoStrip photos={entry.photos} readonly />
        </>
      )}

      {/* Notes */}
      {hasNotes && (
        <>
          <SectionHeader title="Notes" />
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>{entry.notes}</Text>
          </View>
        </>
      )}

      {/* Gear */}
      {checkedCount > 0 && (
        <>
          <SectionHeader title={`Gear (${checkedCount} items)`} />
          <View style={styles.gearContainer}>
            <GearChecklist
              categories={categories}
              items={items}
              selections={entry.gear_selections}
              readonly
            />
          </View>
        </>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontSize: 16,
    color: '#757575',
  },
  mapContainer: {
    height: 260,
  },
  map: {
    flex: 1,
  },
  noMapPlaceholder: {
    height: 100,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMapText: {
    color: '#9E9E9E',
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  activityIcon: {
    fontSize: 14,
  },
  activityLabel: {
    fontSize: 13,
    color: '#2D6A4F',
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#757575',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
    lineHeight: 30,
  },
  notesContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  notesText: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
  },
  gearContainer: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  bottomPadding: {
    height: 40,
  },
});
