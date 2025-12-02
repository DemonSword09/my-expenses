// src/styles/expenseListStyles.ts
import { StyleSheet } from 'react-native';
import { globalStyles } from './globalStyles';
import { COLORS, getThemeColors } from './theme';

export const expenseListStyles = (scheme: any) => {
  const g = globalStyles(scheme);
  const schemeColors = getThemeColors(scheme);
  const colors = COLORS;

  return StyleSheet.create({
    // reuse container from global
    container: g.container,
    containerDark: { ...g.container, backgroundColor: schemeColors.background },

    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: schemeColors.surface,
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: schemeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: schemeColors.border,
    },

    itemBody: { flex: 1, paddingRight: 8 },
    itemTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2, color: schemeColors.text },
    itemSubtitle: { fontSize: 13, color: schemeColors.textMuted },

    itemRight: { alignItems: 'flex-end', marginRight: 12 },
    itemDate: { fontSize: 13, color: schemeColors.textMuted, marginBottom: 6 },
    itemAmount: { fontSize: 16, fontWeight: '600' },

    categoryRight: { width: 36, alignItems: 'center', marginRight: 8, justifyContent: 'center' },
    catFallback: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: colors.gray100 ?? '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    catFallbackText: { fontWeight: '700', color: schemeColors.text },

    deletedLine: g.deletedLine,
  });
};
