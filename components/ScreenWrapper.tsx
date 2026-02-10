import React from 'react';
import { ImageBackground, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Компонент-обертка для экранов с фоновым изображением
 */
export default function ScreenWrapper({ children, style }: ScreenWrapperProps) {
  const theme = useTheme();
  // Используем тему из PaperProvider для определения темной темы
  const isDark = theme.dark;

  // В темной теме не показываем фоновое изображение
  if (isDark) {
    return (
      <View style={[styles.container, style]}>
        {children}
      </View>
    );
  }

  // В светлой теме показываем фоновое изображение
  return (
    <ImageBackground
      source={require('../assets/backgrounds/gonext-bg.png')}
      style={[styles.background, style]}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Полупрозрачный белый оверлей для читаемости
  },
});
