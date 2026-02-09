import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Appbar, Button, Card, Text, Chip, Divider, Banner } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { tripService } from '../services/tripService';
import { placeService } from '../services/placeService';
import { tripPlaceService } from '../services/tripPlaceService';

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    placesCount: 0,
    tripsCount: 0,
    currentTrip: null as { title: string; placesCount: number; visitedCount: number } | null,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [places, trips, currentTrip] = await Promise.all([
        placeService.getAllPlaces(),
        tripService.getAllTrips(),
        tripService.getCurrentTrip(),
      ]);

      let currentTripStats = null;
      if (currentTrip) {
        const tripPlaces = await tripPlaceService.getTripPlaces(currentTrip.id);
        currentTripStats = {
          title: currentTrip.title,
          placesCount: tripPlaces.length,
          visitedCount: tripPlaces.filter((tp) => tp.visited).length,
        };
      }

      setStats({
        placesCount: places.length,
        tripsCount: trips.length,
        currentTrip: currentTripStats,
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="GoNext" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {Platform.OS === 'web' && (
          <Banner
            visible={true}
            actions={[]}
            icon="information"
            style={styles.banner}
          >
            Веб-версия имеет ограниченную функциональность. Для полной работы используйте мобильное приложение (Android/iOS).
          </Banner>
        )}

        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Дневник туриста
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Планируйте поездки и ведите дневник путешествий
            </Text>
          </Card.Content>
        </Card>

        {/* Статистика */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Статистика
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {stats.placesCount}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Мест
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {stats.tripsCount}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Поездок
                </Text>
              </View>
            </View>

            {stats.currentTrip && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.currentTripInfo}>
                  <Text variant="bodyMedium" style={styles.currentTripLabel}>
                    Текущая поездка:
                  </Text>
                  <Text variant="titleSmall" style={styles.currentTripTitle}>
                    {stats.currentTrip.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.currentTripProgress}>
                    Посещено: {stats.currentTrip.visitedCount} из {stats.currentTrip.placesCount}
                  </Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Навигационные кнопки */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Навигация
            </Text>
            <View style={styles.buttonsContainer}>
              <Button
                mode="contained"
                onPress={() => router.push('/places')}
                style={styles.button}
                icon="map-marker"
                contentStyle={styles.buttonContent}
              >
                Места
              </Button>

              <Button
                mode="contained"
                onPress={() => router.push('/trips')}
                style={styles.button}
                icon="airplane"
                contentStyle={styles.buttonContent}
              >
                Поездки
              </Button>

              <Button
                mode="contained"
                onPress={() => router.push('/next-place')}
                style={styles.button}
                icon="arrow-right-circle"
                contentStyle={styles.buttonContent}
                buttonColor={stats.currentTrip ? '#6200ee' : '#999'}
              >
                Следующее место
              </Button>

              <Button
                mode="outlined"
                onPress={() => router.push('/settings')}
                style={styles.button}
                icon="cog"
                contentStyle={styles.buttonContent}
              >
                Настройки
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Быстрые действия */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Быстрые действия
            </Text>
            <View style={styles.quickActionsContainer}>
              <Button
                mode="outlined"
                onPress={() => router.push('/places/new')}
                style={styles.quickActionButton}
                icon="plus"
                compact
              >
                Новое место
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.push('/trips/new')}
                style={styles.quickActionButton}
                icon="plus"
                compact
              >
                Новая поездка
              </Button>
            </View>
          </Card.Content>
        </Card>
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
    padding: 20,
  },
  banner: {
    marginBottom: 20,
  },
  welcomeCard: {
    marginBottom: 20,
    backgroundColor: '#6200ee',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#fff',
  },
  subtitle: {
    textAlign: 'center',
    color: '#fff',
    opacity: 0.9,
  },
  card: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  divider: {
    marginVertical: 16,
  },
  currentTripInfo: {
    marginTop: 8,
  },
  currentTripLabel: {
    color: '#666',
    marginBottom: 4,
  },
  currentTripTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  currentTripProgress: {
    color: '#666',
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
  },
});
