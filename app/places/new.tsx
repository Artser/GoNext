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
import { placeService } from '../../services/placeService';
import { validatePlace } from '../../utils/validation';
import { handleError, showError } from '../../utils/errorHandler';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import ScreenWrapper from '../../components/ScreenWrapper';

export default function NewPlaceScreen() {
  const router = useRouter();
  const { selectedLat, selectedLon } = useLocalSearchParams<{
    selectedLat?: string;
    selectedLon?: string;
  }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visitlater, setVisitlater] = useState(false);
  const [liked, setLiked] = useState(false);
  const [coordinates, setCoordinates] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedLat && selectedLon) {
      setCoordinates(`${selectedLat},${selectedLon}`);
    }
  }, [selectedLat, selectedLon]);

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
      await placeService.createPlace({
        name: name.trim(),
        description: description.trim() || undefined,
        visitlater,
        liked,
        dd: coordinates.trim() || undefined,
      });

      router.back();
    } catch (error) {
      const appError = handleError(error, 'Создание места');
      showError(appError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Новое место" />
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
          Сохранить место
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
