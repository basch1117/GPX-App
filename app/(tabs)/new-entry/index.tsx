import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useGearTemplate } from '@/src/hooks/useGearTemplate';
import { useGpxImport } from '@/src/hooks/useGpxImport';
import { createEntry } from '@/src/db/queries/entries';
import { GearChecklist } from '@/src/components/GearChecklist';
import { PhotoStrip } from '@/src/components/PhotoStrip';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SwisstopoMap } from '@/src/components/SwisstopoMap';
import { StatsBar } from '@/src/components/StatsBar';
import { persistPhoto } from '@/src/utils/photos';
import { todayIso, formatDistance, formatDuration, formatElevation } from '@/src/utils/format';
import { ActivityType } from '@/src/db/types';

const ACTIVITY_TYPES: ActivityType[] = ['Hike', 'Trailrun', 'Skitour', 'Bike'];
const ACTIVITY_ICONS: Record<ActivityType, string> = {
  Hike: '🥾',
  Trailrun: '🏃',
  Skitour: '⛷️',
  Bike: '🚴',
};

export default function NewEntryScreen() {
  const db = useSQLiteContext();
  const { categories, items } = useGearTemplate();
  const { result: gpxResult, error: gpxError, loading: gpxLoading, pickGpx, clear: clearGpx } = useGpxImport();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayIso());
  const [activityType, setActivityType] = useState<ActivityType>('Hike');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [gearSelections, setGearSelections] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const toggleGear = useCallback((itemId: number) => {
    setGearSelections((prev) => ({
      ...prev,
      [String(itemId)]: !prev[String(itemId)],
    }));
  }, []);

  const addPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library in Settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      try {
        const persistedUri = await persistPhoto(uri);
        setPhotos((prev) => [...prev, persistedUri]);
      } catch {
        Alert.alert('Error', 'Failed to save photo. Please try again.');
      }
    }
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for this entry.');
      return;
    }

    setSaving(true);
    try {
      await createEntry(db, {
        title: title.trim(),
        date,
        activity_type: activityType,
        notes: notes.trim() || undefined,
        photos,
        gear_selections: gearSelections,
        gpx_raw: gpxResult?.raw,
        distance_km: gpxResult?.stats.distance_km,
        duration_minutes: gpxResult?.stats.duration_minutes ?? undefined,
        elevation_gain_m: gpxResult?.stats.elevation_gain_m,
        elevation_loss_m: gpxResult?.stats.elevation_loss_m,
      });

      // Reset form
      setTitle('');
      setDate(todayIso());
      setActivityType('Hike');
      setNotes('');
      setPhotos([]);
      setGearSelections({});
      clearGpx();

      router.replace('/(tabs)/logbook');
    } catch (e) {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [db, title, date, activityType, notes, photos, gearSelections, gpxResult, clearGpx]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* GPX Import */}
        <SectionHeader title="GPS Track" />
        <View style={styles.gpxSection}>
          {gpxResult ? (
            <View style={styles.gpxImported}>
              <View style={styles.gpxMapContainer}>
                <SwisstopoMap
                  tracks={[gpxResult.coords]}
                  fitToTracks
                  style={styles.gpxMap}
                />
              </View>
              <StatsBar
                distanceKm={gpxResult.stats.distance_km}
                durationMinutes={gpxResult.stats.duration_minutes}
                elevationGainM={gpxResult.stats.elevation_gain_m}
                elevationLossM={gpxResult.stats.elevation_loss_m}
              />
              <View style={styles.gpxRow}>
                <Ionicons name="document-text-outline" size={16} color="#2D6A4F" />
                <Text style={styles.gpxFileName} numberOfLines={1}>{gpxResult.fileName}</Text>
                <TouchableOpacity onPress={clearGpx} style={styles.gpxClearBtn}>
                  <Text style={styles.gpxClearText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.gpxEmpty}>
              <TouchableOpacity
                style={styles.gpxPickBtn}
                onPress={pickGpx}
                disabled={gpxLoading}
              >
                {gpxLoading ? (
                  <ActivityIndicator color="#2D6A4F" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={24} color="#2D6A4F" />
                    <Text style={styles.gpxPickLabel}>Import GPX File</Text>
                    <Text style={styles.gpxPickSub}>Track points, distance & elevation auto-parsed</Text>
                  </>
                )}
              </TouchableOpacity>
              {gpxError && <Text style={styles.gpxError}>{gpxError}</Text>}
            </View>
          )}
        </View>

        {/* Title */}
        <SectionHeader title="Title" />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Bernese Oberland traverse"
            placeholderTextColor="#BDBDBD"
            maxLength={120}
          />
        </View>

        {/* Date */}
        <SectionHeader title="Date" />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#BDBDBD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        </View>

        {/* Activity Type */}
        <SectionHeader title="Activity Type" />
        <View style={styles.activityRow}>
          {ACTIVITY_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.activityBtn,
                activityType === type && styles.activityBtnActive,
              ]}
              onPress={() => setActivityType(type)}
            >
              <Text style={styles.activityBtnIcon}>{ACTIVITY_ICONS[type]}</Text>
              <Text
                style={[
                  styles.activityBtnLabel,
                  activityType === type && styles.activityBtnLabelActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Photos */}
        <SectionHeader title={`Photos (${photos.length}/3)`} />
        <PhotoStrip
          photos={photos}
          onAdd={addPhoto}
          onRemove={removePhoto}
          maxPhotos={3}
        />

        {/* Notes */}
        <SectionHeader title="Notes" />
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Conditions, highlights, anything worth remembering..."
            placeholderTextColor="#BDBDBD"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Gear Checklist */}
        <SectionHeader title="Gear" />
        <View style={styles.gearContainer}>
          <GearChecklist
            categories={categories}
            items={items}
            selections={gearSelections}
            onToggle={toggleGear}
          />
        </View>

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
                <Text style={styles.saveBtnLabel}>Save Entry</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  gpxSection: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gpxEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gpxPickBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  gpxPickLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D6A4F',
    marginTop: 4,
  },
  gpxPickSub: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  gpxError: {
    color: '#E63946',
    fontSize: 13,
    padding: 12,
    textAlign: 'center',
  },
  gpxImported: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  gpxMapContainer: {
    height: 180,
  },
  gpxMap: {
    flex: 1,
  },
  gpxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  gpxFileName: {
    flex: 1,
    fontSize: 13,
    color: '#424242',
  },
  gpxClearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gpxClearText: {
    fontSize: 13,
    color: '#E63946',
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  input: {
    padding: 14,
    fontSize: 15,
    color: '#212121',
  },
  notesInput: {
    height: 120,
    paddingTop: 14,
  },
  activityRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  activityBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    paddingVertical: 10,
    gap: 4,
  },
  activityBtnActive: {
    borderColor: '#2D6A4F',
    backgroundColor: '#E8F5E9',
  },
  activityBtnIcon: {
    fontSize: 20,
  },
  activityBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  activityBtnLabelActive: {
    color: '#2D6A4F',
  },
  gearContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  saveBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 48,
  },
});
