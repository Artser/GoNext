// @ts-check
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Для веб-платформы исключаем нативные модули
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // На веб-платформе заменяем expo-sqlite на пустой модуль
    if (platform === 'web' && moduleName === 'expo-sqlite') {
      return {
        type: 'empty',
      };
    }
    // Используем стандартное разрешение для остальных модулей
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
