import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { databaseService } from '../services/database';
import { photoService } from '../services/photoService';

export default function RootLayout() {
  useEffect(() => {
    // Инициализация базы данных и директории для фотографий при запуске приложения
    const initApp = async () => {
      try {
        await databaseService.initialize();
        await photoService.initializeDirectory();
        console.log('Приложение инициализировано');
      } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
      }
    };

    initApp();

    // Очистка при размонтировании
    return () => {
      databaseService.close().catch(console.error);
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
