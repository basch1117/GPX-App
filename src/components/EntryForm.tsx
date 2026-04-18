import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useGearTemplate } from '@/src/hooks/useGearTemplate';
import { useNewEntry } from '@/src/hooks/useNewEntry';
import { GearChecklist } from '@/src/components/GearChecklist';
import { PhotoStrip } from '@/src/components/PhotoStrip';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SwisstopoMap } from '@/src/components/SwisstopoMap';
import { StatsBar } from '@/src/components/StatsBar';
import { ActivityType, WindLevel, SkyCondition, OutfitComfort } from '@/src/db/types';
import { formatDateSwiss, isoToDate, dateToIso } from '@/src/utils/format';

const ACTIVITY_TYPES: ActivityType[] = ['Hike', 'Trailrun', 'Skitour', 'Bike'];

const WIND_OPTIONS: { value: WindLevel; label: string }[] = [
  { value: 'none',   label: 'None'   },
  { value: 'low',    label: 'Low'    },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High'   },
];

const SKY_OPTIONS: { value: SkyCondition; label: string; icon: string }[] = [
  { value: 'snow',         label: 'Snow',          icon: '🌨' },
  { value: 'cloudy',       label: 'Cloudy',         icon: '☁️' },
  { value: 'partly_sunny', label: 'Partly Sunny',   icon: '⛅' },
  { value: 'sunny',        label: 'Sunny',          icon: '☀️' },
];
const OUTFIT_OPTIONS: { value: OutfitComfort; label: string; icon: string }[] = [
  { value: 'too_cold', label: 'Too Cold', icon: '🥶' },
  { value: 'good',     label: 'Good',     icon: '👌' },
  { value: 'too_hot',  label: 'Too Hot',  icon: '🥵' },
];

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  Hike: '🥾',
  Trailrun: '🏃',
  Skitour: '⛷️',
  Bike: '🚴',
};

