// src/styles/addExpenseStyles.ts
import { StyleSheet } from 'react-native';
import { globalStyles } from './globalStyles';
import { getThemeColors } from './theme';

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
      color: colors.muted,
    },

    // category modal
    categoryModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    categoryModalTitle: {
      fontWeight: '700',
      fontSize: 16,
      color: colors.text,
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
      fontSize: 15,
      color: colors.text,
    },

    categorySeparator: {
      height: 1,
      backgroundColor: colors.surface,
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
      backgroundColor: colors.surface,
    },
    saveButton: {
      flex: 1,
    },

    // Glass Base (Common)
    glassBase: {
      borderWidth: 1,
      borderColor: colors.glassBorder,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2, 
      shadowRadius: 8,
      elevation: 4,
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
      fontWeight: '600',
      fontSize: 16,
      color: colors.muted,
    },
    glassLabelActive: {
      color: colors.text,
      fontWeight: '700',
    },

    // Glass Save Button
    glassSaveButton: {
      backgroundColor: colors.primary,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    glassSaveButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      textShadowColor: colors.glassBorder,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  });
};
