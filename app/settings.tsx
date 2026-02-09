import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  List,
  Divider,
  Button,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { databaseService } from '../services/database';
import { tripService } from '../services/tripService';
import { placeService } from '../services/placeService';
import { APP_NAME } from '../constants';

export default function SettingsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    placesCount: 0,
    tripsCount: 0,
  });
  const [clearDataDialogVisible, setClearDataDialogVisible] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [places, trips] = await Promise.all([
        placeService.getAllPlaces(),
        tripService.getAllTrips(),
      ]);

      setStats({
        placesCount: places.length,
        tripsCount: trips.length,
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const handleClearAllData = async () => {
    try {
      // Удаляем все данные из таблиц
      const db = databaseService.getDatabase();
      await db.execAsync(`
        DELETE FROM place_photos;
        DELETE FROM trip_places;
        DELETE FROM trips;
        DELETE FROM places;
      `);

      setClearDataDialogVisible(false);
      Alert.alert('Успешно', 'Все данные удалены');
      await loadStats();
    } catch (error) {
      console.error('Ошибка удаления данных:', error);
      Alert.alert('Ошибка', 'Не удалось удалить данные');
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Настройки" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Информация о приложении */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.appName}>
              {APP_NAME}
            </Text>
            <Text variant="bodyMedium" style={styles.appDescription}>
              Дневник туриста
            </Text>
            <Text variant="bodySmall" style={styles.appVersion}>
              Версия 1.0.0
            </Text>
          </Card.Content>
        </Card>

        {/* Статистика */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Статистика
            </Text>
            <List.Item
              title="Мест в коллекции"
              description={`${stats.placesCount} мест`}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
            />
            <Divider />
            <List.Item
              title="Поездок создано"
              description={`${stats.tripsCount} поездок`}
              left={(props) => <List.Icon {...props} icon="airplane" />}
            />
          </Card.Content>
        </Card>

        {/* Данные */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Данные
            </Text>
            <List.Item
              title="Очистить все данные"
              description="Удалить все места, поездки и связанные данные"
              left={(props) => <List.Icon {...props} icon="delete" />}
              onPress={() => setClearDataDialogVisible(true)}
            />
          </Card.Content>
        </Card>

        {/* О приложении */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              О приложении
            </Text>
            <Text variant="bodyMedium" style={styles.aboutText}>
              {APP_NAME} — мобильное приложение для планирования поездок и ведения дневника путешествий.
            </Text>
            <Text variant="bodyMedium" style={styles.aboutText}>
              Все данные хранятся локально на вашем устройстве и не передаются на серверы.
            </Text>
            <Text variant="bodySmall" style={styles.aboutText}>
              Приложение работает полностью офлайн и не требует регистрации.
            </Text>
          </Card.Content>
        </Card>

        {/* Функции */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Функции
            </Text>
            <List.Item
              title="Хранение мест"
              description="Создавайте коллекцию интересных мест"
              left={(props) => <List.Icon {...props} icon="map-marker" />}
            />
            <Divider />
            <List.Item
              title="Планирование поездок"
              description="Создавайте маршруты с датами и местами"
              left={(props) => <List.Icon {...props} icon="airplane" />}
            />
            <Divider />
            <List.Item
              title="Дневник путешествий"
              description="Отмечайте посещенные места и добавляйте заметки"
              left={(props) => <List.Icon {...props} icon="book" />}
            />
            <Divider />
            <List.Item
              title="Следующее место"
              description="Быстрый доступ к следующему месту в маршруте"
              left={(props) => <List.Icon {...props} icon="arrow-right-circle" />}
            />
            <Divider />
            <List.Item
              title="Интеграция с картами"
              description="Открывайте места в картах и навигаторе"
              left={(props) => <List.Icon {...props} icon="map" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Диалог подтверждения удаления данных */}
      <Portal>
        <Dialog
          visible={clearDataDialogVisible}
          onDismiss={() => setClearDataDialogVisible(false)}
        >
          <Dialog.Title>Удаление всех данных</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.
            </Text>
            <Text variant="bodySmall" style={styles.warningText}>
              Будет удалено:
            </Text>
            <Text variant="bodySmall" style={styles.warningText}>
              • Все места ({stats.placesCount})
            </Text>
            <Text variant="bodySmall" style={styles.warningText}>
              • Все поездки ({stats.tripsCount})
            </Text>
            <Text variant="bodySmall" style={styles.warningText}>
              • Все фотографии и заметки
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDataDialogVisible(false)}>Отмена</Button>
            <Button onPress={handleClearAllData} textColor="#d32f2f">
              Удалить все
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
  card: {
    marginBottom: 16,
  },
  appName: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  appDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 4,
  },
  appVersion: {
    textAlign: 'center',
    color: '#999',
  },
  sectionTitle: {
    marginBottom: 8,
  },
  aboutText: {
    marginBottom: 12,
    lineHeight: 22,
    color: '#666',
  },
  warningText: {
    marginTop: 4,
    color: '#d32f2f',
  },
});
