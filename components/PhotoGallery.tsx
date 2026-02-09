import { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
import { Card, IconButton, Portal, Dialog, Text } from 'react-native-paper';
import { PlacePhoto } from '../types';

interface PhotoGalleryProps {
  photos: PlacePhoto[];
  onDelete?: (photoId: string) => void;
  editable?: boolean;
}

const { width } = Dimensions.get('window');
const photoSize = (width - 48) / 3; // 3 колонки с отступами

export default function PhotoGallery({ photos, onDelete, editable = false }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PlacePhoto | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  const handlePhotoPress = (photo: PlacePhoto) => {
    setSelectedPhoto(photo);
  };

  const handleDeletePress = (photoId: string) => {
    setPhotoToDelete(photoId);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    if (photoToDelete && onDelete) {
      onDelete(photoToDelete);
    }
    setDeleteDialogVisible(false);
    setPhotoToDelete(null);
  };

  if (photos.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {photos.map((photo) => (
            <Card
              key={photo.id}
              style={styles.photoCard}
              onPress={() => handlePhotoPress(photo)}
            >
              <Card.Content style={styles.photoContent}>
                <Image source={{ uri: photo.filePath }} style={styles.photo} />
                {editable && onDelete && (
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor="#fff"
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeletePress(photo.id);
                    }}
                  />
                )}
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </View>

      {/* Диалог просмотра фотографии */}
      <Portal>
        <Dialog
          visible={selectedPhoto !== null}
          onDismiss={() => setSelectedPhoto(null)}
          style={styles.dialog}
        >
          <Dialog.Content style={styles.dialogContent}>
            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: selectedPhoto.filePath }}
                  style={styles.fullPhoto}
                  resizeMode="contain"
                />
                <Text variant="bodySmall" style={styles.photoDate}>
                  {new Date(selectedPhoto.createdAt).toLocaleDateString('ru-RU')}
                </Text>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Text onPress={() => setSelectedPhoto(null)}>Закрыть</Text>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Диалог подтверждения удаления */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Удаление фотографии</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Вы уверены, что хотите удалить эту фотографию?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Text onPress={() => setDeleteDialogVisible(false)}>Отмена</Text>
            <Text onPress={confirmDelete} style={styles.deleteText}>
              Удалить
            </Text>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  photoCard: {
    marginRight: 8,
    width: photoSize,
    height: photoSize,
  },
  photoContent: {
    padding: 0,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    margin: 0,
  },
  dialog: {
    backgroundColor: '#000',
  },
  dialogContent: {
    padding: 0,
    backgroundColor: '#000',
  },
  fullPhoto: {
    width: '100%',
    height: 400,
    backgroundColor: '#000',
  },
  photoDate: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
  },
  deleteText: {
    color: '#d32f2f',
  },
});
