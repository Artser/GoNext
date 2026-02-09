import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Appbar,
  TextInput,
  Button,
  Checkbox,
  Card,
  Text,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { placeService } from '../../../services/placeService';
import { Place } from '../../../types';
import * as Location from 'expo-location';

export default function EditPlaceScreen() {
  const router = useRouter();
  const { id, selectedLat, selectedLon } = useLocalSearchParams<{
    id: string;
    selectedLat?: string;
    selectedLon?: string;
  }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visitlater, setVisitlater] = useState(false);
  const [liked, setLiked] = useState(false);
  const [coordinates, setCoordinates] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPlace, setLoadingPlace] = useState(true);

  useEffect(() => {
    loadPlace();
  }, [id]);

  useEffect(() => {
    if (selectedLat && selectedLon) {
      setCoordinates(`${selectedLat},${selectedLon}`);
    }
  }, [selectedLat, selectedLon]);

  const loadPlace = async () => {
    try {
      setLoadingPlace(true);
      if (id) {
        const placeData = await placeService.getPlaceById(id);
        if (placeData) {
          setPlace(placeData);
          setName(placeData.name);
          setDescription(placeData.description || '');
          setVisitlater(placeData.visitlater);
          setLiked(placeData.liked);
          setCoordinates(placeData.dd || '');
        }
      }
    } catch (error) {
      const appError = handleError(error, 'Загрузка места');
      showError(appError);
      router.back();
    } finally {
      setLoadingPlace(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Разрешение на геолокацию не предоставлено');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCoordinates(`${latitude},${longitude}`);
    } catch (error) {
      const appError = handleError(error, 'Получение геолокации');
      showError(appError);
    }
  };

  const handleSave = async () => {
    if (!id || !place) return;

    // Валидация данных
    const validation = validatePlace({
      name,
      description,
      coordinates,
    });

    if (!validation.isValid) {
      showError(validation.error || 'Ошибка валидации');
      return;
    }

    try {
      setLoading(true);
      await placeService.updatePlace(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        visitlater,
        liked,
        dd: coordinates.trim() || undefined,
      });

      router.back();
    } catch (error) {
      const appError = handleError(error, 'Обновление места');
      showError(appError);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlace) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Загрузка..." />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <Text>Загрузка...</Text>
        </View>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Место не найдено" />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <Text>Место не найдено</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Редактирование места" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Название места *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              placeholder="Введите название места"
            />

            <TextInput
              label="Описание"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Добавьте описание места"
            />

            <View style={styles.coordinatesSection}>
              <TextInput
                label="Координаты (широта,долгота)"
                value={coordinates}
                onChangeText={setCoordinates}
                mode="outlined"
                style={styles.input}
                placeholder="55.7558,37.6173"
                keyboardType="numeric"
              />
              <View style={styles.locationButtons}>
                <Button
                  mode="outlined"
                  icon="crosshairs-gps"
                  onPress={handleGetCurrentLocation}
                  style={styles.locationButton}
                >
                  Текущее местоположение
                </Button>
                <Button
                  mode="outlined"
                  icon="map"
                  onPress={() => {
                    if (coordinates) {
                      const [lat, lon] = coordinates.split(',');
                      router.push(`/places/map?latitude=${lat}&longitude=${lon}&editable=true`);
                    } else {
                      router.push('/places/map?editable=true');
                    }
                  }}
                  style={styles.locationButton}
                >
                  Выбрать на карте
                </Button>
              </View>
            </View>

            <View style={styles.checkboxesContainer}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  status={visitlater ? 'checked' : 'unchecked'}
                  onPress={() => setVisitlater(!visitlater)}
                />
                <Text variant="bodyLarge" onPress={() => setVisitlater(!visitlater)}>
                  Хочу посетить
                </Text>
              </View>

              <View style={styles.checkboxRow}>
                <Checkbox
                  status={liked ? 'checked' : 'unchecked'}
                  onPress={() => setLiked(!liked)}
                />
                <Text variant="bodyLarge" onPress={() => setLiked(!liked)}>
                  Понравилось
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
        >
          Сохранить изменения
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  input: {
    marginBottom: 16,
  },
  coordinatesSection: {
    marginBottom: 16,
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  locationButton: {
    flex: 1,
    marginTop: 8,
  },
  checkboxesContainer: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 8,
  },
});
