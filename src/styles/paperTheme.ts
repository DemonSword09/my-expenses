// src/styles/paperTheme.ts
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { ColorSchemeName } from 'react-native';
import { MD3Theme } from 'react-native-paper/lib/typescript/types';
import { COLORS } from './theme';

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 10,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    onPrimary: COLORS.white,
    background: COLORS.bg,
    onBackground: COLORS.text,
    surface: COLORS.surface,
    onSurface: COLORS.text,
    error: COLORS.danger,
    onError: COLORS.white,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 10,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primary,
    onPrimary: COLORS.white,
    background: COLORS.darkBg,
    onBackground: COLORS.white,
    surface: COLORS.darkSurface,
    onSurface: COLORS.white,
    error: COLORS.danger,
    onError: COLORS.white,
  },
};

export function getPaperTheme(scheme: ColorSchemeName = 'light'): MD3Theme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}
