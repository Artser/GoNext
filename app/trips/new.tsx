import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { tripService } from '../../services/tripService';
import { placeService } from '../../services/placeService';
import { tripPlaceService } from '../../services/tripPlaceService';
import { Place } from '../../types';
import { validateTrip } from '../../utils/validation';
import { handleError, showError } from '../../utils/errorHandler';
import ScreenWrapper from '../../components/ScreenWrapper';

export default function NewTripScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [current, setCurrent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPlacePicker, setShowPlacePicker] = useState(false);
  const [availablePlaces, setAvailablePlaces] = useState<Place[]>([]);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);

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
    setSelectedPlaceIds((prev) =>
      prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId]
    );
  };

  const validateDate = (dateString: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Название поездки обязательно для заполнения');
      return;
    }

    if (startDate && !validateDate(startDate)) {
      Alert.alert('Ошибка', 'Неверный формат даты начала. Используйте формат ГГГГ-ММ-ДД');
      return;
    }

    if (endDate && !validateDate(endDate)) {
      Alert.alert('Ошибка', 'Неверный формат даты окончания. Используйте формат ГГГГ-ММ-ДД');
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      Alert.alert('Ошибка', 'Дата начала не может быть позже даты окончания');
      return;
    }

    try {
      setLoading(true);
      const trip = await tripService.createTrip({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        current,
      });

      // Добавляем выбранные места в поездку
      if (selectedPlaceIds.length > 0) {
        for (let i = 0; i < selectedPlaceIds.length; i++) {
          await tripPlaceService.addPlaceToTrip(trip.id, selectedPlaceIds[i], i + 1);
        }
      }

      router.back();
    } catch (error) {
      console.error('Ошибка создания поездки:', error);
      Alert.alert('Ошибка', 'Не удалось создать поездку');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Новая поездка" />
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

            {selectedPlaceIds.length > 0 && (
              <View style={styles.selectedPlaces}>
                {selectedPlaceIds.map((placeId) => {
                  const place = availablePlaces.find((p) => p.id === placeId);
                  return place ? (
                    <Chip
                      key={placeId}
                      onClose={() => togglePlaceSelection(placeId)}
                      style={styles.chip}
                    >
                      {place.name}
                    </Chip>
                  ) : null;
                })}
              </View>
            )}

            <Button
              mode="outlined"
              icon="map-marker"
              onPress={handleOpenPlacePicker}
              style={styles.addPlaceButton}
            >
              {selectedPlaceIds.length === 0
                ? 'Добавить места'
                : `Добавить еще (${selectedPlaceIds.length} выбрано)`}
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
          Создать поездку
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
                          selectedPlaceIds.includes(place.id)
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
