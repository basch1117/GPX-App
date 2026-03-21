import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useGearTemplate } from '@/src/hooks/useGearTemplate';
import {
  createCategory,
  renameCategory,
  deleteCategory,
  createItem,
  renameItem,
  deleteItem,
} from '@/src/db/queries/gear';
import { Category, GearItem } from '@/src/db/types';
import { SectionHeader } from '@/src/components/SectionHeader';

type ModalMode =
  | { kind: 'add-category' }
  | { kind: 'rename-category'; category: Category }
  | { kind: 'add-item'; category: Category }
  | { kind: 'rename-item'; item: GearItem };

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { categories, items, loading, reload } = useGearTemplate();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<ModalMode | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [working, setWorking] = useState(false);

  const toggleCategory = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openModal = useCallback((mode: ModalMode) => {
    if (mode.kind === 'rename-category') setInputValue(mode.category.name);
    else if (mode.kind === 'rename-item') setInputValue(mode.item.name);
    else setInputValue('');
    setModal(mode);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setInputValue('');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!modal) return;
    const name = inputValue.trim();
    if (!name) return;

    setWorking(true);
    try {
      switch (modal.kind) {
        case 'add-category':
          await createCategory(db, name);
          break;
        case 'rename-category':
          await renameCategory(db, modal.category.id, name);
          break;
        case 'add-item':
          await createItem(db, modal.category.id, name);
          break;
        case 'rename-item':
          await renameItem(db, modal.item.id, name);
          break;
      }
      await reload();
      closeModal();
    } finally {
      setWorking(false);
    }
  }, [modal, inputValue, db, reload, closeModal]);

  const handleDeleteCategory = useCallback(
    (cat: Category) => {
      const catItems = items.filter((i) => i.category_id === cat.id);
      const message =
        catItems.length > 0
          ? `This will also delete all ${catItems.length} items in this category.`
          : 'Are you sure?';
      Alert.alert(`Delete "${cat.name}"`, message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(db, cat.id);
            await reload();
          },
        },
      ]);
    },
    [db, items, reload]
  );

  const handleDeleteItem = useCallback(
    (item: GearItem) => {
      Alert.alert(`Delete "${item.name}"?`, 'This item will be removed.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteItem(db, item.id);
            await reload();
          },
        },
      ]);
    },
    [db, reload]
  );

  const modalTitle = modal
    ? modal.kind === 'add-category'
      ? 'New Category'
      : modal.kind === 'rename-category'
      ? `Rename "${modal.category.name}"`
      : modal.kind === 'add-item'
      ? `Add item to "${modal.category.name}"`
      : `Rename "${modal.item.name}"`
    : '';

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
            {categories.map((cat) => {
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
                      onPress={() => handleDeleteCategory(cat)}
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
                            onPress={() => handleDeleteItem(item)}
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

            {/* Add category button */}
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

      {/* Modal */}
      <Modal visible={!!modal} transparent animationType="fade" onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Name"
              placeholderTextColor="#BDBDBD"
              autoFocus
              maxLength={60}
              onSubmitEditing={handleConfirm}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelLabel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!inputValue.trim() || working) && styles.modalBtnDisabled]}
                onPress={handleConfirm}
                disabled={!inputValue.trim() || working}
              >
                {working ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmLabel}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    gap: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212121',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalCancelLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#757575',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
  },
  modalBtnDisabled: {
    opacity: 0.5,
  },
  modalConfirmLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
