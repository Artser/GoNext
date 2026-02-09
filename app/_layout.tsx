import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { databaseService } from '../services/database';
import { photoService } from '../services/photoService';

export default function RootLayout() {
  useEffect(() => {
    // Инициализация базы данных и директории для фотографий при запуске приложения
    const initApp = async () => {
      try {
        // SQLite работает только на мобильных платформах
        if (Platform.OS !== 'web') {
          await databaseService.initialize();
          await photoService.initializeDirectory();
          console.log('Приложение инициализировано');
        } else {
          console.warn('Веб-версия: SQLite не поддерживается. Используйте мобильное приложение для полной функциональности.');
        }
      } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
      }
    };

    initApp();

    // Очистка при размонтировании
    return () => {
      if (Platform.OS !== 'web') {
        databaseService.close().catch(console.error);
      }
    };
  }, []);

  return (
    <PaperProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="places" options={{ headerShown: false }} />
        <Stack.Screen name="trips" options={{ headerShown: false }} />
        <Stack.Screen name="next-place" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}
