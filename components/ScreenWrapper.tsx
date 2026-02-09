import React from 'react';
import { ImageBackground, StyleSheet, View, ViewStyle } from 'react-native';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Компонент-обертка для экранов с фоновым изображением
 */
export default function ScreenWrapper({ children, style }: ScreenWrapperProps) {
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
