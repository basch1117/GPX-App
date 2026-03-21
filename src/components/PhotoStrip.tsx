import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = 100;

interface PhotoStripProps {
  photos: string[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  maxPhotos?: number;
  readonly?: boolean;
}

export function PhotoStrip({
  photos,
  onAdd,
  onRemove,
  maxPhotos = 3,
  readonly = false,
}: PhotoStripProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
        {photos.map((uri, index) => (
          <View key={uri + index} style={styles.photoWrapper}>
            <TouchableOpacity
              onPress={() => setLightboxIndex(index)}
              activeOpacity={0.8}
            >
              <Image source={{ uri }} style={styles.photo} />
            </TouchableOpacity>
            {!readonly && onRemove && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemove(index)}
              >
                <Ionicons name="close-circle" size={20} color="#E63946" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {!readonly && photos.length < maxPhotos && onAdd && (
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Ionicons name="camera-outline" size={28} color="#9E9E9E" />
            <Text style={styles.addLabel}>{photos.length === 0 ? 'Add photo' : 'Add'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {lightboxIndex !== null && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setLightboxIndex(null)}
        >
          <View style={styles.lightboxOverlay}>
            <TouchableOpacity
              style={styles.lightboxClose}
              onPress={() => setLightboxIndex(null)}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Image
              source={{ uri: photos[lightboxIndex] }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  photoWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  addButton: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginRight: 10,
  },
  addLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 4,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
});
