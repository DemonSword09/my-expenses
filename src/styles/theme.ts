// src/styles/theme.ts
import { ColorSchemeName } from 'react-native';

export const LIGHT = 'light';
export const DARK = 'dark';

export const COLORS = {
  primary: '#2563EB',
  danger: '#EF4444',
  success: '#10B981',
  bg: '#F7F7FA',
  surface: '#FFFFFF',
  muted: '#9CA3AF',
  text: '#111827',
  textMuted: '#6B7280',
  darkBg: '#0b1220',
  darkSurface: '#1b2236',
  white: '#FFFFFF',
  gray100: '#F3F4F6',
};

export const SPACING = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
};

export function getThemeColors(scheme: ColorSchemeName = LIGHT) {
  return scheme === DARK
    ? {
        success: COLORS.success,
        background: COLORS.darkBg,
        surface: COLORS.darkSurface,
        primary: COLORS.primary,
        danger: COLORS.danger,
        muted: COLORS.muted,
        text: COLORS.white,
        textMuted: COLORS.muted,
      }
    : {
        success: COLORS.success,
        background: COLORS.bg,
        surface: COLORS.surface,
        primary: COLORS.primary,
        danger: COLORS.danger,
        muted: COLORS.muted,
        text: COLORS.text,
        textMuted: COLORS.textMuted,
      };
}
