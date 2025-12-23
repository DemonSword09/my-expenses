// src/styles/theme.ts
import { ColorSchemeName } from 'react-native';

export const LIGHT = 'light';
export const DARK = 'dark';

export const COLORS = {
  primary: '#2F6BFF',
  primaryLight: '#AFC7FF',
  danger: '#FF4D4F',
  success: '#10B981',
  bg: '#E9ECF4',
  surface: '#FFFFFF', // Solid white as requested (no rgba)
  muted: '#9195A1',
  text: '#111827', // Keep dark text for contrast
  textMuted: '#64748B',
  border: '#E1E4EC', // Solid border color
  divider: '#E1E4EC',
  
  // Dark mode placeholders (can be adjusted if dark mode is a priority, but focusing on the requested light theme for now)
  darkBg: '#0b1220',
  darkSurface: '#1b2236',
  white: '#FFFFFF',
  gray100: '#F3F4F6',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
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
        border: 'rgba(255,255,255,0.1)',
        // Glass specific
        glassBg: 'rgba(255,255,255,0.08)',
        glassBorder: 'rgba(255,255,255,0.1)',
        shadow: '#000',
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
        border: COLORS.border,
        divider: COLORS.divider,
        // Glass specific - slightly more visible on light
        glassBg: 'rgba(255,255,255,0.6)', 
        glassBorder: 'rgba(255,255,255,0.4)',
        shadow: '#000',
      };
}