export function EntryForm({ editId }: { editId?: number }) {
  const { categories, items } = useGearTemplate();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const {
    gpx,
    title, setTitle,
    date, setDate,
    activityType, setActivityType,
    notes, setNotes,
    photos,
    gearSelections,
    saving,
    loading,
    isEdit,
    toggleGear,
    addPhoto,
    removePhoto,
    handleSave,
    temperatureInput,
    setTemperatureInput,
    wind,
    setWind,
    sky,
    setSky,
    outfitComfort,
    setOutfitComfort,
    distanceInput,
    setDistanceInput,
    elevationGainInput,
    setElevationGainInput,
    durationHoursInput,
    setDurationHoursInput,
    durationMinutesInput,
    setDurationMinutesInput,
    locationSearch,
  } = useNewEntry(editId);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2D6A4F" />
      </View>
    );
  }

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
          {gpx.result ? (
            <View style={styles.gpxImported}>
              <View style={styles.gpxMapContainer}>
                <SwisstopoMap tracks={[gpx.result.coords]} fitToTracks style={styles.gpxMap} />
              </View>
              <StatsBar
                distanceKm={gpx.result.stats.distance_km}
                durationMinutes={gpx.result.stats.duration_minutes}
                elevationGainM={gpx.result.stats.elevation_gain_m}
                elevationLossM={gpx.result.stats.elevation_loss_m}
              />
              <View style={styles.gpxRow}>
                <Ionicons name="document-text-outline" size={16} color="#2D6A4F" />
                <Text style={styles.gpxFileName} numberOfLines={1}>{gpx.result.fileName}</Text>
                <TouchableOpacity onPress={gpx.clear} style={styles.gpxClearBtn}>
                  <Text style={styles.gpxClearText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.gpxEmpty}>
              <TouchableOpacity style={styles.gpxPickBtn} onPress={gpx.pickGpx} disabled={gpx.loading}>
                {gpx.loading ? (
                  <ActivityIndicator color="#2D6A4F" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={24} color="#2D6A4F" />
                    <Text style={styles.gpxPickLabel}>Import GPX File</Text>
                    <Text style={styles.gpxPickSub}>Track points, distance & elevation auto-parsed</Text>
                  </>
                )}
              </TouchableOpacity>
              {gpx.error && <Text style={styles.gpxError}>{gpx.error}</Text>}
            </View>
          )}
        </View>

        {/* Manual stats — shown only when no GPX is imported */}
        {!gpx.result && (
          <>
            <SectionHeader title="Distance & Elevation" />
            <View style={styles.manualStatsCard}>
              <View style={styles.manualStatsRow}>
                <Text style={styles.conditionLabel}>📏  Distance</Text>
                <View style={styles.tempInputRow}>
                  <TextInput
                    style={styles.tempInput}
                    value={distanceInput}
                    onChangeText={setDistanceInput}
                    placeholder="—"
                    placeholderTextColor="#BDBDBD"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <Text style={styles.tempUnit}>km</Text>
                </View>
              </View>

              <View style={styles.conditionDivider} />

              <View style={styles.manualStatsRow}>
                <Text style={styles.conditionLabel}>⛰  Elevation Gain</Text>
                <View style={styles.tempInputRow}>
                  <TextInput
                    style={styles.tempInput}
                    value={elevationGainInput}
                    onChangeText={setElevationGainInput}
                    placeholder="—"
                    placeholderTextColor="#BDBDBD"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <Text style={styles.tempUnit}>m</Text>
                </View>
              </View>

              <View style={styles.conditionDivider} />

              <View style={styles.manualStatsRow}>
                <Text style={styles.conditionLabel}>⏱  Duration</Text>
                <View style={styles.durationInputRow}>
                  <TextInput
                    style={styles.durationInput}
                    value={durationHoursInput}
                    onChangeText={setDurationHoursInput}
                    placeholder="0"
                    placeholderTextColor="#BDBDBD"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text style={styles.tempUnit}>h</Text>
                  <TextInput
                    style={styles.durationInput}
                    value={durationMinutesInput}
                    onChangeText={setDurationMinutesInput}
                    placeholder="0"
                    placeholderTextColor="#BDBDBD"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.tempUnit}>min</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Location */}
        <SectionHeader title="Location" />
        <View style={styles.locationCard}>
          {locationSearch.selected ? (
            <View style={styles.locationChip}>
              <Ionicons name="location" size={16} color="#2D6A4F" />
              <Text style={styles.locationChipText} numberOfLines={1}>
                {locationSearch.selected.name}
              </Text>
              <TouchableOpacity onPress={locationSearch.clear} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#9E9E9E" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.locationSearchRow}>
              <Ionicons name="search-outline" size={18} color="#9E9E9E" />
              <TextInput
                style={styles.locationInput}
                value={locationSearch.query}
                onChangeText={locationSearch.setQuery}
                placeholder="Search peak, mountain or place…"
                placeholderTextColor="#BDBDBD"
                autoCorrect={false}
                autoCapitalize="words"
              />
              {locationSearch.loading && (
                <ActivityIndicator size="small" color="#2D6A4F" />
              )}
            </View>
          )}

          {locationSearch.results.length > 0 && (
            <View style={styles.locationResults}>
              {locationSearch.results.map((r, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.locationResultItem,
                    i < locationSearch.results.length - 1 && styles.locationResultBorder,
                  ]}
                  onPress={() => locationSearch.select(r)}
                  activeOpacity={0.6}
                >
                  <Ionicons name="location-outline" size={15} color="#9E9E9E" />
                  <Text style={styles.locationResultText} numberOfLines={1}>
                    {r.name}
                  </Text>
                </TouchableOpacity>
              ))}
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
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={18} color="#2D6A4F" />
          <Text style={styles.dateButtonText}>{formatDateSwiss(date)}</Text>
          <Ionicons name="chevron-down" size={16} color="#9E9E9E" />
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            >
              <View style={styles.datePickerCard}>
                <DateTimePicker
                  value={isoToDate(date)}
                  mode="date"
                  display="inline"
                  onChange={(_: DateTimePickerEvent, selected?: Date) => {
                    if (selected) setDate(dateToIso(selected));
                  }}
                  locale="de-CH"
                  themeVariant="light"
                  accentColor="#2D6A4F"
                  maximumDate={new Date()}
                />
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            value={isoToDate(date)}
            mode="date"
            display="calendar"
            onChange={(_: DateTimePickerEvent, selected?: Date) => {
              setShowDatePicker(false);
              if (selected) setDate(dateToIso(selected));
            }}
            maximumDate={new Date()}
          />
        )}

        {/* Activity Type */}
        <SectionHeader title="Activity Type" />
        <View style={styles.activityRow}>
          {ACTIVITY_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.activityBtn, activityType === type && styles.activityBtnActive]}
              onPress={() => setActivityType(type)}
            >
              <Text style={styles.activityBtnIcon}>{ACTIVITY_ICONS[type]}</Text>
              <Text style={[styles.activityBtnLabel, activityType === type && styles.activityBtnLabelActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Photos */}
        <SectionHeader title={`Photos (${photos.length}/3)`} />
        <PhotoStrip photos={photos} onAdd={addPhoto} onRemove={removePhoto} maxPhotos={3} />

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

        {/* Conditions */}
        <SectionHeader title="Conditions" />
        <View style={styles.conditionsCard}>
          <View style={styles.conditionRow}>
            <Text style={styles.conditionLabel}>🌡  Temperature</Text>
            <View style={styles.tempInputRow}>
              <TextInput
                style={styles.tempInput}
                value={temperatureInput}
                onChangeText={setTemperatureInput}
                placeholder="—"
                placeholderTextColor="#BDBDBD"
                keyboardType="numeric"
                maxLength={5}
              />
              <Text style={styles.tempUnit}>°C</Text>
            </View>
          </View>

          <View style={styles.conditionDivider} />

          <View style={styles.conditionBlock}>
            <Text style={styles.conditionLabel}>💨  Wind</Text>
            <View style={styles.pillRow}>
              {WIND_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  style={[styles.pill, wind === o.value && styles.pillActive]}
                  onPress={() => setWind(wind === o.value ? null : o.value)}
                >
                  <Text style={[styles.pillText, wind === o.value && styles.pillTextActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.conditionDivider} />

          <View style={styles.conditionBlock}>
            <Text style={styles.conditionLabel}>☀️  Sky</Text>
            <View style={styles.pillRow}>
              {SKY_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  style={[styles.pill, sky === o.value && styles.pillActive]}
                  onPress={() => setSky(sky === o.value ? null : o.value)}
                >
                  <Text style={[styles.pillText, sky === o.value && styles.pillTextActive]}>
                    {o.icon} {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Gear */}
        <SectionHeader title="Gear" />
        <View style={styles.gearContainer}>
          <GearChecklist
            categories={categories}
            items={items}
            selections={gearSelections}
            onToggle={toggleGear}
          />
        </View>

        {/* Outfit Comfort */}
        <View style={styles.outfitCard}>
          <Text style={styles.outfitLabel}>🧥  How was the outfit?</Text>
          <View style={styles.pillRow}>
            {OUTFIT_OPTIONS.map((o) => (
              <TouchableOpacity
                key={o.value}
                style={[styles.pill, outfitComfort === o.value && styles.pillActive]}
                onPress={() => setOutfitComfort(outfitComfort === o.value ? null : o.value)}
              >
                <Text style={[styles.pillText, outfitComfort === o.value && styles.pillTextActive]}>
                  {o.icon} {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
                <Text style={styles.saveBtnLabel}>{isEdit ? 'Save Changes' : 'Save Entry'}</Text>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  datePickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  doneButton: {
    backgroundColor: '#2D6A4F',
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
  locationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  locationSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationChipText: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
  },
  locationResults: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  locationResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
  },
  locationResultBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationResultText: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
  },
  outfitCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  outfitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
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
  conditionsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  manualStatsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  manualStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  durationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    color: '#212121',
    width: 52,
    textAlign: 'right',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  conditionBlock: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  conditionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
  },
  conditionDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 14,
  },
  tempInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tempInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    color: '#212121',
    width: 72,
    textAlign: 'right',
  },
  tempUnit: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  pillActive: {
    borderColor: '#2D6A4F',
    backgroundColor: '#E8F5E9',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#757575',
  },
  pillTextActive: {
    color: '#2D6A4F',
    fontWeight: '600',
  },
});
