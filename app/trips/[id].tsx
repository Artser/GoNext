import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  Button,
  Chip,
  SegmentedButtons,
  IconButton,
  Portal,
  Dialog,
  Divider,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tripService } from '../../services/tripService';
import { tripPlaceService } from '../../services/tripPlaceService';
import { Trip, TripPlace, Place } from '../../types';
import { handleError, showError } from '../../utils/errorHandler';
import * as Linking from 'expo-linking';

type ViewMode = 'plan' | 'diary';

export default function TripDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripPlaces, setTripPlaces] = useState<(TripPlace & { place: Place })[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('plan');
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [id]);

  const loadTrip = async () => {
    try {
      setLoading(true);
      if (id) {
        const tripData = await tripService.getTripById(id);
        if (tripData) {
          setTrip(tripData);
          const places = await tripPlaceService.getTripPlaces(id);
          setTripPlaces(places);
        }
      }
    } catch (error) {
      const appError = handleError(error, 'Загрузка поездки');
      showError(appError);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (trip) {
      router.push(`/trips/edit/${trip.id}`);
    }
  };

  const handleDelete = async () => {
    if (!trip) return;

    try {
      await tripService.deleteTrip(trip.id);
      setDeleteDialogVisible(false);
      router.back();
    } catch (error) {
      const appError = handleError(error, 'Удаление поездки');
      showError(appError);
    }
  };

  const handleMarkAsVisited = async (tripPlaceId: string) => {
    try {
      await tripPlaceService.markAsVisited(tripPlaceId);
      await loadTrip();
    } catch (error) {
      const appError = handleError(error, 'Отметка места');
      showError(appError);
    }
  };

  const handleOpenPlaceDetail = (tripPlaceId: string) => {
    router.push(`/trips/place/${tripPlaceId}?tripId=${id}`);
  };

  const handleMovePlace = async (tripPlaceId: string, direction: 'up' | 'down') => {
    if (!trip) return;

    const currentIndex = tripPlaces.findIndex((tp) => tp.id === tripPlaceId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= tripPlaces.length) return;

    try {
      const orders = tripPlaces.map((tp, index) => ({
        id: tp.id,
        order: index === currentIndex ? newIndex + 1 : index === newIndex ? currentIndex + 1 : index + 1,
      }));

      await tripPlaceService.updateTripPlacesOrder(trip.id, orders);
      await loadTrip();
    } catch (error) {
      const appError = handleError(error, 'Изменение порядка мест');
      showError(appError);
    }
  };

  const handleOpenPlace = (placeId: string) => {
    router.push(`/places/${placeId}`);
  };

  const handleOpenMap = (place: Place) => {
    if (!place.dd) {
      Alert.alert('Ошибка', 'Координаты не указаны');
      return;
    }

    const [latitude, longitude] = place.dd.split(',');
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Ошибка открытия карты:', err);
      Alert.alert('Ошибка', 'Не удалось открыть карту');
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return 'Даты не указаны';
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    return startDate ? `С ${formatDate(startDate)}` : `До ${formatDate(endDate)}`;
  };

  const displayedPlaces =
    viewMode === 'plan'
      ? tripPlaces
      : tripPlaces.filter((tp) => tp.visited);

  const visitedCount = tripPlaces.filter((tp) => tp.visited).length;
  const totalCount = tripPlaces.length;
  const progress = totalCount > 0 ? visitedCount / totalCount : 0;

  if (loading) {
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

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={trip.title} />
        <Appbar.Action icon="pencil" onPress={handleEdit} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="headlineSmall" style={styles.title}>
                {trip.title}
              </Text>
              {trip.current && (
                <Chip icon="airplane" compact style={styles.currentChip}>
                  Текущая
                </Chip>
              )}
            </View>

            {trip.description && (
              <>
                <Divider style={styles.divider} />
                <Text variant="bodyLarge" style={styles.description}>
                  {trip.description}
                </Text>
              </>
            )}

            <Divider style={styles.divider} />
            <Text variant="bodyMedium" style={styles.dates}>
              📅 {formatDateRange(trip.startDate, trip.endDate)}
            </Text>

            {totalCount > 0 && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.progressContainer}>
                  <Text variant="bodyMedium" style={styles.progressLabel}>
                    Прогресс: {visitedCount} из {totalCount} мест
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                  </View>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        <View style={styles.viewModeContainer}>
          <SegmentedButtons
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
            buttons={[
              {
                value: 'plan',
                label: 'План',
                icon: 'map-outline',
              },
              {
                value: 'diary',
                label: 'Дневник',
                icon: 'book-outline',
              },
            ]}
          />
        </View>

        {displayedPlaces.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                {viewMode === 'plan'
                  ? 'В поездке пока нет мест'
                  : 'Нет посещенных мест'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          displayedPlaces.map((tripPlace) => {
            const originalIndex = tripPlaces.findIndex((tp) => tp.id === tripPlace.id);
            return (
            <Card key={tripPlace.id} style={styles.placeCard}>
              <Card.Content>
                <View style={styles.placeHeader}>
                  <View style={styles.placeNumber}>
                    <Text variant="titleMedium" style={styles.placeNumberText}>
                      {tripPlace.order}
                    </Text>
                  </View>
                  <View style={styles.placeInfo}>
                    <Text variant="titleMedium" style={styles.placeName}>
                      {tripPlace.place.name}
                    </Text>
                    {tripPlace.visited && (
                      <Chip icon="check" compact style={styles.visitedChip}>
                        Посещено
                      </Chip>
                    )}
                  </View>
                </View>

                {tripPlace.place.description && (
                  <Text variant="bodyMedium" style={styles.placeDescription}>
                    {tripPlace.place.description}
                  </Text>
                )}

                {tripPlace.visitDate && (
                  <Text variant="bodySmall" style={styles.visitDate}>
                    📅 Посещено: {formatDate(tripPlace.visitDate)}
                  </Text>
                )}

                {tripPlace.notes && (
                  <Text variant="bodySmall" style={styles.notes}>
                    📝 {tripPlace.notes}
                  </Text>
                )}

                <View style={styles.placeActions}>
                  <View style={styles.placeActionsRow}>
                    <Button
                      mode="text"
                      icon="eye"
                      onPress={() => handleOpenPlace(tripPlace.placeId)}
                      compact
                    >
                      Подробнее
                    </Button>
                    {tripPlace.place.dd && (
                      <Button
                        mode="text"
                        icon="map"
                        onPress={() => handleOpenMap(tripPlace.place)}
                        compact
                      >
                        На карте
                      </Button>
                    )}
                    <Button
                      mode="text"
                      icon="pencil"
                      onPress={() => handleOpenPlaceDetail(tripPlace.id)}
                      compact
                    >
                      Редактировать
                    </Button>
                  </View>
                  {viewMode === 'plan' && (
                    <Button
                      mode="outlined"
                      icon="map"
                      onPress={() => router.push(`/trips/map?tripId=${trip?.id}`)}
                      style={styles.mapButton}
                      compact
                    >
                      Показать все места на карте
                    </Button>
                  )}
                  {viewMode === 'plan' && (
                    <View style={styles.orderActions}>
                      <IconButton
                        icon="chevron-up"
                        size={20}
                        disabled={originalIndex === 0}
                        onPress={() => handleMovePlace(tripPlace.id, 'up')}
                      />
                      <IconButton
                        icon="chevron-down"
                        size={20}
                        disabled={originalIndex === tripPlaces.length - 1}
                        onPress={() => handleMovePlace(tripPlace.id, 'down')}
                      />
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
            );
          })
        )}

        <Button
          mode="outlined"
          icon="delete"
          onPress={() => setDeleteDialogVisible(true)}
          style={styles.deleteButton}
          textColor="#d32f2f"
        >
          Удалить поездку
        </Button>
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Удаление поездки</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Вы уверены, что хотите удалить поездку "{trip.title}"?
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
  },
  currentChip: {
    height: 28,
  },
  divider: {
    marginVertical: 12,
  },
  description: {
    marginTop: 8,
    lineHeight: 24,
  },
  dates: {
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6200ee',
  },
  viewModeContainer: {
    marginBottom: 16,
  },
  placeCard: {
    marginBottom: 12,
  },
  placeHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  placeNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeNumberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    marginBottom: 4,
  },
  visitedChip: {
    height: 24,
    marginTop: 4,
  },
  placeDescription: {
    marginTop: 8,
    color: '#666',
  },
  visitDate: {
    marginTop: 8,
    color: '#666',
  },
  notes: {
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  placeActions: {
    marginTop: 12,
  },
  placeActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  mapButton: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  deleteButton: {
    marginTop: 16,
    borderColor: '#d32f2f',
  },
});
