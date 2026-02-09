import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Appbar, Card, Text, FAB, Chip, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { tripService } from '../../services/tripService';
import { tripPlaceService } from '../../services/tripPlaceService';
import { Trip } from '../../types';

interface TripWithStats extends Trip {
  placesCount: number;
  visitedCount: number;
}

export default function TripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const allTrips = await tripService.getAllTrips();
      
      // Загружаем статистику по местам для каждой поездки
      const tripsWithStats = await Promise.all(
        allTrips.map(async (trip) => {
          const tripPlaces = await tripPlaceService.getTripPlaces(trip.id);
          const visitedCount = tripPlaces.filter((tp) => tp.visited).length;
          return {
            ...trip,
            placesCount: tripPlaces.length,
            visitedCount,
          };
        })
      );

      // Сортируем: текущая поездка первая, затем по дате создания (новые первыми)
      tripsWithStats.sort((a, b) => {
        if (a.current && !b.current) return -1;
        if (!a.current && b.current) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setTrips(tripsWithStats);
    } catch (error) {
      console.error('Ошибка загрузки поездок:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const handleTripPress = (tripId: string) => {
    router.push(`/trips/${tripId}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
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

  const renderTripItem = ({ item }: { item: TripWithStats }) => {
    const progress = item.placesCount > 0 ? item.visitedCount / item.placesCount : 0;

    return (
      <Card
        style={[styles.card, item.current && styles.currentCard]}
        onPress={() => handleTripPress(item.id)}
        mode="elevated"
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleLarge" style={styles.tripTitle}>
              {item.title}
            </Text>
            {item.current && (
              <Chip icon="airplane" compact style={styles.currentChip}>
                Текущая
              </Chip>
            )}
          </View>

          {item.description && (
            <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.datesContainer}>
            <Text variant="bodySmall" style={styles.dates}>
              📅 {formatDateRange(item.startDate, item.endDate)}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <Text variant="bodySmall" style={styles.stats}>
              📍 Мест: {item.placesCount} | ✅ Посещено: {item.visitedCount}
            </Text>
          </View>

          {item.placesCount > 0 && (
            <View style={styles.progressContainer}>
              <ProgressBar progress={progress} color="#6200ee" style={styles.progressBar} />
              <Text variant="bodySmall" style={styles.progressText}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Поездки" />
        <Appbar.Action icon="plus" onPress={() => router.push('/trips/new')} />
      </Appbar.Header>

      <View style={styles.content}>
        {loading && trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">Загрузка...</Text>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">Нет поездок. Создайте первую поездку!</Text>
          </View>
        ) : (
          <FlatList
            data={trips}
            renderItem={renderTripItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/trips/new')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  currentCard: {
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tripTitle: {
    flex: 1,
    marginRight: 8,
  },
  currentChip: {
    height: 28,
  },
  description: {
    marginTop: 4,
    marginBottom: 8,
    color: '#666',
  },
  datesContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  dates: {
    color: '#666',
  },
  statsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  stats: {
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  progressText: {
    minWidth: 40,
    textAlign: 'right',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
