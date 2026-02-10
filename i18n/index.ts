import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';
import ru from './locales/ru.json';
import en from './locales/en.json';

// Условный импорт для хранения языка
let AsyncStorage: any = null;
if (Platform.OS === 'web') {
  // Для веб используем localStorage напрямую
  AsyncStorage = {
    getItem: async (key: string) => localStorage.getItem(key),
    setItem: async (key: string, value: string) => localStorage.setItem(key, value),
  };
} else {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    // Fallback на expo-secure-store если AsyncStorage недоступен
    try {
      const SecureStore = require('expo-secure-store');
      AsyncStorage = {
        getItem: async (key: string) => await SecureStore.getItemAsync(key),
        setItem: async (key: string, value: string) => await SecureStore.setItemAsync(key, value),
      };
    } catch (e2) {
      console.warn('Не удалось загрузить хранилище для языка:', e2);
    }
  }
}

const LANGUAGE_STORAGE_KEY = 'gonext_language';

const resources = {
  ru: {
    translation: ru,
  },
  en: {
    translation: en,
  },
};

// Определяем язык по умолчанию
const getDefaultLanguage = async (): Promise<string> => {
  try {
    if (AsyncStorage) {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'en')) {
        return savedLanguage;
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки языка:', error);
  }
  
  // По умолчанию русский
  return 'ru';
};

// Инициализация i18next
let isInitialized = false;

const initI18n = async () => {
  if (isInitialized) return;
  
  try {
    const defaultLanguage = await getDefaultLanguage();

    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: defaultLanguage,
        fallbackLng: 'ru',
        compatibilityJSON: 'v3',
        interpolation: {
          escapeValue: false, // React уже экранирует значения
        },
      });
    
    isInitialized = true;
  } catch (error) {
    console.error('Ошибка инициализации i18n:', error);
    // Инициализируем с русским языком по умолчанию в случае ошибки
    i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: 'ru',
        fallbackLng: 'ru',
        compatibilityJSON: 'v3',
        interpolation: {
          escapeValue: false,
        },
      });
    isInitialized = true;
  }
};

// Функция для изменения языка
export const changeLanguage = async (language: 'ru' | 'en') => {
  try {
    await i18n.changeLanguage(language);
    if (AsyncStorage) {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  } catch (error) {
    console.error('Ошибка изменения языка:', error);
  }
};

// Инициализируем при загрузке модуля
initI18n();

export default i18n;
