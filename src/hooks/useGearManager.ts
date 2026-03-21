import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useGearTemplate } from './useGearTemplate';
import {
  createCategory,
  renameCategory,
  deleteCategory,
  createItem,
  renameItem,
  deleteItem,
} from '../db/queries/gear';
import { Category, GearItem } from '../db/types';

export type ModalMode =
  | { kind: 'add-category' }
  | { kind: 'rename-category'; category: Category }
  | { kind: 'add-item'; category: Category }
  | { kind: 'rename-item'; item: GearItem };

export function useGearManager() {
  const db = useSQLiteContext();
  const { categories, items, loading, reload } = useGearTemplate();

  const [modal, setModal] = useState<ModalMode | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [working, setWorking] = useState(false);

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

  const confirmModal = useCallback(async () => {
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

  const promptDeleteCategory = useCallback(
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

  const promptDeleteItem = useCallback(
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

  return {
    // Data
    categories,
    items,
    loading,
    // Modal state
    modal,
    inputValue,
    setInputValue,
    working,
    // Modal actions
    openModal,
    closeModal,
    confirmModal,
    // Delete actions
    promptDeleteCategory,
    promptDeleteItem,
  };
}
