import { ColorSchemeName } from 'react-native';

export const LIGHT = 'light';
export const DARK = 'dark';

// 1. Core HSL Generator
const hsl = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`;
const hsla = (h: number, s: number, l: number, a: number) => `hsla(${h}, ${s}%, ${l}%, ${a})`;

// 2. Configuration & Presets
const BRAND_HUE = 220; // Matches original #2F6BFF
const PRESETS = {
  hue: BRAND_HUE,
  neutralSat: 25, // Subtle tint for neutrals
};

// 3. Generators
const generateNeutrals = (isDark: boolean) => {
  // Dark Mode: Tinted darks
  // Light Mode: Tinted whites/grays

  if (isDark) {
    return {
      bgDark: hsl(PRESETS.hue, PRESETS.neutralSat, 4),     // Base / Darkest (Tinted)
      bgMid: hsl(PRESETS.hue, PRESETS.neutralSat, 10),     // Surface / Mid (Tinted)
      bgLight: hsl(PRESETS.hue, PRESETS.neutralSat, 16),   // Elevated / Lightest (Tinted)
      textStrong: hsl(PRESETS.hue, 15, 96),                // White with slight cool tint
      textMuted: hsl(PRESETS.hue, 10, 65),                 // Gray with slight cool tint
      border: hsl(PRESETS.hue, 15, 20),
      highlight: hsl(PRESETS.hue, 15, 28),
    };
  } else {
    // Light Mode
    return {
      bgDark: hsl(PRESETS.hue, PRESETS.neutralSat, 96),    // Base / Darkest (Cool Gray)
      bgMid: hsl(PRESETS.hue, PRESETS.neutralSat, 99),     // Surface (Almost White, cool tint)
      bgLight: hsl(PRESETS.hue, PRESETS.neutralSat, 100),  // Elevated (Pure White-ish)
      textStrong: hsl(PRESETS.hue, 20, 10),                // Deep Dark Blue/Gray
      textMuted: hsl(PRESETS.hue, 15, 45),                 // Mid Cool Gray
      border: hsl(PRESETS.hue, 15, 90),
      highlight: hsl(PRESETS.hue, 10, 100),
    };
  }
};

const generateBrand = (isDark: boolean) => {
  // Primary Brand Colors
  const baseL = 60;

  return {
    primary: hsl(PRESETS.hue, 100, baseL),
    primaryHover: hsl(PRESETS.hue, 100, baseL + 6),
    primaryActive: hsl(PRESETS.hue, 100, baseL - 10),
    success: hsl(142, 70, 45),
    warning: hsl(35, 90, 50),
    error: hsl(0, 80, 60),
  };
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  block: 48,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const LINE_HEIGHT = {
  xs: 14,
  sm: 16,
  md: 20,
  base: 24,
  lg: 28,
  xl: 32,
  xxl: 36,
  xxxl: 40,
};

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

// Depth System (Platform compatible)
export const SHADOWS = {
  sm: {
    shadowColor: hsl(PRESETS.hue, 20, 5),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, // Reduced from 0.15
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: hsl(PRESETS.hue, 25, 5),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, // Reduced from 0.20
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: hsl(PRESETS.hue, 30, 5),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, // Reduced from 0.25
    shadowRadius: 8,
    elevation: 8,
  },
  // Glow effect (Primary)
  glow: {
    shadowColor: hsl(PRESETS.hue, 100, 60),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20, // Reduced from 0.35
    shadowRadius: 8,
    elevation: 6,
  }
};

// Generate a default 'light' palette for the legacy COLORS export
const defaultPalette = {
  ...generateNeutrals(false),
  ...generateBrand(false),
};

export const COLORS = {
  ...defaultPalette,
  // Legacy mappings
  bg: defaultPalette.bgDark,
  darkBg: hsl(PRESETS.hue, 10, 4),
  surface: defaultPalette.bgMid,
  darkSurface: hsl(PRESETS.hue, 10, 10),
  muted: defaultPalette.textMuted,
  text: defaultPalette.textStrong,
  textMuted: defaultPalette.textMuted,
  divider: defaultPalette.border,
  danger: defaultPalette.error,
  white: '#FFFFFF',
  primaryLight: hsl(PRESETS.hue, 100, 85),
  gray100: hsl(PRESETS.hue, 5, 96),
};

export function getThemeColors(scheme: ColorSchemeName = LIGHT) {
  const isDark = scheme === DARK;
  const neutrals = generateNeutrals(isDark);
  const brand = generateBrand(isDark);

  return {
    ...neutrals,
    ...brand,

    // Legacy Mappings explicitly for the hook
    background: neutrals.bgDark, // Base
    surface: neutrals.bgMid,     // Cards/Surface
    text: neutrals.textStrong,
    textMuted: neutrals.textMuted,
    muted: neutrals.textMuted,
    danger: brand.error,
    divider: neutrals.border,

    // Glass specific
    glassBg: isDark ? hsla(0, 0, 100, 0.08) : hsla(0, 0, 100, 0.6),
    glassBorder: isDark ? hsla(0, 0, 100, 0.1) : hsla(0, 0, 100, 0.4),
    shadow: isDark ? '#000' : '#000',
  };
}
