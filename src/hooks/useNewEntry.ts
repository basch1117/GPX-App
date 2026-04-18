import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { useGpxImport } from './useGpxImport';
import { useLocationSearch } from './useLocationSearch';
import { createEntry, updateEntry, getEntryById } from '../db/queries/entries';
import { persistPhoto } from '../utils/photos';
import { todayIso } from '../utils/format';
import { ActivityType, WindLevel, SkyCondition, OutfitComfort } from '../db/types';

export function useNewEntry(editId?: number) {
  const db = useSQLiteContext();
  const gpx = useGpxImport();
  const locationSearch = useLocationSearch();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayIso);
  const [activityType, setActivityType] = useState<ActivityType>('Hike');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [gearSelections, setGearSelections] = useState<Record<string, boolean>>({});
  const [temperatureInput, setTemperatureInput] = useState('');
  const [wind, setWind] = useState<WindLevel | null>(null);
  const [sky, setSky] = useState<SkyCondition | null>(null);
  const [outfitComfort, setOutfitComfort] = useState<OutfitComfort | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);

  // Load existing entry when editing
  useEffect(() => {
    if (editId == null) return;
    let cancelled = false;
    (async () => {
      try {
        const entry = await getEntryById(db, editId);
        if (cancelled || !entry) return;
        setTitle(entry.title);
        setDate(entry.date);
        setActivityType(entry.activity_type);
        setNotes(entry.notes ?? '');
        setPhotos(entry.photos);
        setGearSelections(entry.gear_selections);
        setTemperatureInput(entry.temperature_c != null ? String(entry.temperature_c) : '');
        setWind(entry.wind);
        setSky(entry.sky);
        setOutfitComfort(entry.outfit_comfort);
        if (entry.location_name && entry.location_lat != null && entry.location_lng != null) {
          locationSearch.select({
            name: entry.location_name,
            lat: entry.location_lat,
            lng: entry.location_lng,
          });
        }
        if (entry.gpx_raw) {
          gpx.setFromRaw(entry.gpx_raw);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, editId]);

  const toggleGear = useCallback((itemId: number) => {
    setGearSelections((prev) => ({
      ...prev,
      [String(itemId)]: !prev[String(itemId)],
    }));
  }, []);

  const addPhoto = useCallback(async () => {
    if (photos.length >= 3) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library in Settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      try {
        const persistedUri = await persistPhoto(result.assets[0].uri);
        setPhotos((prev) => [...prev, persistedUri]);
      } catch {
        Alert.alert('Error', 'Failed to save photo. Please try again.');
      }
    }
  }, [photos.length]);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetForm = useCallback(() => {
    setTitle('');
    setDate(todayIso());
    setActivityType('Hike');
    setNotes('');
    setPhotos([]);
    setGearSelections({});
    setTemperatureInput('');
    setWind(null);
    setSky(null);
    setOutfitComfort(null);
    gpx.clear();
    locationSearch.clear();
  }, [gpx]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for this entry.');
      return;
    }

    setSaving(true);
    try {
      const input = {
        title: title.trim(),
        date,
        activity_type: activityType,
        notes: notes.trim() || undefined,
        photos,
        gear_selections: gearSelections,
        gpx_raw: gpx.result?.raw,
        distance_km: gpx.result?.stats.distance_km,
        duration_minutes: gpx.result?.stats.duration_minutes ?? undefined,
        elevation_gain_m: gpx.result?.stats.elevation_gain_m,
        elevation_loss_m: gpx.result?.stats.elevation_loss_m,
        temperature_c: temperatureInput.trim() ? parseFloat(temperatureInput) : undefined,
        wind: wind ?? undefined,
        sky: sky ?? undefined,
        outfit_comfort: outfitComfort ?? undefined,
        location_name: locationSearch.selected?.name ?? undefined,
        location_lat: locationSearch.selected?.lat ?? undefined,
        location_lng: locationSearch.selected?.lng ?? undefined,
      };

      if (editId != null) {
        await updateEntry(db, editId, input);
        router.back();
      } else {
        await createEntry(db, input);
        resetForm();
        router.replace('/(tabs)/logbook');
      }
    } catch {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [db, editId, title, date, activityType, notes, photos, gearSelections, gpx.result, temperatureInput, wind, sky, outfitComfort, locationSearch.selected, resetForm]);

  return {
    // GPX import
    gpx,
    // Form state
    title,
    setTitle,
    date,
    setDate,
    activityType,
    setActivityType,
    notes,
    setNotes,
    photos,
    gearSelections,
    saving,
    loading,
    isEdit: editId != null,
    // Handlers
    toggleGear,
    addPhoto,
    removePhoto,
    handleSave,
    // Conditions
    temperatureInput,
    setTemperatureInput,
    wind,
    setWind,
    sky,
    setSky,
    outfitComfort,
    setOutfitComfort,
    // Location search
    locationSearch,
  };
}
