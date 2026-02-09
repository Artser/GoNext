import { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Linking } from 'react-native';
import { Button, Card, Text, ActivityIndicator } from 'react-native-paper';
import * as Location from 'expo-location';

// Условный импорт WebView только для мобильных платформ
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('Не удалось загрузить react-native-webview:', e);
  }
}

interface MapViewProps {
  latitude: number;
  longitude: number;
  onCoordinateSelect?: (latitude: number, longitude: number) => void;
  editable?: boolean;
  places?: Array<{ id: string; name: string; latitude: number; longitude: number }>;
}

export default function MapView({
  latitude,
  longitude,
  onCoordinateSelect,
  editable = false,
  places = [],
}: MapViewProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
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
  };

  const generateMapHTML = () => {
    const markers = places
      .map(
        (place) => `
      L.marker([${place.latitude}, ${place.longitude}])
        .addTo(map)
        .bindPopup("${place.name.replace(/"/g, '\\"')}")
        .openPopup();
    `
      )
      .join('');

    const currentMarker = currentLocation
      ? `
      L.marker([${currentLocation.lat}, ${currentLocation.lon}], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      })
        .addTo(map)
        .bindPopup("Ваше местоположение");
    `
      : '';

    const clickHandler = editable
      ? `
      map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'coordinate',
          latitude: lat,
          longitude: lng
        }));
        
        // Удаляем предыдущий маркер выбора
        if (selectedMarker) {
          map.removeLayer(selectedMarker);
        }
        
        // Добавляем новый маркер
        selectedMarker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          }),
          draggable: true
        })
          .addTo(map)
          .bindPopup("Выбранное место")
          .openPopup();
        
        selectedMarker.on('dragend', function(e) {
          const lat = e.target.getLatLng().lat;
          const lng = e.target.getLatLng().lng;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'coordinate',
            latitude: lat,
            longitude: lng
          }));
        });
      });
    `
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100%; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            let map;
            let selectedMarker = null;
            
            function initMap() {
              map = L.map('map').setView([${latitude}, ${longitude}], ${places.length > 0 ? 12 : 15});
              
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
              }).addTo(map);
              
              ${markers}
              ${currentMarker}
              ${clickHandler}
            }
            
            initMap();
          </script>
        </body>
      </html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'coordinate' && onCoordinateSelect) {
        onCoordinateSelect(data.latitude, data.longitude);
      }
    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
    }
  };

  const handleOpenInMaps = () => {
    const url =
      Platform.OS === 'ios'
        ? `maps://maps.apple.com/?q=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Ошибка открытия карты:', err);
    });
  };

  // На веб-платформе используем iframe
  if (Platform.OS === 'web') {
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
    
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.mapContainer}>
              <iframe
                src={mapUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Карта"
              />
            </View>
            <View style={styles.actions}>
              <Button 
                mode="outlined" 
                icon="map" 
                onPress={() => {
                  const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;
                  window.open(url, '_blank');
                }}
              >
                Открыть в OpenStreetMap
              </Button>
              {editable && (
                <Text variant="bodySmall" style={styles.hint}>
                  На веб-платформе выбор координат на карте недоступен. Используйте мобильное приложение для полной функциональности.
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  }

  // На мобильных платформах используем WebView
  if (!WebView) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.mapContainer}>
              <View style={styles.loadingOverlay}>
                <Text variant="bodyLarge">WebView недоступен</Text>
                <Button 
                  mode="contained" 
                  icon="map" 
                  onPress={handleOpenInMaps}
                  style={{ marginTop: 16 }}
                >
                  Открыть в картах
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.mapContainer}>
            <WebView
              source={{ html: generateMapHTML() }}
              style={styles.webview}
              onLoadEnd={() => setLoading(false)}
              onMessage={handleMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" />
              </View>
            )}
          </View>
          <View style={styles.actions}>
            <Button mode="outlined" icon="map" onPress={handleOpenInMaps}>
              Открыть в картах
            </Button>
            {editable && (
              <Text variant="bodySmall" style={styles.hint}>
                Нажмите на карту, чтобы выбрать координаты
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
  },
  cardContent: {
    padding: 0,
    flex: 1,
  },
  mapContainer: {
    height: 400,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  actions: {
    padding: 16,
  },
  hint: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
});
