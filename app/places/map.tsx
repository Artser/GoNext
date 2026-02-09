import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView from '../../components/MapView';
import * as Location from 'expo-location';
import ScreenWrapper from '../../components/ScreenWrapper';

export default function PlaceMapScreen() {
  const router = useRouter();
  const { latitude, longitude, editable } = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
    editable?: string;
  }>;

  const [selectedLat, setSelectedLat] = useState<number>(
    latitude ? parseFloat(latitude) : 55.7558
  );
  const [selectedLon, setSelectedLon] = useState<number>(
    longitude ? parseFloat(longitude) : 37.6173
  );

  const isEditable = editable === 'true';

  const handleCoordinateSelect = (lat: number, lon: number) => {
    setSelectedLat(lat);
    setSelectedLon(lon);
  };

  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setSelectedLat(location.coords.latitude);
      setSelectedLon(location.coords.longitude);
    } catch (error) {
      console.error('Ошибка получения местоположения:', error);
    }
  };

  const handleSave = () => {
    // Используем router.setParams для передачи координат обратно
    router.setParams({
      selectedLat: selectedLat.toString(),
      selectedLon: selectedLon.toString(),
    });
    router.back();
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={isEditable ? 'Выбор координат' : 'Карта'} />
          {isEditable && (
            <Appbar.Action icon="crosshairs-gps" onPress={handleGetCurrentLocation} />
          )}
        </Appbar.Header>

        <View style={styles.content}>
          <MapView
            latitude={selectedLat}
            longitude={selectedLon}
            onCoordinateSelect={handleCoordinateSelect}
            editable={isEditable}
          />

          {isEditable && (
            <View style={styles.footer}>
              <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
                Использовать координаты: {selectedLat.toFixed(6)}, {selectedLon.toFixed(6)}
              </Button>
            </View>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    marginTop: 8,
  },
});
