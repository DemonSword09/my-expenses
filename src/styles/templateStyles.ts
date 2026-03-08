// src/styles/templateStyles.ts
import { StyleSheet } from 'react-native';
import { getThemeColors, SPACING, RADIUS, SHADOWS, FONT_SIZE, FONT_WEIGHT } from './theme';

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
            fontSize: FONT_SIZE.base, // 16
            fontWeight: FONT_WEIGHT.semibold, // 600
            flex: 1,
            marginRight: SPACING.sm,
            color: schemeColors.textStrong,
        },
        itemAmountIncome: {
            fontSize: FONT_SIZE.base, // 16
            fontWeight: FONT_WEIGHT.bold, // 700
            color: schemeColors.success,
        },
        itemAmountExpense: {
            fontSize: FONT_SIZE.base, // 16
            fontWeight: FONT_WEIGHT.bold, // 700
            color: schemeColors.danger, // Assuming danger/error are mapped
        },
        itemDetails: {
            fontSize: FONT_SIZE.md, // 14
            marginBottom: SPACING.xs,
            color: schemeColors.textMuted,
        },
        itemMeta: {
            fontSize: FONT_SIZE.sm, // 12
            fontWeight: FONT_WEIGHT.medium, // 500
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
            fontSize: FONT_SIZE.md, // 14
            fontWeight: FONT_WEIGHT.semibold, // 600
            color: schemeColors.primary,
        },
        actionDivider: {
            width: StyleSheet.hairlineWidth,
            height: '100%',
            backgroundColor: schemeColors.border,
        },

        // --- TemplatesScreen Specific ---
        container: {
            flex: 1,
            backgroundColor: schemeColors.background,
        },
        header: {
            backgroundColor: schemeColors.background,
            elevation: 0,
        },
        headerTitle: {
            fontWeight: '700',
            color: schemeColors.text,
        },
        headerButton: {
            padding: 4,
        },
        listContent: {
            paddingBottom: 120,
            paddingTop: SPACING.lg, // 16
        },
        emptyState: {
            alignItems: 'center',
            marginTop: 64,
            paddingHorizontal: 32,
        },
        emptyText: {
            fontSize: FONT_SIZE.base, // 16
            textAlign: 'center',
            color: schemeColors.muted,
        },

        // --- TemplateEditor Specific ---
        editorModalHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            height: 64,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: schemeColors.border, // Add this to match usage
        },
        editorContainer: {
            flex: 1,
        },
        editorTitle: {
            fontSize: 17,
            fontWeight: '600',
        },
        editorScrollContent: {
            padding: 20,
        },
        toggle: {
            width: 44,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center',
        },
        toggleKnob: {
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#fff',
            ...SHADOWS.sm,
            shadowOpacity: 0.3,
            shadowRadius: 1,
        },
        chip: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            borderWidth: 1,
            marginRight: 8,
        },
        smallInput: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            width: 80,
            textAlign: 'right',
        },
    });
};
