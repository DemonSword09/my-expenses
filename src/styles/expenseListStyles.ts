// src/styles/expenseListStyles.ts
import { StyleSheet } from 'react-native';
import { globalStyles } from './globalStyles';
import { COLORS, getThemeColors, SPACING, RADIUS, SHADOWS } from './theme';

export const expenseListStyles = (scheme: any) => {
  const g = globalStyles(scheme);
  const schemeColors = getThemeColors(scheme);
  const colors = COLORS;

  return StyleSheet.create({
    // reuse container from global
    container: g.container,
    containerDark: { ...g.container, backgroundColor: schemeColors.bgDark },

    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: schemeColors.bgMid, // Surface
      marginHorizontal: SPACING.xl,
      marginBottom: SPACING.md,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      ...SHADOWS.md, // Medium shadow for cards
      borderWidth: 1,
      borderColor: schemeColors.border,
    },

    itemBody: { flex: 1, paddingRight: SPACING.sm },
    itemTitle: { fontSize: 15, fontWeight: '700', marginBottom: SPACING.xxs, color: schemeColors.textStrong },
    itemSubtitle: { fontSize: 13, color: schemeColors.textMuted },

    itemRight: { alignItems: 'flex-end', marginRight: SPACING.md },
    itemDate: { fontSize: 13, color: schemeColors.textMuted, marginBottom: SPACING.xs },
    itemAmount: { fontSize: 16, fontWeight: '600', color: schemeColors.textStrong },

    categoryRight: { width: 36, alignItems: 'center', marginRight: SPACING.sm, justifyContent: 'center' },
    catFallback: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.sm,
      backgroundColor: colors.gray100 ?? '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    catFallbackText: { fontWeight: '700', color: schemeColors.textStrong },

    deletedLine: g.deletedLine,

    // CSV Menu Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-start', // Align to top
      alignItems: 'flex-end', // Align to right
    },
    menuContainer: {
      width: 180,
      marginTop: 40, // Approximate offset for Status Bar
      marginRight: SPACING.sm,
      borderRadius: RADIUS.sm,
      paddingVertical: SPACING.sm,
      backgroundColor: schemeColors.bgMid,
      ...SHADOWS.md,
      borderWidth: 1,
      borderColor: schemeColors.border,
    },
    menuItem: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
    },
    menuText: {
      fontSize: 16,
      color: schemeColors.textStrong,
    },

    // Header & List
    header: {
      backgroundColor: schemeColors.bgDark,
    },
    headerTitleSelected: {
      fontWeight: 'bold',
      color: schemeColors.textStrong,
    },
    headerTitleText: {
      fontWeight: 'bold',
      fontSize: 18,
      color: schemeColors.textStrong,
    },
    headerBalanceText: {
      fontSize: 14,
      color: schemeColors.textStrong,
    },
    menuDivider: {
      height: 1,
      backgroundColor: schemeColors.border,
    },
    listContent: {
      paddingBottom: 120, // Keep large padding for FAB
    },
    emptyState: {
      alignItems: 'center',
      marginTop: SPACING.block,
    },
  });
};
