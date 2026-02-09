import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Appbar,
  TextInput,
  Button,
  Card,
  Text,
  Checkbox,
  Portal,
  Dialog,
  List,
  Chip,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tripService } from '../../../services/tripService';
import { placeService } from '../../../services/placeService';
import { tripPlaceService } from '../../../services/tripPlaceService';
import { Trip, Place } from '../../../types';
import { validateTrip } from '../../../utils/validation';
import { handleError, showError } from '../../../utils/errorHandler';

export default function EditTripScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [current, setCurrent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [showPlacePicker, setShowPlacePicker] = useState(false);
  const [availablePlaces, setAvailablePlaces] = useState<Place[]>([]);
  const [tripPlaceIds, setTripPlaceIds] = useState<string[]>([]);

  useEffect(() => {
    loadTrip();
  }, [id]);

  const loadTrip = async () => {
    try {
      setLoadingTrip(true);
      if (id) {
        const tripData = await tripService.getTripById(id);
        if (tripData) {
          setTrip(tripData);
          setTitle(tripData.title);
          setDescription(tripData.description || '');
          setStartDate(tripData.startDate || '');
          setEndDate(tripData.endDate || '');
          setCurrent(tripData.current);

          // Загружаем места в поездке
          const tripPlaces = await tripPlaceService.getTripPlaces(id);
          setTripPlaceIds(tripPlaces.map((tp) => tp.placeId));
        }
      }
    } catch (error) {
      const appError = handleError(error, 'Загрузка поездки');
      showError(appError);
      router.back();
    } finally {
      setLoadingTrip(false);
    }
  };

  const loadAvailablePlaces = async () => {
    try {
      const places = await placeService.getAllPlaces();
      setAvailablePlaces(places);
    } catch (error) {
      handleError(error, 'Загрузка мест');
      // Не показываем ошибку пользователю, так как это не критично
    }
  };

  const handleOpenPlacePicker = async () => {
    await loadAvailablePlaces();
    setShowPlacePicker(true);
  };

  const togglePlaceSelection = (placeId: string) => {
    setTripPlaceIds((prev) =>
      prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId]
    );
  };

  const handleSave = async () => {
    if (!id || !trip) return;

    // Валидация данных
    const validation = validateTrip({
      title,
      description,
      startDate,
      endDate,
    });

    if (!validation.isValid) {
      showError(validation.error || 'Ошибка валидации');
      return;
    }

    try {
      setLoading(true);
      await tripService.updateTrip(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        current,
      });

      // Обновляем места в поездке
      const currentTripPlaces = await tripPlaceService.getTripPlaces(id);
      const currentPlaceIds = currentTripPlaces.map((tp) => tp.placeId);

      // Удаляем места, которые были убраны
      for (const tripPlace of currentTripPlaces) {
        if (!tripPlaceIds.includes(tripPlace.placeId)) {
          await tripPlaceService.removePlaceFromTrip(tripPlace.id);
        }
      }

      // Добавляем новые места
      const newPlaceIds = tripPlaceIds.filter((id) => !currentPlaceIds.includes(id));
      const maxOrder = currentTripPlaces.length > 0
        ? Math.max(...currentTripPlaces.map((tp) => tp.order))
        : 0;

      for (let i = 0; i < newPlaceIds.length; i++) {
        await tripPlaceService.addPlaceToTrip(id, newPlaceIds[i], maxOrder + i + 1);
      }

      router.back();
    } catch (error) {
      const appError = handleError(error, 'Обновление поездки');
      showError(appError);
    } finally {
      setLoading(false);
    }
  };

  if (loadingTrip) {
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

  if (!trip) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Поездка не найдена" />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <Text>Поездка не найдена</Text>
        </View>
      </View>
    );
  }

  const selectedPlaces = availablePlaces.filter((p) => tripPlaceIds.includes(p.id));

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Редактирование поездки" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Название поездки *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              placeholder="Введите название поездки"
            />

            <TextInput
              label="Описание"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Добавьте описание поездки"
            />

            <TextInput
              label="Дата начала (ГГГГ-ММ-ДД)"
              value={startDate}
              onChangeText={setStartDate}
              mode="outlined"
              style={styles.input}
              placeholder="2024-06-01"
              keyboardType="numeric"
            />

            <TextInput
              label="Дата окончания (ГГГГ-ММ-ДД)"
              value={endDate}
              onChangeText={setEndDate}
              mode="outlined"
              style={styles.input}
              placeholder="2024-06-15"
              keyboardType="numeric"
            />

            <View style={styles.checkboxRow}>
              <Checkbox
                status={current ? 'checked' : 'unchecked'}
                onPress={() => setCurrent(!current)}
              />
              <Text variant="bodyLarge" onPress={() => setCurrent(!current)}>
                Сделать текущей поездкой
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Места в поездке
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              Выберите места из вашей коллекции
            </Text>

            {selectedPlaces.length > 0 && (
              <View style={styles.selectedPlaces}>
                {selectedPlaces.map((place) => (
                  <Chip
                    key={place.id}
                    onClose={() => togglePlaceSelection(place.id)}
                    style={styles.chip}
                  >
                    {place.name}
                  </Chip>
                ))}
              </View>
            )}

            <Button
              mode="outlined"
              icon="map-marker"
              onPress={handleOpenPlacePicker}
              style={styles.addPlaceButton}
            >
              {tripPlaceIds.length === 0
                ? 'Добавить места'
                : `Изменить места (${tripPlaceIds.length} выбрано)`}
            </Button>
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

      {/* Place Picker Dialog */}
      <Portal>
        <Dialog
          visible={showPlacePicker}
          onDismiss={() => setShowPlacePicker(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Выберите места</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={styles.dialogScrollView}>
              {availablePlaces.length === 0 ? (
                <Text style={styles.emptyText}>Нет доступных мест</Text>
              ) : (
                availablePlaces.map((place) => (
                  <List.Item
                    key={place.id}
                    title={place.name}
                    description={place.description}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={
                          tripPlaceIds.includes(place.id)
                            ? 'checkbox-marked'
                            : 'checkbox-blank-outline'
                        }
                      />
                    )}
                    onPress={() => togglePlaceSelection(place.id)}
                  />
                ))
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowPlacePicker(false)}>Готово</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#666',
    marginBottom: 16,
  },
  selectedPlaces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginRight: 4,
  },
  addPlaceButton: {
    marginTop: 8,
  },
  saveButton: {
    marginTop: 8,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogScrollView: {
    maxHeight: 400,
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    color: '#666',
  },
});
