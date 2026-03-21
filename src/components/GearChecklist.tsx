import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category, GearItem } from '../db/types';

interface GearChecklistProps {
  categories: Category[];
  items: GearItem[];
  selections: Record<string, boolean>;
  onToggle?: (itemId: number) => void;
  readonly?: boolean;
}

export function GearChecklist({
  categories,
  items,
  selections,
  onToggle,
  readonly = false,
}: GearChecklistProps) {
  if (categories.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No gear categories found. Add some in Settings.</Text>
      </View>
    );
  }

  return (
    <View>
      {categories.map((cat) => {
        const catItems = items.filter((it) => it.category_id === cat.id);
        if (catItems.length === 0) return null;

        const checkedCount = catItems.filter((it) => selections[String(it.id)]).length;

        return (
          <View key={cat.id} style={styles.category}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{cat.name}</Text>
              {checkedCount > 0 && (
                <Text style={styles.categoryCount}>
                  {checkedCount}/{catItems.length}
                </Text>
              )}
            </View>
            {catItems.map((item) => {
              const checked = !!selections[String(item.id)];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.item}
                  onPress={readonly ? undefined : () => onToggle?.(item.id)}
                  activeOpacity={readonly ? 1 : 0.6}
                  disabled={readonly}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.itemName,
                      checked && styles.itemNameChecked,
                      readonly && !checked && styles.itemNameUnchecked,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: 16,
  },
  emptyText: {
    color: '#9E9E9E',
    fontSize: 14,
  },
  category: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#424242',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryCount: {
    fontSize: 12,
    color: '#2D6A4F',
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2D6A4F',
    borderColor: '#2D6A4F',
  },
  itemName: {
    fontSize: 15,
    color: '#212121',
  },
  itemNameChecked: {
    color: '#2D6A4F',
    fontWeight: '500',
  },
  itemNameUnchecked: {
    color: '#BDBDBD',
  },
});
