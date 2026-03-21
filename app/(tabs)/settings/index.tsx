import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGearManager } from '@/src/hooks/useGearManager';
import { GearEditModal } from '@/src/components/GearEditModal';
import { SectionHeader } from '@/src/components/SectionHeader';
import { Category } from '@/src/db/types';

export default function SettingsScreen() {
  const {
    categories,
    items,
    loading,
    modal,
    inputValue,
    setInputValue,
    working,
    openModal,
    closeModal,
    confirmModal,
    promptDeleteCategory,
    promptDeleteItem,
  } = useGearManager();

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleCategory = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Gear Template" />
        <Text style={styles.subtitle}>
          Manage the gear categories and items available when logging a new activity.
        </Text>

        {loading ? (
          <ActivityIndicator color="#2D6A4F" style={styles.loading} />
        ) : (
          <>
            {categories.map((cat: Category) => {
              const catItems = items.filter((i) => i.category_id === cat.id);
              const expanded = expandedIds.has(cat.id);

              return (
                <View key={cat.id} style={styles.categoryCard}>
                  {/* Category row */}
                  <TouchableOpacity
                    style={styles.categoryRow}
                    onPress={() => toggleCategory(cat.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={expanded ? 'chevron-down' : 'chevron-forward'}
                      size={16}
                      color="#757575"
                    />
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryCount}>{catItems.length} items</Text>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => openModal({ kind: 'rename-category', category: cat })}
                    >
                      <Ionicons name="pencil-outline" size={17} color="#757575" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => promptDeleteCategory(cat)}
                    >
                      <Ionicons name="trash-outline" size={17} color="#E63946" />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Items */}
                  {expanded && (
                    <View style={styles.itemsContainer}>
                      {catItems.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                          <View style={styles.itemDot} />
                          <Text style={styles.itemName}>{item.name}</Text>
                          <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => openModal({ kind: 'rename-item', item })}
                          >
                            <Ionicons name="pencil-outline" size={16} color="#757575" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => promptDeleteItem(item)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#E63946" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity
                        style={styles.addItemBtn}
                        onPress={() => openModal({ kind: 'add-item', category: cat })}
                      >
                        <Ionicons name="add" size={16} color="#2D6A4F" />
                        <Text style={styles.addItemLabel}>Add item</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.addCategoryBtn}
              onPress={() => openModal({ kind: 'add-category' })}
            >
              <Ionicons name="add-circle-outline" size={20} color="#2D6A4F" />
              <Text style={styles.addCategoryLabel}>Add Category</Text>
            </TouchableOpacity>
          </>
        )}

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>TrailLog — Personal Activity Logbook</Text>
          <Text style={styles.aboutSub}>All data stored locally on this device.</Text>
          <Text style={styles.aboutSub}>Map tiles © swisstopo</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <GearEditModal
        mode={modal}
        inputValue={inputValue}
        onChangeInput={setInputValue}
        onConfirm={confirmModal}
        onDismiss={closeModal}
        working={working}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    paddingHorizontal: 16,
    marginBottom: 12,
    lineHeight: 20,
  },
  loading: {
    marginTop: 40,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  categoryCount: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  iconBtn: {
    padding: 4,
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
    gap: 10,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BDBDBD',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  addItemLabel: {
    fontSize: 14,
    color: '#2D6A4F',
    fontWeight: '500',
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    gap: 8,
  },
  addCategoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D6A4F',
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 4,
  },
  aboutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  aboutSub: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  bottomPadding: {
    height: 48,
  },
});
