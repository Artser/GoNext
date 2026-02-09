import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  Button,
  Chip,
  IconButton,
  Divider,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { placeService } from '../../services/placeService';
import { photoService } from '../../services/photoService';
import { Place, PlacePhoto } from '../../types';
import PhotoGallery from '../../components/PhotoGallery';
import PhotoPicker from '../../components/PhotoPicker';
import { handleError, showError } from '../../utils/errorHandler';
import * as Linking from 'expo-linking';
import ScreenWrapper from '../../components/ScreenWrapper';

export default function PlaceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    loadPlace();
  }, [id]);

  const loadPlace = async () => {
    try {
      setLoading(true);
      if (id) {
        const [placeData, placePhotos] = await Promise.all([
          placeService.getPlaceById(id),
          photoService.getPhotosByPlaceId(id),
        ]);
        setPlace(placeData);
        setPhotos(placePhotos);
      }
    } catch (error) {
      const appError = handleError(error, 'Загрузка места');
      showError(appError);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelected = async (filePath: string) => {
    if (!id) return;

    try {
      const photo = await photoService.addPhotoToPlace(id, filePath);
      setPhotos([photo, ...photos]);
    } catch (error) {
      const appError = handleError(error, 'Добавление фотографии');
      showError(appError);
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    try {
      await photoService.deletePhoto(photoId);
      setPhotos(photos.filter((p) => p.id !== photoId));
    } catch (error) {
      const appError = handleError(error, 'Удаление фотографии');
      showError(appError);
    }
  };

  const handleEdit = () => {
    if (place) {
      router.push(`/places/edit/${place.id}`);
    }
  };

  const handleDelete = async () => {
    if (!place) return;

    try {
      await placeService.deletePlace(place.id);
      setDeleteDialogVisible(false);
      router.back();
    } catch (error) {
      console.error('Ошибка удаления места:', error);
      Alert.alert('Ошибка', 'Не удалось удалить место');
    }
  };

  const handleOpenMap = () => {
    if (!place?.dd) {
      Alert.alert('Ошибка', 'Координаты не указаны');
      return;
    }

    const [latitude, longitude] = place.dd.split(',');
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      const appError = handleError(err, 'Открытие карты');
      showError(appError);
    });
  };

  const handleOpenNavigator = () => {
    if (!place?.dd) {
      Alert.alert('Ошибка', 'Координаты не указаны');
      return;
    }

    const [latitude, longitude] = place.dd.split(',');
    const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Ошибка открытия навигатора:', err);
      Alert.alert('Ошибка', 'Не удалось открыть навигатор');
    });
  };

  const toggleVisitLater = async () => {
    if (!place) return;

    try {
      const updatedPlace = await placeService.updatePlace(place.id, {
        visitlater: !place.visitlater,
      });
      setPlace(updatedPlace);
    } catch (error) {
      const appError = handleError(error, 'Обновление статуса места');
      showError(appError);
    }
  };

  const toggleLiked = async () => {
    if (!place) return;

    try {
      const updatedPlace = await placeService.updatePlace(place.id, {
        liked: !place.liked,
      });
      setPlace(updatedPlace);
    } catch (error) {
      const appError = handleError(error, 'Обновление статуса места');
      showError(appError);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Appbar.Header>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title="Загрузка..." />
          </Appbar.Header>
          <View style={styles.centerContent}>
            <Text>Загрузка...</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (!place) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Appbar.Header>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title="Место не найдено" />
          </Appbar.Header>
          <View style={styles.centerContent}>
            <Text>Место не найдено</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={place.name} />
          <Appbar.Action icon="pencil" onPress={handleEdit} />
        </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="headlineSmall" style={styles.title}>
                {place.name}
              </Text>
              <View style={styles.chipsContainer}>
                <IconButton
                  icon={place.visitlater ? 'clock' : 'clock-outline'}
                  iconColor={place.visitlater ? '#6200ee' : '#666'}
                  size={24}
                  onPress={toggleVisitLater}
                />
                <IconButton
                  icon={place.liked ? 'heart' : 'heart-outline'}
                  iconColor={place.liked ? '#e91e63' : '#666'}
                  size={24}
                  onPress={toggleLiked}
                />
              </View>
            </View>

            {place.description && (
              <>
                <Divider style={styles.divider} />
                <Text variant="bodyLarge" style={styles.description}>
                  {place.description}
                </Text>
              </>
            )}

            {place.dd && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.coordinatesContainer}>
                  <Text variant="bodyMedium" style={styles.coordinatesLabel}>
                    Координаты:
                  </Text>
                  <Text variant="bodySmall" style={styles.coordinates}>
                    {place.dd}
                  </Text>
                </View>
              </>
            )}

            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.date}>
              Создано: {formatDate(place.createdAt)}
            </Text>
          </Card.Content>
        </Card>

        {/* Фотографии */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.photosHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Фотографии ({photos.length})
              </Text>
              <PhotoPicker onPhotoSelected={handlePhotoSelected} />
            </View>
            <PhotoGallery
              photos={photos}
              onDelete={handlePhotoDelete}
              editable={true}
            />
          </Card.Content>
        </Card>

        <View style={styles.actionsContainer}>
          {place.dd && (
            <>
              <Button
                mode="contained"
                icon="map"
                onPress={() => {
                  const [lat, lon] = place.dd!.split(',');
                  router.push(`/places/map?latitude=${lat}&longitude=${lon}&editable=false`);
                }}
                style={styles.actionButton}
              >
                Показать на карте
              </Button>
              <Button
                mode="outlined"
                icon="map"
                onPress={handleOpenMap}
                style={styles.actionButton}
              >
                Открыть в Google Maps
              </Button>
              <Button
                mode="outlined"
                icon="navigation"
                onPress={handleOpenNavigator}
                style={styles.actionButton}
              >
                Открыть в навигаторе
              </Button>
            </>
          )}
          <Button
            mode="outlined"
            icon="delete"
            onPress={() => setDeleteDialogVisible(true)}
            style={[styles.actionButton, styles.deleteButton]}
            textColor="#d32f2f"
          >
            Удалить место
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Удаление места</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Вы уверены, что хотите удалить место "{place.name}"?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Отмена</Button>
            <Button onPress={handleDelete} textColor="#d32f2f">
              Удалить
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: 12,
  },
  description: {
    marginTop: 8,
    lineHeight: 24,
  },
  coordinatesContainer: {
    marginTop: 8,
  },
  coordinatesLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  coordinates: {
    fontFamily: 'monospace',
    color: '#666',
  },
  date: {
    color: '#999',
    marginTop: 8,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  deleteButton: {
    borderColor: '#d32f2f',
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 0,
  },
});
