import { StyleSheet } from 'react-native';
import { getThemeColors, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from './theme';

export const categoryListItemStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        card: {
            borderRadius: RADIUS.lg, // 16
            overflow: 'hidden',
            backgroundColor: schemeColors.surface,
            ...SHADOWS.md, // Shadow for "Pro" feel
            shadowOpacity: 0.05,
            elevation: 2,
        },
        mainRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: SPACING.lg, // 16
        },
        leftContent: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        iconBox: {
            width: 40,
            height: 40,
            borderRadius: RADIUS.md, // 12
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: SPACING.md, // 12
            backgroundColor: schemeColors.bgMid,
        },
        mainLabel: {
            fontSize: FONT_SIZE.base, // 16
            fontWeight: FONT_WEIGHT.semibold, // 600
            marginRight: SPACING.sm, // 8
            color: schemeColors.text,
        },
        actions: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        actionBtn: {
            padding: SPACING.sm, // 8
        },
        childrenContainer: {
            backgroundColor: 'rgba(0,0,0,0.02)', // Very subtle child background
            paddingBottom: SPACING.sm, // 8
        },
        childRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: SPACING.md, // 12
            paddingHorizontal: SPACING.lg, // 16
            borderTopWidth: 1,
            borderTopColor: schemeColors.border,
        },
        childTreeLine: {
            width: 1,
            height: '100%',
            position: 'absolute',
            left: 36, // Align with parent icon center approximately
            top: -20, // Connect up
            backgroundColor: schemeColors.border,
        },
        miniIcon: {
            width: 24,
            height: 24,
            borderRadius: RADIUS.md, // 12 (circle if 24x24) or just generic mapping
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 42, // Indent
            marginRight: SPACING.md, // 12
            backgroundColor: schemeColors.bgMid,
        },
        childLabel: {
            fontSize: 15,
            color: schemeColors.text,
        },
        addChildBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: SPACING.md, // 12
            paddingHorizontal: SPACING.lg, // 16
            borderTopWidth: 1,
            borderTopColor: schemeColors.border,
            marginLeft: 42,
        },
        addChildText: {
            fontSize: FONT_SIZE.md, // 14
            fontWeight: FONT_WEIGHT.semibold, // 600
            marginLeft: SPACING.sm, // 8
            color: schemeColors.primary,
        },
        expandIconContainer: {
            width: 32,
            alignItems: 'center',
        },
        childContentWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        }
    });
};
