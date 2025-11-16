// src/styles/globalStyles.ts
import { StyleSheet } from 'react-native';
import { getThemeColors, SPACING, RADIUS, COLORS } from './theme';

export const globalStyles = (scheme: any) => {
  const schemeColors = getThemeColors(scheme);
  const colors = COLORS;
  return StyleSheet.create({
    // containers
    container: {
      flex: 1,
      backgroundColor: schemeColors.background,
    },
    surface: {
      backgroundColor: schemeColors.surface,
    },

    // header row
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING.lg,
      paddingTop: SPACING.md,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: schemeColors.text,
    },

    // buttons / quick-add
    addButton: {
      backgroundColor: schemeColors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: RADIUS.sm,
    },
    addButtonText: {
      color: colors.white,
      fontWeight: '700',
    },

    // floating action button
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: schemeColors.primary,
      elevation: 4,
    },
    fabText: {
      color: colors.white,
      fontSize: 28,
      lineHeight: 28,
    },

    // search block
    searchBlock: {
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    searchInput: {
      backgroundColor: schemeColors.surface,
      borderRadius: RADIUS.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
      color: schemeColors.text,
    },

    // filter pills
    filtersRow: { flexDirection: 'row' },
    filterPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 9999,
      backgroundColor: schemeColors.surface,
      marginRight: 8,
      borderWidth: 0,
    },
    filterPillActive: {
      backgroundColor: schemeColors.primary,
    },
    filterText: {
      color: schemeColors.text,
      fontWeight: '600',
    },
    filterTextActive: {
      color: colors.white,
    },

    // text
    textMuted: {
      color: schemeColors.textMuted,
    },
    textPrimary: {
      color: schemeColors.primary,
    },

    // small shared things
    deletedLine: {
      position: 'absolute',
      top: '60%',
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: schemeColors.danger,
      zIndex: 10,
    },

    // modal sheet (action sheet / confirm)
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: schemeColors.surface,
      padding: 12,
      borderTopLeftRadius: RADIUS.md,
      borderTopRightRadius: RADIUS.md,
    },
    modalRow: { paddingVertical: 12 },
    modalRowText: { fontSize: 16, color: schemeColors.text, paddingLeft: 8 },
  });
};
