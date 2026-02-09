import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  Button,
  Chip,
  ProgressBar,
  IconButton,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { tripService } from '../services/tripService';
import { tripPlaceService } from '../services/tripPlaceService';
import { Trip, TripPlace, Place } from '../types';
import { handleError, showError } from '../utils/errorHandler';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';

export default function NextPlaceScreen() {
  const router = useRouter();
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [nextPlace, setNextPlace] = useState<(TripPlace & { place: Place }) | null>(null);
  const [allTripPlaces, setAllTripPlaces] = useState<(TripPlace & { place: Place })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    loadNextPlace();
  }, []);

  useEffect(() => {
    if (nextPlace?.place.dd && currentLocation) {
      calculateDistance();
    }
  }, [nextPlace, currentLocation]);

  const loadNextPlace = async () => {
    try {
      setLoading(true);
      
      // Получаем текущую поездку
      const trip = await tripService.getCurrentTrip();
      
      if (!trip) {
        setCurrentTrip(null);
        setNextPlace(null);
        setAllTripPlaces([]);
        return;
      }

      setCurrentTrip(trip);

      // Получаем все места в поездке
      const tripPlaces = await tripPlaceService.getTripPlaces(trip.id);
      setAllTripPlaces(tripPlaces);

      // Находим следующее место
      const next = await tripPlaceService.getNextPlace(trip.id);
      setNextPlace(next);

      // Получаем текущее местоположение для расчета расстояния
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            lat: location.coords.latitude,
            lon: location.coords.longitude,
          });
        }
      } catch (error) {
        console.log('Не удалось получить местоположение:', error);
      }
    } catch (error) {
      handleError(error, 'Загрузка следующего места');
      // Не показываем ошибку пользователю, так как это не критично
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNextPlace();
    setRefreshing(false);
  };

  const calculateDistance = () => {
    if (!nextPlace?.place.dd || !currentLocation) return;

    try {
      const [lat, lon] = nextPlace.place.dd.split(',').map(Number);
      
      // Формула гаверсинуса для расчета расстояния
      const R = 6371; // Радиус Земли в километрах
      const dLat = ((lat - currentLocation.lat) * Math.PI) / 180;
      const dLon = ((lon - currentLocation.lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((currentLocation.lat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const calculatedDistance = R * c;

      setDistance(calculatedDistance);
    } catch (error) {
      console.error('Ошибка расчета расстояния:', error);
    }
  };

  const handleMarkAsVisited = async () => {
    if (!nextPlace) return;

    try {
      await tripPlaceService.markAsVisited(nextPlace.id);
      Alert.alert('Успешно', 'Место отмечено как посещенное');
      await loadNextPlace();
    } catch (error) {
      console.error('Ошибка отметки места:', error);
      Alert.alert('Ошибка', 'Не удалось отметить место');
    }
  };

  const handleOpenMap = () => {
    if (!nextPlace?.place.dd) {
      Alert.alert('Ошибка', 'Координаты не указаны');
      return;
    }

    const [latitude, longitude] = nextPlace.place.dd.split(',');
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      const appError = handleError(err, 'Открытие карты');
      showError(appError);
    });
  };

  const handleOpenNavigator = () => {
    if (!nextPlace?.place.dd) {
      Alert.alert('Ошибка', 'Координаты не указаны');
      return;
    }

    const [latitude, longitude] = nextPlace.place.dd.split(',');
    const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Ошибка открытия навигатора:', err);
      Alert.alert('Ошибка', 'Не удалось открыть навигатор');
    });
  };

  const handleOpenPlaceDetail = () => {
    if (nextPlace) {
      router.push(`/places/${nextPlace.placeId}`);
    }
  };

  const handleOpenTripDetail = () => {
    if (currentTrip) {
      router.push(`/trips/${currentTrip.id}`);
    }
  };

  const visitedCount = allTripPlaces.filter((tp) => tp.visited).length;
  const totalCount = allTripPlaces.length;
  const progress = totalCount > 0 ? visitedCount / totalCount : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Следующее место" />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <Text variant="bodyLarge">Загрузка...</Text>
        </View>
      </View>
    );
  }

  // Нет активной поездки
  if (!currentTrip) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Следующее место" />
        </Appbar.Header>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                Нет активной поездки
              </Text>
              <Text variant="bodyLarge" style={styles.emptyText}>
                Создайте поездку и отметьте её как текущую, чтобы увидеть следующее место.
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push('/trips/new')}
                style={styles.actionButton}
              >
                Создать поездку
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    );
  }

  // Все места посещены
  if (!nextPlace) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Следующее место" />
          <Appbar.Action icon="refresh" onPress={onRefresh} />
        </Appbar.Header>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                🎉 Все места посещены!
              </Text>
              <Text variant="bodyLarge" style={styles.emptyText}>
                Поздравляем! Вы посетили все места в поездке "{currentTrip.title}".
              </Text>
              {totalCount > 0 && (
                <View style={styles.progressContainer}>
                  <Text variant="bodyMedium" style={styles.progressLabel}>
                    Прогресс: {visitedCount} из {totalCount} мест
                  </Text>
                  <ProgressBar progress={1} color="#4caf50" style={styles.progressBar} />
                </View>
              )}
              <Button
                mode="contained"
                onPress={handleOpenTripDetail}
                style={styles.actionButton}
              >
                Посмотреть поездку
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    );
  }

  // Есть следующее место
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Следующее место" />
        <Appbar.Action icon="refresh" onPress={onRefresh} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Информация о поездке */}
        <Card style={styles.card} onPress={handleOpenTripDetail}>
          <Card.Content>
            <View style={styles.tripHeader}>
              <Text variant="titleMedium" style={styles.tripTitle}>
                {currentTrip.title}
              </Text>
              <Chip icon="airplane" compact>
                Текущая
              </Chip>
            </View>
            {totalCount > 0 && (
              <View style={styles.progressContainer}>
                <Text variant="bodySmall" style={styles.progressLabel}>
                  Место {nextPlace.order} из {totalCount}
                </Text>
                <ProgressBar progress={progress} color="#6200ee" style={styles.progressBar} />
                <Text variant="bodySmall" style={styles.progressText}>
                  {visitedCount} из {totalCount} посещено
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Информация о следующем месте */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.placeHeader}>
              <View style={styles.placeNumber}>
                <Text variant="headlineMedium" style={styles.placeNumberText}>
                  {nextPlace.order}
                </Text>
              </View>
              <View style={styles.placeInfo}>
                <Text variant="headlineSmall" style={styles.placeName}>
                  {nextPlace.place.name}
                </Text>
                <Text variant="bodyMedium" style={styles.nextLabel}>
                  Следующее место
                </Text>
              </View>
            </View>

            {nextPlace.place.description && (
              <Text variant="bodyLarge" style={styles.description}>
                {nextPlace.place.description}
              </Text>
            )}

            {nextPlace.place.dd && (
              <View style={styles.coordinatesContainer}>
                <Text variant="bodyMedium" style={styles.coordinatesLabel}>
                  📍 Координаты:
                </Text>
                <Text variant="bodySmall" style={styles.coordinates}>
                  {nextPlace.place.dd}
                </Text>
                {distance !== null && (
                  <Text variant="bodyMedium" style={styles.distance}>
                    📏 Расстояние: {distance.toFixed(1)} км
                  </Text>
                )}
              </View>
            )}

            {nextPlace.place.visitlater && (
              <Chip icon="clock-outline" style={styles.chip}>
                Хочу посетить
              </Chip>
            )}
            {nextPlace.place.liked && (
              <Chip icon="heart" style={styles.chip}>
                Понравилось
              </Chip>
            )}
          </Card.Content>
        </Card>

        {/* Действия */}
        <View style={styles.actionsContainer}>
          {nextPlace.place.dd && (
            <>
              <Button
                mode="contained"
                icon="map"
                onPress={handleOpenMap}
                style={styles.actionButton}
              >
                Открыть на карте
              </Button>
              <Button
                mode="contained"
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
            icon="eye"
            onPress={handleOpenPlaceDetail}
            style={styles.actionButton}
          >
            Подробнее о месте
          </Button>
          <Button
            mode="contained"
            icon="check-circle"
            onPress={handleMarkAsVisited}
            style={[styles.actionButton, styles.markButton]}
            buttonColor="#4caf50"
          >
            Отметить как посещенное
          </Button>
        </View>
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
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripTitle: {
    flex: 1,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    marginBottom: 4,
    color: '#666',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressText: {
    color: '#666',
    textAlign: 'right',
  },
  placeHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  placeNumber: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  nextLabel: {
    color: '#6200ee',
    fontWeight: '600',
  },
  description: {
    marginTop: 8,
    marginBottom: 16,
    color: '#666',
    lineHeight: 24,
  },
  coordinatesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  coordinatesLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  coordinates: {
    fontFamily: 'monospace',
    color: '#666',
    marginBottom: 8,
  },
  distance: {
    marginTop: 8,
    color: '#6200ee',
    fontWeight: '600',
  },
  chip: {
    marginTop: 8,
    marginRight: 8,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  markButton: {
    marginTop: 8,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
});
