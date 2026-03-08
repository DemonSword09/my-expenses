// src/styles/addExpenseStyles.ts
import { StyleSheet } from 'react-native';
import { globalStyles } from './globalStyles';
import { getThemeColors, SHADOWS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from './theme';

export const addExpenseStyles = (scheme: any) => {
  const g = globalStyles(scheme);
  const colors = getThemeColors(scheme);

  return StyleSheet.create({
    // reuse container
    container: g.container,

    // form area
    formInner: {
      paddingHorizontal: 16,
    },

    label: {
      marginBottom: 6,
      color: colors.textMuted,
    },

    // category modal
    categoryModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    categoryModalTitle: {
      fontWeight: FONT_WEIGHT.bold, // 700
      fontSize: FONT_SIZE.base, // 16
      color: colors.textStrong,
    },

    categoryRow: {
      paddingVertical: 12,
      paddingHorizontal: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    categoryRowInner: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryRowText: {
      fontSize: FONT_SIZE.base, // 15 -> 16
      color: colors.textStrong,
    },

    categorySeparator: {
      height: 1,
      backgroundColor: colors.bgMid,
      marginLeft: 0,
    },

    // small utility styles reused across screen
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    // footer actions
    actionsRow: {
      flexDirection: 'row',
      marginTop: 12,
      justifyContent: 'space-between',
    },

    // date button spacing
    dateButton: {
      backgroundColor: colors.bgMid,
    },
    saveButton: {
      flex: 1,
    },

    // Glass Base (Common)
    glassBase: {
      borderWidth: 1,
      borderColor: colors.glassBorder,
      ...SHADOWS.glow, // Use glow for glass elements
    },

    // Glass Jelly Toggle Styles
    glassToggleContainer: {
      flexDirection: 'row',
      width: '100%',
      backgroundColor: colors.glassBg,
      borderRadius: 30,
      padding: 4,
      height: 56,
      position: 'relative',
      overflow: 'hidden',
    },
    glassTrack: {
      flex: 1,
      flexDirection: 'row',
      zIndex: 2,
    },
    glassItem: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    glassActivePill: {
      position: 'absolute',
      width: '50%',
      top: 4,
      bottom: 4,
      borderRadius: 26,
      zIndex: 1,
    },
    glassLabel: {
      fontWeight: FONT_WEIGHT.semibold, // 600
      fontSize: FONT_SIZE.base, // 16
      color: colors.textMuted,
    },
    glassLabelActive: {
      color: colors.textStrong,
      fontWeight: FONT_WEIGHT.bold, // 700
    },

    // Glass Save Button
    glassSaveButton: {
      backgroundColor: colors.primary,
      height: 52,
      borderRadius: RADIUS.lg, // 16
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.glow, // Glow on save
    },
    glassSaveButtonText: {
      color: colors.textStrong,
      fontSize: FONT_SIZE.base, // 16
      fontWeight: FONT_WEIGHT.bold, // 700
      textShadowColor: colors.glassBorder,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },

    // --- AddExpenseForm Specific ---
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg, // 16
      paddingVertical: SPACING.md, // 12
      height: 64,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerButton: {
      padding: 4,
    },
    headerButtonText: {
      color: colors.primary,
      fontSize: 17,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: FONT_WEIGHT.semibold, // 600
      color: colors.text,
    },
    saveButtonText: {
      color: colors.primary,
      fontSize: 17,
      fontWeight: FONT_WEIGHT.semibold, // 600
    },
    bottomSaveButton: {
      marginTop: SPACING.xxl, // 24
    },

    // --- ExpenseFormFields Specific ---
    suggestionsContainer: {
      backgroundColor: colors.surface,
      opacity: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md, // 12
      marginTop: 4,
      maxHeight: 150,
      position: 'absolute',
      top: 40,
      right: 0,
      minWidth: 150,
      zIndex: 1000,
      ...SHADOWS.sm,
    },
    suggestionItem: {
      padding: SPACING.md, // 12
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    suggestionText: {
      color: colors.text,
    },
    errorTooltip: {
      position: 'absolute',
      bottom: -20,
      right: 12,
      backgroundColor: colors.danger,
      paddingHorizontal: SPACING.sm, // 8
      paddingVertical: 2,
      borderRadius: 4,
    },
    errorText: {
      color: '#fff',
      fontSize: FONT_SIZE.xs, // 10->12? Original was 12
      fontWeight: FONT_WEIGHT.semibold, // 600
    },
    rowContainer: {
      justifyContent: 'center',
      paddingVertical: 12,
    },
    dateValue: {
      flex: 1,
      alignItems: 'flex-end',
    },
    categoryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
  });
};
