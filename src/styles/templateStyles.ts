// src/styles/templateStyles.ts
import { StyleSheet } from 'react-native';
import { getThemeColors, SPACING, RADIUS, SHADOWS } from './theme';

export const templateStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        // TemplateListItem
        itemContainer: {
            marginHorizontal: SPACING.lg,
            marginBottom: SPACING.md,
            borderRadius: RADIUS.lg,
            ...SHADOWS.md, // Medium shadow for cards
            backgroundColor: schemeColors.bgMid,
        },
        itemContent: {
            flexDirection: 'row',
            padding: SPACING.lg,
            alignItems: 'center',
        },
        itemIconContainer: {
            width: SPACING.block,
            height: SPACING.block,
            borderRadius: RADIUS.md,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: SPACING.md,
            backgroundColor: schemeColors.bgDark, // Base background
        },
        itemInfo: {
            flex: 1,
        },
        itemHeaderRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.xxs,
        },
        itemTitle: {
            fontSize: 16,
            fontWeight: '600',
            flex: 1,
            marginRight: SPACING.sm,
            color: schemeColors.textStrong,
        },
        itemAmountIncome: {
            fontSize: 16,
            fontWeight: '700',
            color: schemeColors.success,
        },
        itemAmountExpense: {
            fontSize: 16,
            fontWeight: '700',
            color: schemeColors.danger, // Assuming danger/error are mapped
        },
        itemDetails: {
            fontSize: 14,
            marginBottom: SPACING.xs,
            color: schemeColors.textMuted,
        },
        itemMeta: {
            fontSize: 12,
            fontWeight: '500',
            color: schemeColors.textMuted,
        },
        itemActions: {
            flexDirection: 'row',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: schemeColors.border,
        },
        actionButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: SPACING.md,
        },
        actionText: {
            fontSize: 14,
            fontWeight: '600',
            color: schemeColors.primary,
        },
        actionDivider: {
            width: StyleSheet.hairlineWidth,
            height: '100%',
            backgroundColor: schemeColors.border,
        },
    });
};
