import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistance, formatDuration, formatElevation } from '../utils/format';

interface StatsBarProps {
  distanceKm: number | null;
  durationMinutes: number | null;
  elevationGainM: number | null;
  elevationLossM: number | null;
}

export function StatsBar({
  distanceKm,
  durationMinutes,
  elevationGainM,
  elevationLossM,
}: StatsBarProps) {
  return (
    <View style={styles.container}>
      <StatItem
        icon="📏"
        value={formatDistance(distanceKm)}
        label="Distance"
      />
      <StatDivider />
      <StatItem
        icon="⏱"
        value={formatDuration(durationMinutes)}
        label="Duration"
      />
      <StatDivider />
      <StatItem
        icon="↑"
        value={formatElevation(elevationGainM)}
        label="Gain"
      />
      <StatDivider />
      <StatItem
        icon="↓"
        value={formatElevation(elevationLossM)}
        label="Loss"
      />
    </View>
  );
}

function StatItem({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function StatDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  label: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 1,
  },
  divider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
});
