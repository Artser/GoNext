import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Menu, Portal, Dialog, Text } from 'react-native-paper';
import { photoService } from '../services/photoService';

interface PhotoPickerProps {
  onPhotoSelected: (filePath: string) => void;
  onError?: (error: Error) => void;
}

export default function PhotoPicker({ onPhotoSelected, onError }: PhotoPickerProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePickFromGallery = async () => {
    setMenuVisible(false);
    setLoading(true);
    try {
      const filePath = await photoService.pickImage();
      if (filePath) {
        onPhotoSelected(filePath);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Неизвестная ошибка');
      if (onError) {
        onError(err);
      } else {
        Alert.alert('Ошибка', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    setMenuVisible(false);
    setLoading(true);
    try {
      const filePath = await photoService.takePhoto();
      if (filePath) {
        onPhotoSelected(filePath);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Неизвестная ошибка');
      if (onError) {
        onError(err);
      } else {
        Alert.alert('Ошибка', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            icon="camera"
            onPress={() => setMenuVisible(true)}
            loading={loading}
            disabled={loading}
          >
            Добавить фото
          </Button>
        }
      >
        <Menu.Item onPress={handlePickFromGallery} title="Выбрать из галереи" />
        <Menu.Item onPress={handleTakePhoto} title="Сделать фото" />
      </Menu>
    </>
  );
}
