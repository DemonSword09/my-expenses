// src/styles/globalStyles.ts
import { StyleSheet, Platform } from 'react-native';
import { getThemeColors, SPACING, RADIUS, COLORS, SHADOWS } from './theme';

export const globalStyles = (scheme: any) => {
  const schemeColors = getThemeColors(scheme);
  const colors = COLORS;
  return StyleSheet.create({
    // containers
    container: {
      flex: 1,
      backgroundColor: schemeColors.bgDark, // Base
    },
    surface: {
      backgroundColor: schemeColors.bgMid, // Surface
    },

    // header row
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      height: 64, // Standardize header height
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: schemeColors.textStrong,
      textAlign: 'center',
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
      ...SHADOWS.glow, // Restored glow
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
      backgroundColor: schemeColors.bgMid,
      borderRadius: RADIUS.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
      color: schemeColors.textStrong,
    },

    // generic input
    input: {
      backgroundColor: schemeColors.bgMid,
      borderRadius: RADIUS.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: schemeColors.textStrong,
      borderWidth: 1,
      borderColor: schemeColors.border,
    },

    // filter pills
    filtersRow: { flexDirection: 'row' },
    filterPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 9999,
      backgroundColor: schemeColors.bgMid,
      marginRight: 8,
      borderWidth: 1,
      borderColor: schemeColors.border, // Subtle border
    },
    filterPillActive: {
      backgroundColor: schemeColors.primary,
      borderColor: schemeColors.primary,
    },
    filterText: {
      color: schemeColors.textStrong,
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

    // form styles
    formContainer: {
      flex: 1,
      padding: 20,
    },
    formSection: {
      backgroundColor: schemeColors.bgMid,
      borderRadius: RADIUS.lg,
      marginBottom: 20,
      ...SHADOWS.glow, // Restored glow
      shadowOpacity: 0.15, // Tweak opacity for form section specifically if needed
      borderWidth: 1,
      borderColor: schemeColors.border,
      overflow: 'visible',
    },
    formRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: schemeColors.border, // Use border token
      minHeight: 56,
    },
    formRowLast: {
      borderBottomWidth: 0,
    },
    formLabel: {
      fontSize: 16,
      width: 100,
      color: schemeColors.textStrong,
      fontWeight: '500',
    },
    formInput: {
      flex: 1,
      fontSize: 16,
      color: schemeColors.textStrong,
      textAlign: 'right',
    },
    formValue: {
      flex: 1,
      fontSize: 16,
      color: schemeColors.textStrong,
      textAlign: 'right',
    },

    // row styles (for settings-style lists)
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: schemeColors.border,
    },
    rowLabel: {
      fontSize: 16,
      width: 100,
      color: schemeColors.textStrong,
      fontWeight: '500',
    },
    rowInput: {
      flex: 1,
      fontSize: 16,
      color: schemeColors.textStrong,
      textAlign: 'right',
    },
    rowValue: {
      flex: 1,
      fontSize: 16,
      color: schemeColors.textStrong,
      textAlign: 'right',
    },
    rowPlaceholder: {
      color: schemeColors.textMuted,
    },

    // section header
    sectionHeader: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 8,
      marginTop: 20,
      marginLeft: 20, // Align with card padding
      textTransform: 'uppercase',
      color: schemeColors.textMuted,
      letterSpacing: 1,
    },

    // buttons
    primaryButton: {
      backgroundColor: schemeColors.primary,
      height: 52,
      borderRadius: RADIUS.md, // 12px
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.glow, // Restored glow
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryButton: {
      backgroundColor: schemeColors.bgMid,
      height: 52,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: schemeColors.border,
    },
    secondaryButtonText: {
      color: schemeColors.textStrong,
      fontSize: 16,
      fontWeight: '600',
    },

    // modal sheet (action sheet / confirm)
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: schemeColors.bgMid,
      padding: 12,
      borderTopLeftRadius: RADIUS.md,
      borderTopRightRadius: RADIUS.md,
      ...SHADOWS.lg,
    },
    modalRow: { paddingVertical: 12, flexDirection: 'row' },
    modalRowText: { fontSize: 16, color: schemeColors.textStrong, paddingLeft: 8 },

    // Glass Base (available globally)
    glassBase: {
      borderWidth: 1,
      borderColor: schemeColors.glassBorder,
      ...SHADOWS.sm,
    },
  });
};
