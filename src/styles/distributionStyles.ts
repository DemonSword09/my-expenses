import { StyleSheet } from 'react-native';
import { getThemeColors, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, SHADOWS } from './theme';

export const distributionStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        container: {
            flex: 1,
        },
        // Fixed layout, no simple scroll container anymore
        scrollContent: {
            paddingBottom: 40,
            paddingHorizontal: 0,
        },
        totalLabel: {
            fontSize: FONT_SIZE.xs, // 12
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 4,
        },
        totalValue: {
            fontSize: FONT_SIZE.xxl, // 24
            fontWeight: FONT_WEIGHT.bold,
        },
        listContainer: {
            borderTopLeftRadius: RADIUS.xl, // 24
            borderTopRightRadius: RADIUS.xl, // 24
            paddingHorizontal: SPACING.lg, // 16
            // Elevation/Shadow
            ...SHADOWS.md,
            shadowOffset: { width: 0, height: -2 }, // Override for top shadow
            overflow: 'hidden', // Clip top corners
        },
        listTitle: {
            fontSize: 13,
            fontWeight: FONT_WEIGHT.semibold, // 600
            marginBottom: SPACING.md, // 12
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        itemContainer: {
            marginBottom: 0,
        },
        itemHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
        },
        colorDot: {
            width: 12,
            height: 12,
            borderRadius: 6,
            marginRight: SPACING.md, // 12
        },
        itemName: {
            fontSize: FONT_SIZE.base, // 15 originally, keep base (16) or sm (14)? orig was 15. Let's use 15 specific or base. 15 is fine.
            fontWeight: FONT_WEIGHT.medium, // 500
            marginBottom: 2,
        },
        itemPercent: {
            fontSize: FONT_SIZE.sm, // 12
        },
        itemAmount: {
            fontSize: 15,
            fontWeight: FONT_WEIGHT.semibold, // 600
            marginBottom: 2,
        },
        childrenContainer: {
            paddingVertical: SPACING.sm, // 8
            paddingHorizontal: SPACING.md, // 12
            borderRadius: RADIUS.sm, // 8
            marginBottom: SPACING.md, // 12
        },
        childRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: SPACING.sm, // 8
            paddingHorizontal: 4,
        },
        childDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            marginRight: 10,
            marginLeft: 4,
        },
        childName: {
            fontSize: FONT_SIZE.md, // 14
            flex: 1,
        },
        childAmount: {
            fontSize: FONT_SIZE.md, // 14
            fontWeight: FONT_WEIGHT.medium, // 500
        },
    });
};
