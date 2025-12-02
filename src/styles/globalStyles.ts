// src/styles/globalStyles.ts
import { StyleSheet, Platform } from 'react-native';
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      height: 64, // Standardize header height
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: schemeColors.text,
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

    // form styles
    formContainer: {
      flex: 1,
      padding: 20,
    },
    formSection: {
      backgroundColor: schemeColors.surface,
      borderRadius: RADIUS.lg,
      marginBottom: 20,
      shadowColor: schemeColors.primary, // Glow color
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15, // Glow intensity
      shadowRadius: 12, // Glow diffusion
      elevation: 4,
      borderWidth: 1,
      borderColor: schemeColors.border,
      overflow: Platform.OS === 'android' ? 'hidden' : 'visible', 
    },
    formRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: schemeColors.divider, // Use divider color
      minHeight: 56,
    },
    formRowLast: {
      borderBottomWidth: 0,
    },
    formLabel: {
      fontSize: 16,
      width: 100,
      color: schemeColors.text,
      fontWeight: '500',
    },
    formInput: {
      flex: 1,
      fontSize: 16,
      color: schemeColors.text,
      textAlign: 'right',
    },
    formValue: {
      flex: 1,
      fontSize: 16,
      color: schemeColors.text,
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
      color: schemeColors.text,
      fontWeight: '500',
    },
    rowInput: {
      flex: 1,
      fontSize: 16,
      color: schemeColors.text,
      textAlign: 'right',
    },
    rowValue: {
      flex: 1,
      fontSize: 16,
      color: schemeColors.text,
      textAlign: 'right',
    },
    rowPlaceholder: {
      color: schemeColors.muted,
    },

    // section header
    sectionHeader: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 8,
      marginTop: 20,
      marginLeft: 20, // Align with card padding
      textTransform: 'uppercase',
      color: '#7C8395',
      letterSpacing: 1,
    },

    // buttons
    primaryButton: {
      backgroundColor: schemeColors.primary,
      height: 52,
      borderRadius: RADIUS.md, // 12px
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: schemeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryButton: {
      backgroundColor: schemeColors.surface,
      height: 52,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: schemeColors.border,
    },
    secondaryButtonText: {
      color: schemeColors.text,
      fontSize: 16,
      fontWeight: '600',
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
