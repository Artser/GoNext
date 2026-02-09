import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Card, Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView from '../../components/MapView';
import { tripPlaceService } from '../../services/tripPlaceService';
import { TripPlace, Place } from '../../types';

export default function TripMapScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [tripPlaces, setTripPlaces] = useState<(TripPlace & { place: Place })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTripPlaces();
  }, [tripId]);

  const loadTripPlaces = async () => {
    try {
      if (tripId) {
        const places = await tripPlaceService.getTripPlaces(tripId);
        setTripPlaces(places.filter((tp) => tp.place.dd));
      }
    } catch (error) {
      console.error('Ошибка загрузки мест поездки:', error);
    } finally {
      setLoading(false);
    }
  };

  const placesForMap = tripPlaces
    .filter((tp) => tp.place.dd)
    .map((tp) => {
      const [lat, lon] = tp.place.dd!.split(',').map(Number);
      return {
        id: tp.id,
        name: `${tp.order}. ${tp.place.name}`,
        latitude: lat,
        longitude: lon,
      };
    });

  const centerLat =
    placesForMap.length > 0
      ? placesForMap.reduce((sum, p) => sum + p.latitude, 0) / placesForMap.length
      : 55.7558;
  const centerLon =
    placesForMap.length > 0
      ? placesForMap.reduce((sum, p) => sum + p.longitude, 0) / placesForMap.length
      : 37.6173;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Карта поездки" />
      </Appbar.Header>

      <View style={styles.content}>
        {placesForMap.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                Нет мест с координатами для отображения на карте
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            <Card style={styles.infoCard}>
              <Card.Content>
                <Text variant="bodyMedium">
                  На карте отмечено {placesForMap.length} мест из {tripPlaces.length}
                </Text>
              </Card.Content>
            </Card>
            <MapView
              latitude={centerLat}
              longitude={centerLon}
              places={placesForMap}
              editable={false}
            />
          </>
        )}
      </View>
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
  card: {
    margin: 16,
  },
  infoCard: {
    margin: 16,
    marginBottom: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
});
