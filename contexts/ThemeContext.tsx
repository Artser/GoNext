import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper';

const THEME_STORAGE_KEY = 'gonext_theme_preference';
const PRIMARY_COLOR_STORAGE_KEY = 'gonext_primary_color';

// Условный импорт SecureStore только для мобильных платформ
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.warn('Не удалось загрузить expo-secure-store:', e);
  }
}

type ThemeMode = 'light' | 'dark' | 'auto';

// Предопределенные цвета для выбора
export const PRIMARY_COLORS = [
  { name: 'Фиолетовый', value: '#6200ee' },
  { name: 'Синий', value: '#2196F3' },
  { name: 'Голубой', value: '#03A9F4' },
  { name: 'Зеленый', value: '#4CAF50' },
  { name: 'Бирюзовый', value: '#009688' },
  { name: 'Оранжевый', value: '#FF9800' },
  { name: 'Красный', value: '#F44336' },
  { name: 'Розовый', value: '#E91E63' },
  { name: 'Коричневый', value: '#795548' },
  { name: 'Серый', value: '#607D8B' },
];

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [primaryColor, setPrimaryColorState] = useState<string>(PRIMARY_COLORS[0].value);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Загружаем сохраненную тему и цвет
    const loadTheme = async () => {
      try {
        let savedTheme: ThemeMode | null = null;
        let savedColor: string | null = null;

        if (Platform.OS === 'web') {
          savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
          savedColor = localStorage.getItem(PRIMARY_COLOR_STORAGE_KEY);
        } else {
          savedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY) as ThemeMode | null;
          savedColor = await SecureStore.getItemAsync(PRIMARY_COLOR_STORAGE_KEY);
        }

        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
          setThemeModeState(savedTheme);
        }

        if (savedColor && PRIMARY_COLORS.some(c => c.value === savedColor)) {
          setPrimaryColorState(savedColor);
        }
      } catch (error) {
        console.error('Ошибка загрузки темы:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      } else {
        await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
      }
    } catch (error) {
      console.error('Ошибка сохранения темы:', error);
    }
  };

  const setPrimaryColor = async (color: string) => {
    setPrimaryColorState(color);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(PRIMARY_COLOR_STORAGE_KEY, color);
      } else {
        await SecureStore.setItemAsync(PRIMARY_COLOR_STORAGE_KEY, color);
      }
    } catch (error) {
      console.error('Ошибка сохранения цвета:', error);
    }
  };

  const isDark = themeMode === 'auto' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  // Применяем выбранный основной цвет к темам
  const currentLightTheme = {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      primary: primaryColor,
    },
  };

  const currentDarkTheme = {
    ...darkTheme,
    colors: {
      ...darkTheme.colors,
      primary: primaryColor,
    },
  };

  const theme = isDark ? currentDarkTheme : currentLightTheme;

  if (!isLoaded) {
    // Показываем светлую тему по умолчанию пока загружается
    return (
      <PaperProvider theme={currentLightTheme}>
        {children}
      </PaperProvider>
    );
  }

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, primaryColor, setPrimaryColor }}>
      <PaperProvider theme={theme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
