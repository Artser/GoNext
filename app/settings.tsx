import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  List,
  Divider,
  Button,
  Portal,
  Dialog,
  SegmentedButtons,
  useTheme,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { databaseService } from '../services/database';
import { tripService } from '../services/tripService';
import { placeService } from '../services/placeService';
import { APP_NAME } from '../constants';
import ScreenWrapper from '../components/ScreenWrapper';
import { useThemeContext, PRIMARY_COLORS } from '../contexts/ThemeContext';
import { changeLanguage } from '../i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { themeMode, setThemeMode, primaryColor, setPrimaryColor } = useThemeContext();
  const [stats, setStats] = useState({
    placesCount: 0,
    tripsCount: 0,
  });
  const [clearDataDialogVisible, setClearDataDialogVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'ru' | 'en'>(i18n.language as 'ru' | 'en');

  useEffect(() => {
    loadStats();
    setCurrentLanguage(i18n.language as 'ru' | 'en');
  }, [i18n.language]);

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
      Alert.alert(t('common.success'), t('settings.dataCleared'));
      await loadStats();
    } catch (error) {
      console.error('Ошибка удаления данных:', error);
      Alert.alert(t('common.error'), t('errors.generic'));
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('settings.title')} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Информация о приложении */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={[styles.appName, { color: theme.colors.primary }]}>
              {APP_NAME}
            </Text>
            <Text variant="bodyMedium" style={styles.appDescription}>
              {t('app.subtitle')}
            </Text>
            <Text variant="bodySmall" style={styles.appVersion}>
              {t('settings.version')} 1.0.0
            </Text>
          </Card.Content>
        </Card>

        {/* Тема */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.theme')}
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              {t('settings.theme')}
            </Text>
            <SegmentedButtons
              value={themeMode}
              onValueChange={(value) => setThemeMode(value as 'light' | 'dark' | 'auto')}
              buttons={[
                {
                  value: 'light',
                  label: t('settings.themeLight'),
                  icon: 'weather-sunny',
                },
                {
                  value: 'dark',
                  label: t('settings.themeDark'),
                  icon: 'weather-night',
                },
                {
                  value: 'auto',
                  label: t('settings.themeAuto'),
                  icon: 'theme-light-dark',
                },
              ]}
              style={styles.themeButtons}
            />
            <Text variant="bodySmall" style={styles.themeHint}>
              {t('settings.themeHint')}
            </Text>
          </Card.Content>
        </Card>

        {/* Язык */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.language')}
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              {t('settings.language')}
            </Text>
            <SegmentedButtons
              value={currentLanguage}
              onValueChange={async (value) => {
                const lang = value as 'ru' | 'en';
                await changeLanguage(lang);
                setCurrentLanguage(lang);
              }}
              buttons={[
                {
                  value: 'ru',
                  label: t('settings.languageRussian'),
                  icon: 'translate',
                },
                {
                  value: 'en',
                  label: t('settings.languageEnglish'),
                  icon: 'translate',
                },
              ]}
              style={styles.themeButtons}
            />
          </Card.Content>
        </Card>

        {/* Основной цвет */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.primaryColor')}
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              {t('settings.primaryColorSubtitle')}
            </Text>
            <View style={styles.colorPicker}>
              {PRIMARY_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color.value },
                    primaryColor === color.value && styles.colorCircleSelected,
                  ]}
                  onPress={() => setPrimaryColor(color.value)}
                  activeOpacity={0.7}
                >
                  {primaryColor === color.value && (
                    <View style={styles.colorCheckmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text variant="bodySmall" style={styles.colorHint}>
              {t('settings.selectedColor')}: {PRIMARY_COLORS.find(c => c.value === primaryColor)?.name || 'Фиолетовый'}
            </Text>
          </Card.Content>
        </Card>

        {/* Статистика */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.statistics')}
            </Text>
            <List.Item
              title={t('settings.placesCount')}
              description={`${stats.placesCount} ${t('settings.placesCount').toLowerCase()}`}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
            />
            <Divider />
            <List.Item
              title={t('settings.tripsCount')}
              description={`${stats.tripsCount} ${t('settings.tripsCount').toLowerCase()}`}
              left={(props) => <List.Icon {...props} icon="airplane" />}
            />
          </Card.Content>
        </Card>

        {/* Данные */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.dataManagement')}
            </Text>
            <List.Item
              title={t('settings.clearData')}
              description={t('settings.clearDataDescription')}
              left={(props) => <List.Icon {...props} icon="delete" />}
              onPress={() => setClearDataDialogVisible(true)}
            />
          </Card.Content>
        </Card>

        {/* О приложении */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.appInfo')}
            </Text>
            <Text variant="bodyMedium" style={styles.aboutText}>
              {t('settings.appDescription')}
            </Text>
          </Card.Content>
        </Card>

      </ScrollView>

      {/* Диалог подтверждения удаления данных */}
      <Portal>
        <Dialog
          visible={clearDataDialogVisible}
          onDismiss={() => setClearDataDialogVisible(false)}
        >
          <Dialog.Title>{t('settings.clearDataConfirm')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {t('settings.clearDataConfirmMessage')}
            </Text>
            <Text variant="bodySmall" style={styles.warningText}>
              {t('settings.placesCount')}: {stats.placesCount}
            </Text>
            <Text variant="bodySmall" style={styles.warningText}>
              {t('settings.tripsCount')}: {stats.tripsCount}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDataDialogVisible(false)}>{t('common.cancel')}</Button>
            <Button onPress={handleClearAllData} textColor="#d32f2f">
              {t('common.delete')}
            </Button>
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
  appName: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
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
  sectionSubtitle: {
    marginBottom: 12,
    color: '#666',
  },
  themeButtons: {
    marginTop: 8,
    marginBottom: 8,
  },
  themeHint: {
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#000',
    elevation: 4,
    shadowOpacity: 0.4,
  },
  colorCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  colorHint: {
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
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
