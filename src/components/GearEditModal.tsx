import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { ModalMode } from '../hooks/useGearManager';

interface GearEditModalProps {
  mode: ModalMode | null;
  inputValue: string;
  onChangeInput: (value: string) => void;
  onConfirm: () => void;
  onDismiss: () => void;
  working: boolean;
}

function resolveTitle(mode: ModalMode): string {
  switch (mode.kind) {
    case 'add-category':    return 'New Category';
    case 'rename-category': return `Rename "${mode.category.name}"`;
    case 'add-item':        return `Add item to "${mode.category.name}"`;
    case 'rename-item':     return `Rename "${mode.item.name}"`;
  }
}

export function GearEditModal({
  mode,
  inputValue,
  onChangeInput,
  onConfirm,
  onDismiss,
  working,
}: GearEditModalProps) {
  return (
    <Modal visible={!!mode} transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>{mode ? resolveTitle(mode) : ''}</Text>

          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={onChangeInput}
            placeholder="Name"
            placeholderTextColor="#BDBDBD"
            autoFocus
            maxLength={60}
            onSubmitEditing={onConfirm}
            returnKeyType="done"
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, (!inputValue.trim() || working) && styles.btnDisabled]}
              onPress={onConfirm}
              disabled={!inputValue.trim() || working}
            >
              {working ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmLabel}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    gap: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212121',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#757575',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
