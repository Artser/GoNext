import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  TextInput,
  Button,
  Checkbox,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tripPlaceService } from '../../../services/tripPlaceService';
import { tripService } from '../../../services/tripService';
import { photoService } from '../../../services/photoService';
import { TripPlace, Place, PlacePhoto } from '../../../types';
import PhotoGallery from '../../../components/PhotoGallery';
import PhotoPicker from '../../../components/PhotoPicker';
import { handleError, showError } from '../../../utils/errorHandler';
import * as Linking from 'expo-linking';
import ScreenWrapper from '../../../components/ScreenWrapper';

export default function TripPlaceDetailScreen() {
  const router = useRouter();
  const { tripPlaceId, tripId } = useLocalSearchParams<{ tripPlaceId: string; tripId: string }>();
  const [tripPlace, setTripPlace] = useState<(TripPlace & { place: Place }) | null>(null);
  const [visited, setVisited] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTripPlace();
  }, [tripPlaceId]);

  const loadTripPlace = async () => {
    try {
      setLoading(true);
      if (tripPlaceId) {
        const tripPlaceData = await tripPlaceService.getTripPlaceById(tripPlaceId);
        if (tripPlaceData) {
          const place = await tripPlaceService.getTripPlaces(tripPlaceData.tripId);
          const fullTripPlace = place.find((tp) => tp.id === tripPlaceId);
          if (fullTripPlace) {
            setTripPlace(fullTripPlace);
            setVisited(fullTripPlace.visited);
            setVisitDate(fullTripPlace.visitDate || '');
            setNotes(fullTripPlace.notes || '');

            // Загружаем фотографии места в поездке
            const tripPlacePhotos = await photoService.getPhotosByTripPlaceId(tripPlaceId);
            setPhotos(tripPlacePhotos);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки места в поездке:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить место');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelected = async (filePath: string) => {
    if (!tripPlace) return;

    try {
      const photo = await photoService.addPhotoToPlace(
        tripPlace.placeId,
        filePath,
        tripPlace.id
      );
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

  const handleSave = async () => {
    if (!tripPlaceId) return;

    try {
      setSaving(true);

      if (visited) {
        const dateToSave = visitDate.trim() || new Date().toISOString().split('T')[0];
        await tripPlaceService.updateTripPlace(tripPlaceId, {
          visited: true,
          visitDate: dateToSave,
          notes: notes.trim() || undefined,
        });
      } else {
        await tripPlaceService.updateTripPlace(tripPlaceId, {
          visited: false,
          visitDate: undefined,
          notes: notes.trim() || undefined,
        });
      }

      router.back();
    } catch (error) {
      const appError = handleError(error, 'Сохранение изменений');
      showError(appError);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenMap = () => {
    if (!tripPlace?.place.dd) {
      Alert.alert('Ошибка', 'Координаты не указаны');
      return;
    }

    const [latitude, longitude] = tripPlace.place.dd.split(',');
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Ошибка открытия карты:', err);
      Alert.alert('Ошибка', 'Не удалось открыть карту');
    });
  };

  const handleOpenNavigator = () => {
    if (!tripPlace?.place.dd) {
      Alert.alert('Ошибка', 'Координаты не указаны');
      return;
    }

    const [latitude, longitude] = tripPlace.place.dd.split(',');
    const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Ошибка открытия навигатора:', err);
      Alert.alert('Ошибка', 'Не удалось открыть навигатор');
    });
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

  if (!tripPlace) {
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

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={tripPlace.place.name} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              {tripPlace.place.name}
            </Text>
            {tripPlace.place.description && (
              <Text variant="bodyLarge" style={styles.description}>
                {tripPlace.place.description}
              </Text>
            )}
            {tripPlace.place.dd && (
              <Text variant="bodySmall" style={styles.coordinates}>
                📍 {tripPlace.place.dd}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Статус посещения
            </Text>

            <View style={styles.checkboxRow}>
              <Checkbox
                status={visited ? 'checked' : 'unchecked'}
                onPress={() => setVisited(!visited)}
              />
              <Text variant="bodyLarge" onPress={() => setVisited(!visited)}>
                Место посещено
              </Text>
            </View>

            {visited && (
              <TextInput
                label="Дата посещения (ГГГГ-ММ-ДД)"
                value={visitDate}
                onChangeText={setVisitDate}
                mode="outlined"
                style={styles.input}
                placeholder="2024-06-15"
                keyboardType="numeric"
              />
            )}

            <TextInput
              label="Заметки"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={styles.input}
              placeholder="Добавьте заметки о посещении этого места..."
            />
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

        {tripPlace.place.dd && (
          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              icon="map"
              onPress={handleOpenMap}
              style={styles.actionButton}
            >
              Открыть на карте
            </Button>
            <Button
              mode="outlined"
              icon="navigation"
              onPress={handleOpenNavigator}
              style={styles.actionButton}
            >
              Открыть в навигаторе
            </Button>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        >
          Сохранить
        </Button>
      </ScrollView>
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
  title: {
    marginBottom: 8,
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  coordinates: {
    marginTop: 8,
    color: '#999',
    fontFamily: 'monospace',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 8,
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
