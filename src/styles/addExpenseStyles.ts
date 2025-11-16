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
  });
};
