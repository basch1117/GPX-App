import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LogEntryWithParsed } from '../db/types';
import { ActivityType } from '../db/types';
import {
  formatDateSwiss,
  formatDistance,
  formatElevation,
  activityLabel,
  activityIcon,
  formatTemperature,
  windLabel,
  skyLabel,
  outfitComfortIcon,
  outfitComfortLabel,
} from '../utils/format';

interface EntryCardProps {
  entry: LogEntryWithParsed;
  onPress: () => void;
}

const BADGE_COLORS: Record<ActivityType, { bg: string; text: string }> = {
  Hike:     { bg: '#E8F5E9', text: '#2D6A4F' },
  Trailrun: { bg: '#FFEBEE', text: '#C62828' },
  Skitour:  { bg: '#E3F2FD', text: '#1565C0' },
  Bike:     { bg: '#FFF3E0', text: '#E65100' },
};

function skyIcon(sky: string): string {
  if (sky === 'snow') return '🌨';
  if (sky === 'cloudy') return '☁️';
  if (sky === 'partly_sunny') return '⛅';
  return '☀️';
}

export function EntryCard({ entry, onPress }: EntryCardProps) {
  const badge = BADGE_COLORS[entry.activity_type] ?? BADGE_COLORS.Hike;
  const hasConditions =
    entry.temperature_c != null ||
    (entry.wind != null && entry.wind !== 'none') ||
    entry.sky != null ||
    entry.outfit_comfort != null ||
    entry.location_name != null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.activityBadge, { backgroundColor: badge.bg }]}>
          <Text style={styles.activityIcon}>{activityIcon(entry.activity_type)}</Text>
          <Text style={[styles.activityLabel, { color: badge.text }]}>
            {activityLabel(entry.activity_type)}
          </Text>
        </View>
        <Text style={styles.date}>{formatDateSwiss(entry.date)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>{entry.title}</Text>

      <View style={styles.stats}>
        <StatItem label="Distance" value={formatDistance(entry.distance_km)} />
        <StatDivider />
        <StatItem label="Elevation ↑" value={formatElevation(entry.elevation_gain_m)} />
        {entry.elevation_loss_m != null && (
          <>
            <StatDivider />
            <StatItem label="Elevation ↓" value={formatElevation(entry.elevation_loss_m)} />
          </>
        )}
      </View>

      {hasConditions && (
        <View style={styles.conditions}>
          {entry.temperature_c != null && (
            <Text style={styles.condText}>🌡 {formatTemperature(entry.temperature_c)}</Text>
          )}
          {entry.wind != null && entry.wind !== 'none' && (
            <Text style={styles.condText}>💨 {windLabel(entry.wind)}</Text>
          )}
          {entry.sky != null && (
            <Text style={styles.condText}>
              {skyIcon(entry.sky)} {skyLabel(entry.sky)}
            </Text>
          )}
          {entry.outfit_comfort != null && (
            <Text style={styles.condText}>
              🧥 {outfitComfortIcon(entry.outfit_comfort)} {outfitComfortLabel(entry.outfit_comfort)}
            </Text>
          )}
          {entry.location_name != null && (
            <Text style={styles.condText}>📍 {entry.location_name}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatDivider() {
  return <View style={styles.statDivider} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  activityIcon: {
    fontSize: 13,
  },
  activityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 13,
    color: '#757575',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  statLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E0E0E0',
  },
  conditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
    marginTop: 10,
  },
  condText: {
    fontSize: 11,
    color: '#757575',
    fontWeight: '500',
  },
});
