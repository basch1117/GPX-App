import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LogEntryWithParsed } from '../db/types';
import { formatDate, formatDistance, formatElevation, activityLabel, activityIcon } from '../utils/format';

interface EntryCardProps {
  entry: LogEntryWithParsed;
  onPress: () => void;
}

export function EntryCard({ entry, onPress }: EntryCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.activityBadge}>
          <Text style={styles.activityIcon}>{activityIcon(entry.activity_type)}</Text>
          <Text style={styles.activityLabel}>{activityLabel(entry.activity_type)}</Text>
        </View>
        <Text style={styles.date}>{formatDate(entry.date)}</Text>
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
    backgroundColor: '#E8F5E9',
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
    color: '#2D6A4F',
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
});
