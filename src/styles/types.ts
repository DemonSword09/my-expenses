// src/styles/types.ts
import { ColorSchemeName } from 'react-native';

export type ThemeColors = {
  background: string;
  surface: string;
  primary: string;
  danger: string;
  muted: string;
  text: string;
  textMuted: string;
};

export type Scheme = ColorSchemeName | 'light' | 'dark';
